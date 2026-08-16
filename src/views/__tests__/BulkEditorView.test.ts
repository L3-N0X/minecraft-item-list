import { describe, it, expect } from 'bun:test'
import {
    BASE_EDITABLE_FIELDS,
    applyPatch,
    cleanEmptyObjects,
    type EditableFieldConfig,
} from '../BulkEditorView'
import type { ItemData } from '../../types/minecraft'
import { validateItemData } from '../../components/schemaValidation'

describe('BulkEditorView - Field Configurations', () => {
    it('contains all required field groups and expected fields', () => {
        const labels = BASE_EDITABLE_FIELDS.map((f) => f.label)

        // General
        expect(labels).toContain('Is Block')
        expect(labels).toContain('Renewable')
        expect(labels).toContain('Stack Size')
        expect(labels).toContain('Rarity Tier')
        expect(labels).toContain('Crafting Ingredient')
        expect(labels).toContain('Is Armor Trim Material')

        // Obtaining & Recipes
        expect(labels).toContain('Obtainability')
        expect(labels).toContain('Craftable')
        expect(labels).toContain('Difficulty to Obtain')
        expect(labels).toContain('Recipe Shape')

        // Natural Generation
        expect(labels).toContain('Nat. Gen Biomes')
        expect(labels).toContain('Nat. Gen Dimensions')
        expect(labels).toContain('Nat. Gen Structures')
        expect(labels).toContain('Nat. Gen Comment')
        expect(labels).toContain('Nat. Gen Structure Comment')

        // Block Properties
        expect(labels).toContain('Blast Resistance')
        expect(labels).toContain('Hardness')
        expect(labels).toContain('Luminous Level')
        expect(labels).toContain('Transparency')
        expect(labels).toContain('Waterloggable')
        expect(labels).toContain('Is Block Entity')
        expect(labels).toContain('Best Tools')
        expect(labels).toContain('Flammable')
        expect(labels).toContain('Catches Fire')

        // Item & Combat
        expect(labels).toContain('Durability')
        expect(labels).toContain('Enchantability')
        expect(labels).toContain('Fire Resistant')
        expect(labels).toContain('Attack Damage')
        expect(labels).toContain('Attack Speed')
        expect(labels).toContain('Armor Points')
        expect(labels).toContain('Armor Toughness')
        expect(labels).toContain('Knockback Resistance')

        // Breaking
        expect(labels).toContain('Requires Silk Touch')
        expect(labels).toContain('Instant Breaking')
        expect(labels).toContain('Requires Special Tools to Drop')

        // Edible
        expect(labels).toContain('Hunger')
        expect(labels).toContain('Saturation')
        expect(labels).toContain('Always Consumable')

        // Fuel & Compostable
        expect(labels).toContain('Compost Chance')
        expect(labels).toContain('Fuel Burn Time (seconds)')
        expect(labels).toContain('Fuel Smelted Items')
    })
})

describe('BulkEditorView - applyPatch operations', () => {
    const baseItem: ItemData = {
        displayName: 'Test Item',
        displayNameGerman: 'Test Gegenstand',
        stackSize: 64,
        renewable: 'yes',
        rarityTier: 'common',
        isBlock: false,
        craftingIngredient: false,
        isArmorTrimMaterial: false,
        obtaining: {
            obtainability: 'survival',
            craftable: false,
            difficultyToObtain: 1,
        },
    }

    it('handles boolean field operations: set, toggle, clear', () => {
        const field: EditableFieldConfig = {
            label: 'Craftable',
            group: 'Obtaining & Recipes',
            path: ['obtaining', 'craftable'],
            type: 'boolean',
        }

        // Set true
        const setTrue = applyPatch(baseItem, field, 'set', 'true')
        expect(setTrue.obtaining?.craftable).toBe(true)

        // Set false
        const setFalse = applyPatch(setTrue, field, 'set', 'false')
        expect(setFalse.obtaining?.craftable).toBe(false)

        // Toggle
        const toggled = applyPatch(setFalse, field, 'toggle', '')
        expect(toggled.obtaining?.craftable).toBe(true)

        // Clear
        const cleared = applyPatch(toggled, field, 'clear', '')
        expect(cleared.obtaining?.craftable).toBeUndefined()
    })

    it('handles isBlock root switch and clears opposite section', () => {
        const itemWithItemSection: ItemData = {
            ...baseItem,
            isBlock: false,
            item: {
                durability: 250,
                fireResistant: false,
            },
        }

        const isBlockField: EditableFieldConfig = {
            label: 'Is Block',
            group: 'General',
            path: ['isBlock'],
            type: 'boolean',
        }

        // Switch to block -> deletes item section
        const asBlock = applyPatch(itemWithItemSection, isBlockField, 'set', 'true')
        expect(asBlock.isBlock).toBe(true)
        expect(asBlock.item).toBeUndefined()

        // Switch back to non-block -> deletes block section
        const blockWithProps: ItemData = {
            ...asBlock,
            block: {
                blastResistance: 3,
                hardness: 1.5,
                luminousLevel: 0,
                transparency: 'opaque',
                waterloggable: false,
                isBlockEntity: false,
                bestTools: ['pickaxe'],
                flammable: false,
                catchesFire: false,
            },
        }
        const asNonBlock = applyPatch(blockWithProps, isBlockField, 'set', 'false')
        expect(asNonBlock.isBlock).toBe(false)
        expect(asNonBlock.block).toBeUndefined()
    })

    it('handles number field operations: set, add, multiply, clear', () => {
        const field: EditableFieldConfig = {
            label: 'Hardness',
            group: 'Block Properties',
            path: ['block', 'hardness'],
            type: 'number',
        }

        // Set
        const setNum = applyPatch(baseItem, field, 'set', '5')
        expect(setNum.block?.hardness).toBe(5)

        // Add
        const added = applyPatch(setNum, field, 'add', '2.5')
        expect(added.block?.hardness).toBe(7.5)

        // Subtract (add negative)
        const subtracted = applyPatch(added, field, 'add', '-1.5')
        expect(subtracted.block?.hardness).toBe(6)

        // Multiply
        const multiplied = applyPatch(subtracted, field, 'multiply', '2')
        expect(multiplied.block?.hardness).toBe(12)

        // Clear
        const cleared = applyPatch(multiplied, field, 'clear', '')
        expect(cleared.block?.hardness).toBeUndefined()
    })

    it('handles enum fields: set, clear, stackSize numeric parsing', () => {
        const stackField: EditableFieldConfig = {
            label: 'Stack Size',
            group: 'General',
            path: ['stackSize'],
            type: 'enum',
            options: ['1', '16', '64'],
        }

        const setStack = applyPatch(baseItem, stackField, 'set', '16')
        expect(setStack.stackSize).toBe(16)

        const rarityField: EditableFieldConfig = {
            label: 'Rarity Tier',
            group: 'General',
            path: ['rarityTier'],
            type: 'enum',
            options: ['common', 'uncommon', 'rare', 'epic'],
        }

        const setRarity = applyPatch(baseItem, rarityField, 'set', 'epic')
        expect(setRarity.rarityTier).toBe('epic')

        const cleared = applyPatch(setRarity, rarityField, 'clear', '')
        expect(cleared.rarityTier).toBeUndefined()
    })

    it('handles string fields: set, empty string pruning, clear', () => {
        const field: EditableFieldConfig = {
            label: 'Nat. Gen Comment',
            group: 'Natural Generation',
            path: ['obtaining', 'naturalGeneration', 'comment'],
            type: 'string',
        }

        const setStr = applyPatch(baseItem, field, 'set', 'Found underground')
        expect(setStr.obtaining?.naturalGeneration?.comment).toBe('Found underground')
        expect(setStr.obtaining?.naturalGeneration?.dimensions).toEqual(['overworld'])

        // Empty string deletes property
        const emptyStr = applyPatch(setStr, field, 'set', '   ')
        expect(emptyStr.obtaining?.naturalGeneration).toBeUndefined()

        // Clear
        const setAgain = applyPatch(baseItem, field, 'set', 'Found in caves')
        const cleared = applyPatch(setAgain, field, 'clear', '')
        expect(cleared.obtaining?.naturalGeneration).toBeUndefined()
    })

    it('handles multi-enum fields: Recipe Shape (set, add, remove, clear)', () => {
        const recipeField: EditableFieldConfig = {
            label: 'Recipe Shape',
            group: 'Obtaining & Recipes',
            path: ['obtaining', 'recipeShape'],
            type: 'multi-enum',
        }

        // Set
        const setItem = applyPatch(baseItem, recipeField, 'set', '', ['3x3_crafting', 'smelting'])
        expect(setItem.obtaining?.recipeShape).toEqual(['3x3_crafting', 'smelting'])

        // Add
        const addedItem = applyPatch(setItem, recipeField, 'add', '', ['blasting', 'smelting'])
        expect(addedItem.obtaining?.recipeShape).toEqual(['3x3_crafting', 'smelting', 'blasting'])

        // Remove
        const removedItem = applyPatch(addedItem, recipeField, 'remove', '', ['smelting'])
        expect(removedItem.obtaining?.recipeShape).toEqual(['3x3_crafting', 'blasting'])

        // Clear
        const clearedItem = applyPatch(removedItem, recipeField, 'clear', '', [])
        expect(clearedItem.obtaining?.recipeShape).toBeUndefined()
    })

    it('handles naturalGeneration schema integrity: biomes, structures, dimensions', () => {
        const biomesField: EditableFieldConfig = {
            label: 'Nat. Gen Biomes',
            group: 'Natural Generation',
            path: ['obtaining', 'naturalGeneration', 'biomes'],
            type: 'multi-enum',
        }

        const structuresField: EditableFieldConfig = {
            label: 'Nat. Gen Structures',
            group: 'Natural Generation',
            path: ['obtaining', 'naturalGeneration', 'partOfStructures', 'structures'],
            type: 'multi-enum',
        }

        // Adding biomes automatically sets dimensions to ['overworld']
        const withBiomes = applyPatch(baseItem, biomesField, 'set', '', ['plains', 'forest'])
        expect(withBiomes.obtaining?.naturalGeneration?.biomes).toEqual(['plains', 'forest'])
        expect(withBiomes.obtaining?.naturalGeneration?.dimensions).toEqual(['overworld'])

        // Adding structures maintains/adds dimensions
        const withStructs = applyPatch(withBiomes, structuresField, 'add', '', ['village_plains'])
        expect(withStructs.obtaining?.naturalGeneration?.partOfStructures?.structures).toEqual(['village_plains'])

        // Removing all biomes but keeping structures retains naturalGen and dimensions
        const noBiomes = applyPatch(withStructs, biomesField, 'remove', '', ['plains', 'forest'])
        expect(noBiomes.obtaining?.naturalGeneration?.biomes).toBeUndefined()
        expect(noBiomes.obtaining?.naturalGeneration?.partOfStructures?.structures).toEqual(['village_plains'])
        expect(noBiomes.obtaining?.naturalGeneration?.dimensions).toEqual(['overworld'])

        // Removing all structures cleans up partOfStructures and whole naturalGeneration
        const noStructs = applyPatch(noBiomes, structuresField, 'remove', '', ['village_plains'])
        expect(noStructs.obtaining?.naturalGeneration).toBeUndefined()
    })

    it('handles explicit dimension modifications', () => {
        const dimField: EditableFieldConfig = {
            label: 'Nat. Gen Dimensions',
            group: 'Natural Generation',
            path: ['obtaining', 'naturalGeneration', 'dimensions'],
            type: 'multi-enum',
        }

        // Set dimensions explicitly
        const setNether = applyPatch(baseItem, dimField, 'set', '', ['nether'])
        expect(setNether.obtaining?.naturalGeneration?.dimensions).toEqual(['nether'])

        // Add dimensions
        const addEnd = applyPatch(setNether, dimField, 'add', '', ['the_end'])
        expect(addEnd.obtaining?.naturalGeneration?.dimensions).toEqual(['nether', 'the_end'])

        // Remove dimension
        const removeNether = applyPatch(addEnd, dimField, 'remove', '', ['nether'])
        expect(removeNether.obtaining?.naturalGeneration?.dimensions).toEqual(['the_end'])

        // Clear dimensions
        const clearedDim = applyPatch(removeNether, dimField, 'clear', '', [])
        expect(clearedDim.obtaining?.naturalGeneration).toBeUndefined()
    })

    it('handles edible, combat, breaking, fuel and compostable properties', () => {
        const attackDamageField: EditableFieldConfig = {
            label: 'Attack Damage',
            group: 'Item & Combat',
            path: ['item', 'damage', 'attackDamage'],
            type: 'number',
        }
        const armorPointsField: EditableFieldConfig = {
            label: 'Armor Points',
            group: 'Item & Combat',
            path: ['item', 'armor', 'armorPoints'],
            type: 'number',
        }
        const hungerField: EditableFieldConfig = {
            label: 'Hunger',
            group: 'Edible',
            path: ['edible', 'hunger'],
            type: 'number',
        }
        const alwaysConsumableField: EditableFieldConfig = {
            label: 'Always Consumable',
            group: 'Edible',
            path: ['edible', 'alwaysConsumable'],
            type: 'boolean',
        }
        const compostChanceField: EditableFieldConfig = {
            label: 'Compost Chance',
            group: 'Fuel & Compostable',
            path: ['compostable', 'chance'],
            type: 'number',
        }
        const bestToolsField: EditableFieldConfig = {
            label: 'Best Tools',
            group: 'Block Properties',
            path: ['block', 'bestTools'],
            type: 'multi-enum',
        }
        const specialToolsField: EditableFieldConfig = {
            label: 'Requires Special Tools to Drop',
            group: 'Breaking',
            path: ['breaking', 'requiresSpecialToolsToDrop'],
            type: 'multi-enum',
        }

        let item = applyPatch(baseItem, attackDamageField, 'set', '9')
        item = applyPatch(item, armorPointsField, 'set', '3')
        item = applyPatch(item, hungerField, 'set', '4')
        item = applyPatch(item, alwaysConsumableField, 'set', 'true')
        item = applyPatch(item, compostChanceField, 'set', '0.65')
        item = applyPatch(item, bestToolsField, 'set', '', ['pickaxe', 'shovel'])
        item = applyPatch(item, specialToolsField, 'set', '', ['diamond_pickaxe', 'netherite_pickaxe'])

        expect(item.item?.damage?.attackDamage).toBe(9)
        expect(item.item?.armor?.armorPoints).toBe(3)
        expect(item.edible?.hunger).toBe(4)
        expect(item.edible?.alwaysConsumable).toBe(true)
        expect(item.compostable?.chance).toBe(0.65)
        expect(item.block?.bestTools).toEqual(['pickaxe', 'shovel'])
        expect(item.breaking?.requiresSpecialToolsToDrop).toEqual(['diamond_pickaxe', 'netherite_pickaxe'])

        // Clear nested properties and check container pruning
        item = applyPatch(item, attackDamageField, 'clear', '')
        expect(item.item?.damage).toBeUndefined()

        item = applyPatch(item, armorPointsField, 'clear', '')
        expect(item.item?.armor).toBeUndefined()

        item = applyPatch(item, hungerField, 'clear', '')
        item = applyPatch(item, alwaysConsumableField, 'clear', '')
        expect(item.edible).toBeUndefined()

        item = applyPatch(item, compostChanceField, 'clear', '')
        expect(item.compostable).toBeUndefined()
    })

    it('passes schema validation for patched items', () => {
        const sample: ItemData = {
            displayName: 'Diamond Sword',
            displayNameGerman: 'Diamantschwert',
            stackSize: 1,
            renewable: 'yes',
            rarityTier: 'common',
            isBlock: false,
            craftingIngredient: true,
            isArmorTrimMaterial: false,
            item: {
                durability: 1561,
                fireResistant: false,
                damage: {
                    attackDamage: 7,
                    attackSpeed: 1.6,
                },
            },
            obtaining: {
                obtainability: 'survival',
                difficultyToObtain: 2,
                craftable: true,
                recipeShape: ['3x3_crafting'],
                naturalGeneration: {
                    dimensions: ['overworld'],
                    biomes: ['plains'],
                },
            },
        }

        const errors = validateItemData(sample)
        expect(errors.size).toBe(0)
    })

    it('cleanEmptyObjects removes empty nested objects but preserves obtaining', () => {
        const obj = {
            obtaining: {},
            item: {
                damage: {},
                armor: {},
            },
            edible: {},
        }
        cleanEmptyObjects(obj)
        expect(obj.obtaining).toBeDefined()
        expect(obj.item).toBeUndefined()
        expect(obj.edible).toBeUndefined()
    })
})
