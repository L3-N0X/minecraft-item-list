import fs from 'node:fs'
import path from 'node:path'
import type { RecipeMap } from './types/recipes'

const targetVersion =
    process.argv.find((arg) => arg.startsWith('--version='))?.split('=')[1] ??
    process.argv[2] ??
    '26.2'

const shouldFetch =
    process.argv.includes('--fetch') ||
    process.argv.includes('-f') ||
    Boolean(process.argv.find((arg) => arg.startsWith('--version=')))

const SCRIPTS_DATA_DIR = path.join(process.cwd(), 'scripts', 'data')
const RECIPES_JSON_PATH = path.join(SCRIPTS_DATA_DIR, 'recipes.json')

const PUBLIC_DATA_DIR = path.join(
    process.cwd(),
    'public',
    'data',
    'versions',
    targetVersion
)
const ITEMS_JSON_PATH = path.join(PUBLIC_DATA_DIR, 'items.json')
const VERSION_TAGS_PATH = path.join(PUBLIC_DATA_DIR, 'tags.json')
const SCRIPTS_TAGS_PATH = path.join(SCRIPTS_DATA_DIR, 'tags.json')
const TAGS_JSON_PATH = fs.existsSync(VERSION_TAGS_PATH)
    ? VERSION_TAGS_PATH
    : SCRIPTS_TAGS_PATH

const SUMMARY_URLS = [
    `https://raw.githubusercontent.com/misode/mcmeta/${targetVersion}-summary`,
    'https://raw.githubusercontent.com/misode/mcmeta/refs/heads/summary',
]

async function fetchJSON<T>(url: string): Promise<T | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) return null
        return (await response.json()) as T
    } catch {
        return null
    }
}

async function fetchWithFallback<T>(
    baseUrls: string[],
    subpath: string
): Promise<T | null> {
    for (const base of baseUrls) {
        const url = `${base}/${subpath}`
        const res = await fetchJSON<T>(url)
        if (res !== null) return res
    }
    return null
}

interface ItemData {
    obtaining?: {
        obtainability?: string
        craftable?: boolean
        difficultyToObtain?: number
        recipeShape?: string[]
        options?: string[] // For migration cleanup
        [key: string]: unknown
    }
    craftingIngredient?: boolean
    [key: string]: unknown
}

interface ItemsPayload {
    items: Record<string, ItemData>
    [key: string]: unknown
}

interface TagData {
    values: string[]
    replace?: boolean
}

async function updateCraftingData() {
    if (!fs.existsSync(SCRIPTS_DATA_DIR)) {
        fs.mkdirSync(SCRIPTS_DATA_DIR, { recursive: true })
    }
    if (!fs.existsSync(PUBLIC_DATA_DIR)) {
        fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true })
    }

    if (shouldFetch || !fs.existsSync(RECIPES_JSON_PATH)) {
        console.log(`Fetching latest recipes.json for ${targetVersion}...`)
        const remoteRecipes = await fetchWithFallback<RecipeMap>(
            SUMMARY_URLS,
            'data/recipe/data.json'
        )
        if (remoteRecipes) {
            fs.writeFileSync(
                RECIPES_JSON_PATH,
                JSON.stringify(remoteRecipes, null, 2)
            )
            console.log(
                `Saved ${Object.keys(remoteRecipes).length} recipes to ${RECIPES_JSON_PATH}`
            )
        }
    }

    if (shouldFetch || !fs.existsSync(VERSION_TAGS_PATH)) {
        console.log(`Fetching latest tags.json for ${targetVersion}...`)
        const remoteTags = await fetchWithFallback<Record<string, TagData>>(
            SUMMARY_URLS,
            'data/tag/item/data.json'
        )
        if (remoteTags) {
            fs.writeFileSync(
                VERSION_TAGS_PATH,
                JSON.stringify(remoteTags, null, 4)
            )
            fs.writeFileSync(
                SCRIPTS_TAGS_PATH,
                JSON.stringify(remoteTags, null, 2)
            )
            console.log(
                `Saved ${Object.keys(remoteTags).length} item tags to ${VERSION_TAGS_PATH}`
            )
        }
    }

    console.log('Reading recipes.json...')
    if (!fs.existsSync(RECIPES_JSON_PATH)) {
        throw new Error(`recipes.json not found at ${RECIPES_JSON_PATH}`)
    }
    const recipeMap = JSON.parse(
        fs.readFileSync(RECIPES_JSON_PATH, 'utf-8')
    ) as RecipeMap

    console.log('Reading tags.json...')
    const currentTagsPath = fs.existsSync(VERSION_TAGS_PATH)
        ? VERSION_TAGS_PATH
        : TAGS_JSON_PATH
    if (!fs.existsSync(currentTagsPath)) {
        throw new Error(`tags.json not found at ${currentTagsPath}`)
    }
    const tagMap = JSON.parse(
        fs.readFileSync(currentTagsPath, 'utf-8')
    ) as Record<string, TagData>

    // Resolve tags
    const resolvedTags = new Map<string, Set<string>>()
    function resolveTag(tagId: string, inProgress: Set<string> = new Set()): Set<string> {
        if (resolvedTags.has(tagId)) return resolvedTags.get(tagId)!
        if (inProgress.has(tagId)) return new Set()

        inProgress.add(tagId)
        const items = new Set<string>()
        const tag = tagMap[tagId]
        if (tag && tag.values) {
            for (const value of tag.values) {
                if (value.startsWith('#')) {
                    const ref = value.slice(1).replace(/^minecraft:/, '')
                    const refItems = resolveTag(ref, inProgress)
                    for (const item of refItems) items.add(item)
                } else {
                    items.add(value.replace(/^minecraft:/, ''))
                }
            }
        }
        inProgress.delete(tagId)
        resolvedTags.set(tagId, items)
        return items
    }

    for (const tagId of Object.keys(tagMap)) {
        resolveTag(tagId)
    }

    // Map to track the set of recipe shapes/types possible for each item
    const itemRecipeShapes = new Map<string, Set<string>>()
    // Set to track items that are used as ingredients in any recipe
    const craftingIngredients = new Set<string>()

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
                shape = rows <= 2 && cols <= 2 ? '2x2_crafting' : '3x3_crafting'
            } else if (recipe.type === 'minecraft:crafting_shapeless') {
                shape =
                    recipe.ingredients.length <= 4
                        ? '2x2_crafting'
                        : '3x3_crafting'
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
                    case 'minecraft:crafting_imbue':
                        if (
                            recipeId === 'tipped_arrow' ||
                            resultId === 'tipped_arrow'
                        ) {
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

        // Collect ingredients from the recipe
        const collectIngredient = (ingredient: unknown) => {
            if (Array.isArray(ingredient)) {
                for (const item of ingredient) {
                    collectIngredient(item)
                }
            } else if (typeof ingredient === 'string') {
                if (ingredient.startsWith('#')) {
                    const tagId = ingredient.slice(1).replace(/^minecraft:/, '')
                    const resolved = resolvedTags.get(tagId)
                    if (resolved) {
                        for (const item of resolved) {
                            craftingIngredients.add(item)
                        }
                    }
                } else {
                    const itemId = ingredient.replace(/^minecraft:/, '')
                    craftingIngredients.add(itemId)
                }
            }
        }

        if (recipe.type === 'minecraft:crafting_shaped' && recipe.key) {
            for (const value of Object.values(recipe.key)) {
                collectIngredient(value)
            }
        } else if (
            recipe.type === 'minecraft:crafting_shapeless' &&
            recipe.ingredients
        ) {
            for (const ing of recipe.ingredients) {
                collectIngredient(ing)
            }
        } else if (recipe.type === 'minecraft:crafting_transmute') {
            if ('input' in recipe) collectIngredient(recipe.input)
            if ('material' in recipe) collectIngredient(recipe.material)
        } else if (recipe.type === 'minecraft:crafting_dye') {
            if ('dye' in recipe) collectIngredient(recipe.dye)
            if ('target' in recipe) collectIngredient(recipe.target)
        } else if (
            recipe.type === 'minecraft:smithing_transform' ||
            recipe.type === 'minecraft:smithing_trim'
        ) {
            if ('template' in recipe) collectIngredient(recipe.template)
            if ('base' in recipe) collectIngredient(recipe.base)
            if ('addition' in recipe) collectIngredient(recipe.addition)
        } else if (recipe.type === 'minecraft:crafting_decorated_pot') {
            if ('back' in recipe) collectIngredient(recipe.back)
            if ('front' in recipe) collectIngredient(recipe.front)
            if ('left' in recipe) collectIngredient(recipe.left)
            if ('right' in recipe) collectIngredient(recipe.right)
        } else if (
            'ingredient' in recipe &&
            recipe.ingredient &&
            ![
                'minecraft:smelting',
                'minecraft:smoking',
                'minecraft:blasting',
                'minecraft:campfire_cooking',
                'minecraft:stonecutting',
            ].includes(recipe.type)
        ) {
            collectIngredient(recipe.ingredient)
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
    let craftingIngredientCorrected = 0
    for (const [itemId, item] of Object.entries(data.items)) {
        const recipeShapes = itemRecipeShapes.get(itemId)
        if (recipeShapes) {
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
                '2x2_crafting',
                '3x3_crafting',
                'crafting_special',
                'crafting_repair',
                'crafting_tippedarrow',
                'crafting_firework_star',
                'smelting',
                'stonecutting',
                'smoking',
                'blasting',
                'campfire_cooking',
            ]
            if (item.obtaining.recipeShape) {
                for (const s of item.obtaining.recipeShape) {
                    if (validShapes.includes(s)) recipeShapeSet.add(s)
                }
            }

            // Convert back to array and sort for consistency
            item.obtaining.recipeShape = Array.from(recipeShapeSet).sort()
        }

        // Update craftingIngredient if the item appears as an ingredient in any recipe
        const isIngredient = craftingIngredients.has(itemId)
        if (item.craftingIngredient !== isIngredient) {
            if (item.craftingIngredient !== undefined) {
                craftingIngredientCorrected++
            }
            item.craftingIngredient = isIngredient
            updatedCount++
        }
    }

    console.log(`Writing updates to items.json...`)
    fs.writeFileSync(ITEMS_JSON_PATH, JSON.stringify(data, null, 4))

    console.log(
        `Done. Updated recipeShape categories and craftingIngredient for ${updatedCount} items.`
    )
    console.log(
        `  - Corrected craftingIngredient field for ${craftingIngredientCorrected} items that had incorrect values.`
    )
}

updateCraftingData().catch((err) => {
    console.error('Error updating crafting data:', err)
    process.exit(1)
})
