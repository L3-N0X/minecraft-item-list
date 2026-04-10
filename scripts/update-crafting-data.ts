import fs from 'node:fs'
import path from 'node:path'
import type { RecipeMap } from './types/recipes'

const SCRIPTS_DATA_DIR = path.join(process.cwd(), 'scripts', 'data')
const RECIPES_JSON_PATH = path.join(SCRIPTS_DATA_DIR, 'recipes.json')

const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data')
const ITEMS_JSON_PATH = path.join(PUBLIC_DATA_DIR, 'items.json')

interface ItemData {
    obtaining?: {
        obtainability?: string
        craftable?: boolean
        difficultyToObtain?: number
        recipeShape?: string[]
        options?: string[] // For migration cleanup
        [key: string]: unknown
    }
    [key: string]: unknown
}

interface ItemsPayload {
    items: Record<string, ItemData>
    [key: string]: unknown
}

async function updateCraftingData() {
    console.log('Reading recipes.json...')
    if (!fs.existsSync(RECIPES_JSON_PATH)) {
        throw new Error(`recipes.json not found at ${RECIPES_JSON_PATH}`)
    }
    const recipeMap = JSON.parse(
        fs.readFileSync(RECIPES_JSON_PATH, 'utf-8')
    ) as RecipeMap

    // Map to track the set of recipe shapes/types possible for each item
    const itemRecipeShapes = new Map<string, Set<string>>()

    console.log(`Processing ${Object.keys(recipeMap).length} recipes...`)

    for (const [recipeId, recipe] of Object.entries(recipeMap)) {
        if (!recipe.result) continue

        const resultId = recipe.result.id.replace(/^minecraft:/, '')
        let shape: string | null = null

        // Handle standard crafting and specialized crafting
        if (recipe.type.startsWith('minecraft:crafting')) {
            if (recipe.type === 'minecraft:crafting_shaped') {
                const pattern = recipe.pattern
                const rows = pattern.length
                const cols = pattern.reduce(
                    (max, row) => Math.max(max, row.length),
                    0
                )
                shape = (rows <= 2 && cols <= 2) ? '2x2_crafting' : '3x3_crafting'
            } else if (recipe.type === 'minecraft:crafting_shapeless') {
                shape = (recipe.ingredients.length <= 4) ? '2x2_crafting' : '3x3_crafting'
            } else {
                // Handle special crafting types
                switch (recipe.type) {
                    case 'minecraft:crafting_special_bannerduplicate':
                    case 'minecraft:crafting_special_bookcloning':
                    case 'minecraft:crafting_special_firework_rocket':
                    case 'minecraft:crafting_special_firework_star_fade':
                    case 'minecraft:crafting_special_mapextending':
                    case 'minecraft:crafting_special_shielddecoration':
                        shape = 'crafting_special'
                        break
                    case 'minecraft:crafting_special_repairitem':
                        shape = 'crafting_repair'
                        break
                    case 'minecraft:crafting_special_firework_star':
                        shape = 'crafting_firework_star'
                        break
                    case 'minecraft:crafting_special_tippedarrow':
                        shape = 'crafting_tippedarrow'
                        break
                    case 'minecraft:crafting_imbue':
                        if (recipeId === 'tipped_arrow' || resultId === 'tipped_arrow') {
                            shape = 'crafting_tippedarrow'
                        } else {
                            shape = 'crafting_special'
                        }
                        break
                    case 'minecraft:crafting_transmute':
                        shape = 'crafting_special'
                        break
                    case 'minecraft:crafting_decorated_pot':
                    case 'minecraft:crafting_dye':
                        shape = 'crafting_special'
                        break
                    default:
                        shape = 'crafting_special'
                        break
                }
            }
        } 
        // Handle non-crafting processing methods
        else {
            switch (recipe.type) {
                case 'minecraft:smelting':
                    shape = 'smelting'
                    break
                case 'minecraft:stonecutting':
                    shape = 'stonecutting'
                    break
                case 'minecraft:smoking':
                    shape = 'smoking'
                    break
                case 'minecraft:blasting':
                    shape = 'blasting'
                    break
                case 'minecraft:campfire_cooking':
                    shape = 'campfire_cooking'
                    break
                default:
                    // Skip other types (smithing, etc.)
                    break
            }
        }

        if (shape) {
            let shapes = itemRecipeShapes.get(resultId)
            if (!shapes) {
                shapes = new Set<string>()
                itemRecipeShapes.set(resultId, shapes)
            }
            shapes.add(shape)
            // If it's a 2x2, it's also a 3x3 (only applies to standard crafting)
            if (shape === '2x2_crafting') {
                shapes.add('3x3_crafting')
            }
        }
    }

    console.log('Reading items.json...')
    if (!fs.existsSync(ITEMS_JSON_PATH)) {
        throw new Error(`items.json not found at ${ITEMS_JSON_PATH}`)
    }

    const data = JSON.parse(
        fs.readFileSync(ITEMS_JSON_PATH, 'utf-8')
    ) as ItemsPayload

    let updatedCount = 0
    for (const [itemId, item] of Object.entries(data.items)) {
        const recipeShapes = itemRecipeShapes.get(itemId)
        if (!recipeShapes) continue

        if (!item.obtaining) {
            item.obtaining = {
                obtainability: 'survival',
                craftable: true,
                difficultyToObtain: -1,
            }
        }

        // Migrate and clean up 'options' if it exists
        if (item.obtaining.options) {
            delete item.obtaining.options
        }

        const recipeShapeSet = new Set<string>(recipeShapes)
        
        // Preserve any existing manually added shapes that are valid
        const validShapes = [
            '2x2_crafting', '3x3_crafting', 'crafting_special', 
            'crafting_repair', 'crafting_tippedarrow', 'crafting_firework_star',
            'smelting', 'stonecutting', 'smoking', 'blasting', 'campfire_cooking'
        ]
        if (item.obtaining.recipeShape) {
            for (const s of item.obtaining.recipeShape) {
                if (validShapes.includes(s)) recipeShapeSet.add(s)
            }
        }

        // Convert back to array and sort for consistency
        item.obtaining.recipeShape = Array.from(recipeShapeSet).sort()
        updatedCount++
    }

    console.log(`Writing updates to items.json...`)
    fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(data, null, 4))

    console.log(
        `Done. Updated recipeShape categories for ${updatedCount} items.`
    )
}

updateCraftingData().catch((err) => {
    console.error('Error updating crafting data:', err)
    process.exit(1)
})
