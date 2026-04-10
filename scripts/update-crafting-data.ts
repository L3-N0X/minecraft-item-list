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
        options?: string[]
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

    // Map to track the set of grid sizes (2 or 3) possible for each item
    const itemGridSizes = new Map<string, Set<number>>()

    console.log(`Processing ${Object.keys(recipeMap).length} recipes...`)

    for (const recipe of Object.values(recipeMap)) {
        // Only focus on recipe types that start with "minecraft:crafting"
        if (!recipe.type.startsWith('minecraft:crafting')) continue
        if (!recipe.result) continue

        const resultId = recipe.result.id.replace(/^minecraft:/, '')
        let minGrid = 3

        if (recipe.type === 'minecraft:crafting_shaped') {
            const pattern = recipe.pattern
            const rows = pattern.length
            const cols = pattern.reduce(
                (max, row) => Math.max(max, row.length),
                0
            )
            if (rows <= 2 && cols <= 2) {
                minGrid = 2
            }
        } else if (recipe.type === 'minecraft:crafting_shapeless') {
            // Shapeless recipes can be 2x2 if they have 4 or fewer ingredients
            if (recipe.ingredients.length <= 4) {
                minGrid = 2
            }
        } else {
            // Handle special crafting types
            switch (recipe.type) {
                case 'minecraft:crafting_decorated_pot':
                case 'minecraft:crafting_special_mapextending':
                    minGrid = 3
                    break
                default:
                    // Most other special types (dyes, repair, firework stars/rockets, etc.)
                    // can be crafted in a 2x2 grid if the ingredients are kept minimal.
                    minGrid = 2
                    break
            }
        }

        let sizes = itemGridSizes.get(resultId)
        if (!sizes) {
            sizes = new Set<number>()
            itemGridSizes.set(resultId, sizes)
        }
        sizes.add(minGrid)
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
        const gridSizes = itemGridSizes.get(itemId)
        if (!gridSizes) continue

        if (!item.obtaining) {
            item.obtaining = {
                obtainability: 'survival',
                craftable: true,
                difficultyToObtain: -1,
            }
        }

        const optionsSet = new Set<string>(item.obtaining.options ?? [])

        // If an item can be crafted in a 2x2 grid, it can also be crafted in a 3x3 grid
        if (gridSizes.has(2)) {
            optionsSet.add('2x2_crafting')
            optionsSet.add('3x3_crafting')
        } else if (gridSizes.has(3)) {
            optionsSet.add('3x3_crafting')
        }

        // Convert back to array and sort for consistency
        item.obtaining.options = Array.from(optionsSet).sort()
        updatedCount++
    }

    console.log(`Writing updates to items.json...`)
    fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(data, null, 4))

    console.log(
        `Done. Updated crafting grid options for ${updatedCount} items.`
    )
}

updateCraftingData().catch((err) => {
    console.error('Error updating crafting data:', err)
    process.exit(1)
})
