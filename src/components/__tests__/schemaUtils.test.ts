import { describe, it, expect } from 'bun:test'
import Ajv from 'ajv'
import { resolveSchema, isQuantitySpec } from '../schemaUtils'
import { validateItemData, getItemSchema } from '../schemaValidation'
import v26_2Schema from '../../../public/data/versions/26.2/schema.json'
import v26_3Schema from '../../../public/data/versions/26.3/schema.json'
import v26_3ItemsCatalog from '../../../public/data/versions/26.3/items.json'
import v26_3StructureToChest from '../../../public/data/versions/26.3/structure_to_chest.json'
import type { ItemData } from '../../types/minecraft'
import type { JsonSchemaProperty } from '../schema-types'

describe('schemaUtils & schemaValidation with versioned schema', () => {
    const rawBiomesField: JsonSchemaProperty = {
        type: 'array',
        description: 'Biomes where the item generates naturally',
        items: {
            $ref: '#/definitions/biomeEnum',
        },
    }

    it('resolves biomeEnum against default schema (without sulfur_caves)', () => {
        const resolved = resolveSchema(rawBiomesField)
        const enumValues = (resolved.items as { enum?: string[] })?.enum ?? []
        expect(enumValues.includes('sulfur_caves')).toBe(false)
        expect(enumValues.includes('plains')).toBe(true)
    })

    it('resolves biomeEnum against 26.2 versioned schema (with sulfur_caves)', () => {
        const resolved = resolveSchema(rawBiomesField, v26_2Schema)
        const enumValues = (resolved.items as { enum?: string[] })?.enum ?? []
        expect(enumValues.includes('sulfur_caves')).toBe(true)
        expect(enumValues.includes('plains')).toBe(true)
    })

    it('getItemSchema extracts definitions and properties from 26.2 schema', () => {
        const schemaObj = getItemSchema(v26_2Schema)
        const biomeEnum = schemaObj.definitions?.biomeEnum as {
            enum?: string[]
        }
        expect(biomeEnum?.enum?.includes('sulfur_caves')).toBe(true)
    })

    it('validates item with sulfur_caves correctly against 26.2 schema vs default schema', () => {
        const sulfurBlockItem: ItemData = {
            displayName: 'Sulfur',
            displayNameGerman: 'Schwefel',
            stackSize: 64,
            renewable: 'no',
            rarityTier: 'common',
            isBlock: true,
            craftingIngredient: true,
            isArmorTrimMaterial: false,
            block: {
                blastResistance: 1.5,
                hardness: 1.5,
                flammable: false,
                catchesFire: false,
                isBlockEntity: false,
                waterloggable: false,
                transparency: 'opaque',
                luminousLevel: 0,
                bestTools: ['pickaxe'],
            },
            obtaining: {
                obtainability: 'survival',
                difficultyToObtain: 2,
                craftable: false,
                naturalGeneration: {
                    dimensions: ['overworld'],
                    biomes: ['sulfur_caves'],
                },
            },
        }

        // Default schema does not know sulfur_caves -> should report error
        const defaultErrors = validateItemData(sulfurBlockItem)
        expect(defaultErrors.size).toBeGreaterThan(0)
        expect(
            defaultErrors.get('obtaining.naturalGeneration.biomes.0')
        ).toBeDefined()

        // 26.2 schema knows sulfur_caves -> should pass with 0 errors
        const v26Errors = validateItemData(
            sulfurBlockItem,
            undefined,
            v26_2Schema
        )
        expect(v26Errors.size).toBe(0)
    })

    it('validates 26.3 root catalog wrapper and rejects incomplete or mislabeled catalogs', () => {
        const ajv = new Ajv({ allErrors: true, strict: false })
        const validateRoot = ajv.compile(v26_3Schema)

        expect(validateRoot({})).toBe(false)
        expect(
            validateRoot({
                minecraft_version: '26.2',
                items: {},
            })
        ).toBe(false)
        expect(validateRoot(v26_3ItemsCatalog)).toBe(true)
    })

    it('validates every item in 26.3/items.json with 0 errors', () => {
        const items = v26_3ItemsCatalog.items as unknown as Record<
            string,
            ItemData
        >
        const failing: Array<{ id: string; errors: Record<string, string> }> =
            []
        for (const [id, item] of Object.entries(items)) {
            const errs = validateItemData(item, undefined, v26_3Schema)
            if (errs.size > 0) {
                failing.push({
                    id,
                    errors: Object.fromEntries(
                        [...errs.entries()].map(([k, v]) => [k, v.message])
                    ),
                })
            }
        }
        expect(failing).toEqual([])
    })

    it('enforces quantitySpec nonnegative bounds, positive enchantment levels, and min <= max', () => {
        const schemaObj = getItemSchema(v26_3Schema)
        expect(
            isQuantitySpec(
                schemaObj.definitions.quantitySpec as JsonSchemaProperty
            )
        ).toBe(true)
        expect(
            isQuantitySpec(
                schemaObj.definitions.enchantmentLevelsSpec as JsonSchemaProperty
            )
        ).toBe(true)

        const baseObtaining: NonNullable<ItemData['obtaining']> = {
            obtainability: 'survival',
            difficultyToObtain: 1,
            craftable: false,
            mobLoot: [
                {
                    mob: 'zombie',
                    chance: 0.5,
                    quantity: { min: 0, max: 2 },
                },
            ],
        }

        const baseItem: ItemData = {
            displayName: 'Test Stick',
            displayNameGerman: 'Teststock',
            stackSize: 64,
            renewable: 'yes',
            rarityTier: 'common',
            isBlock: false,
            craftingIngredient: false,
            isArmorTrimMaterial: false,
            item: { fireResistant: false },
            obtaining: baseObtaining,
        }

        // Zero lower bound in loot is valid
        expect(validateItemData(baseItem, undefined, v26_3Schema).size).toBe(0)

        // Negative loot quantity is rejected
        const negativeLoot: ItemData = {
            ...baseItem,
            obtaining: {
                ...baseObtaining,
                mobLoot: [{ mob: 'zombie', chance: 0.5, quantity: -2 }],
            },
        }
        expect(
            validateItemData(negativeLoot, undefined, v26_3Schema).size
        ).toBeGreaterThan(0)

        // min > max in loot is rejected
        const invertedRange: ItemData = {
            ...baseItem,
            obtaining: {
                ...baseObtaining,
                mobLoot: [
                    {
                        mob: 'zombie',
                        chance: 0.5,
                        quantity: { min: 5, max: 4 },
                    },
                ],
            },
        }
        const invertedErrors = validateItemData(
            invertedRange,
            undefined,
            v26_3Schema
        )
        expect(invertedErrors.get('obtaining.mobLoot.0.quantity')).toBeDefined()

        // Enchantment levels allow >= 1 and reject 0
        const validEnchant: ItemData = {
            ...baseItem,
            possibleEnchantments: [
                { id: 'unbreaking', levels: { min: 1, max: 3 } },
            ],
        }
        expect(
            validateItemData(validEnchant, undefined, v26_3Schema).size
        ).toBe(0)

        const zeroEnchant: ItemData = {
            ...baseItem,
            possibleEnchantments: [{ id: 'unbreaking', levels: 0 }],
        }
        expect(
            validateItemData(zeroEnchant, undefined, v26_3Schema).size
        ).toBeGreaterThan(0)
    })

    it('keeps 26.3 structure_to_chest.json in sync with schema.json container rules', () => {
        const s2c = v26_3StructureToChest.structureToChestMapping as Record<
            string,
            string[]
        >

        const allOf = (
            v26_3Schema as {
                properties: {
                    items: {
                        additionalProperties: {
                            properties: {
                                obtaining: {
                                    properties: {
                                        generatedLoot: {
                                            properties: {
                                                structures: {
                                                    items: {
                                                        allOf: Array<{
                                                            if: {
                                                                properties: {
                                                                    structure: {
                                                                        const?: string
                                                                        enum?: string[]
                                                                    }
                                                                }
                                                            }
                                                            then: {
                                                                properties: {
                                                                    chests: {
                                                                        maxItems?: number
                                                                        items?: {
                                                                            properties: {
                                                                                chestName: {
                                                                                    const?: string
                                                                                    enum?: string[]
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }>
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ).properties.items.additionalProperties.properties.obtaining.properties
            .generatedLoot.properties.structures.items.allOf

        const schemaChestMap: Record<string, string[]> = {}
        for (const rule of allOf) {
            const structSpec = rule.if.properties.structure
            const structs = structSpec.const
                ? [structSpec.const]
                : (structSpec.enum ?? [])
            const chestsSpec = rule.then.properties.chests
            const allowedChests =
                chestsSpec.maxItems === 0
                    ? []
                    : chestsSpec.items?.properties.chestName.const
                      ? [chestsSpec.items.properties.chestName.const]
                      : (chestsSpec.items?.properties.chestName.enum ?? [])
            for (const st of structs) {
                schemaChestMap[st] = [...allowedChests].sort()
            }
        }

        expect(Object.keys(s2c).sort()).toEqual(
            Object.keys(schemaChestMap).sort()
        )
        for (const [structure, chests] of Object.entries(s2c)) {
            expect([...chests].sort()).toEqual(schemaChestMap[structure] ?? [])
        }
    })
})
