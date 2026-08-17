import { describe, it, expect } from 'bun:test'
import { resolveRef, resolveSchema, isQuantitySpec } from '../schemaUtils'
import { validateItemData, getItemSchema } from '../schemaValidation'
import v26_2Schema from '../../../public/data/versions/26.2/schema.json'
import type { ItemData } from '../../types/minecraft'

describe('schemaUtils & schemaValidation with versioned schema', () => {
    const rawBiomesField = {
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
        const biomeEnum = schemaObj.definitions?.biomeEnum as { enum?: string[] }
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
        expect(defaultErrors.get('obtaining.naturalGeneration.biomes.0')).toBeDefined()

        // 26.2 schema knows sulfur_caves -> should pass with 0 errors
        const v26Errors = validateItemData(sulfurBlockItem, undefined, v26_2Schema)
        expect(v26Errors.size).toBe(0)
    })
})
