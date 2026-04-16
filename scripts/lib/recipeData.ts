import { getDataUrl } from '@/lib/utils'
import { loadItemTagMap, resolveItemTagIndex } from './tagData'
import type {
    CookingRecipe,
    CraftingShapedRecipe,
    CraftingShapelessRecipe,
    RecipeData,
    RecipeMap,
    RecipeRef,
    RecipeRefOrList,
    StonecuttingRecipe,
} from '../types/recipes'
import type { ResolvedItemTagsIndex } from '../types/tags'

const RECIPES_DATA_URL = getDataUrl('/data/recipes.json')

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

export function isRecipeMap(value: unknown): value is RecipeMap {
    if (!isRecord(value)) {
        return false
    }

    return Object.values(value).every((entry) => {
        if (!isRecord(entry)) {
            return false
        }
        if (typeof entry.type !== 'string') {
            return false
        }
        if (entry.result !== undefined) {
            if (!isRecord(entry.result)) {
                return false
            }
            if (typeof entry.result.id !== 'string') {
                return false
            }
            if (
                entry.result.count !== undefined &&
                typeof entry.result.count !== 'number'
            ) {
                return false
            }
        }
        return true
    })
}

function parseRecipeMap(value: unknown): RecipeMap {
    if (!isRecipeMap(value)) {
        throw new Error('Invalid recipes payload')
    }

    return value
}

function normalizeReference(value: string): string {
    const trimmed = value.trim()
    if (!trimmed) {
        throw new Error('Invalid recipes payload: empty recipe reference')
    }
    if (trimmed.startsWith('#')) {
        return trimmed
    }
    if (trimmed.includes(':')) {
        return trimmed
    }
    return `minecraft:${trimmed}`
}

function normalizeTagId(reference: string): string {
    const cleaned = reference.trim().replace(/^#/, '')
    if (!cleaned) {
        throw new Error(
            `Invalid recipes payload: malformed tag reference "${reference}"`
        )
    }
    return cleaned.replace(/^minecraft:/, '')
}

function resolveRecipeRef(
    reference: RecipeRef,
    resolvedTags: ResolvedItemTagsIndex
): RecipeRef[] {
    const normalized = normalizeReference(reference)
    if (!normalized.startsWith('#')) {
        return [normalized]
    }

    const tagId = normalizeTagId(normalized)
    const itemIds = resolvedTags.itemIdsByTagId.get(tagId)
    if (!itemIds) {
        throw new Error(
            `Invalid recipes payload: missing referenced item tag "${tagId}"`
        )
    }
    if (itemIds.size === 0) {
        throw new Error(
            `Invalid recipes payload: referenced item tag "${tagId}" has no values`
        )
    }

    return [...itemIds].sort().map((itemId) => `minecraft:${itemId}`)
}

function resolveRecipeRefOrList(
    value: RecipeRefOrList,
    resolvedTags: ResolvedItemTagsIndex
): RecipeRefOrList {
    const refs = Array.isArray(value) ? value : [value]
    const expanded = refs.flatMap((reference) =>
        resolveRecipeRef(reference, resolvedTags)
    )
    const uniqueExpanded = [...new Set(expanded)]

    if (uniqueExpanded.length === 0) {
        throw new Error(
            'Invalid recipes payload: resolved ingredient list is empty'
        )
    }

    const [firstRef, ...otherRefs] = uniqueExpanded
    if (!firstRef) {
        throw new Error(
            'Invalid recipes payload: resolved ingredient list is empty'
        )
    }

    return otherRefs.length === 0 ? firstRef : [firstRef, ...otherRefs]
}

function resolveShapedRecipe(
    recipe: CraftingShapedRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingShapedRecipe {
    const resolvedKey: Record<string, RecipeRefOrList> = {}
    for (const [symbol, value] of Object.entries(recipe.key)) {
        resolvedKey[symbol] = resolveRecipeRefOrList(value, resolvedTags)
    }

    return {
        ...recipe,
        key: resolvedKey,
    }
}

function resolveShapelessRecipe(
    recipe: CraftingShapelessRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingShapelessRecipe {
    return {
        ...recipe,
        ingredients: recipe.ingredients.map((ingredient) =>
            resolveRecipeRefOrList(ingredient, resolvedTags)
        ),
    }
}

function resolveCookingRecipe(
    recipe: CookingRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CookingRecipe {
    return {
        ...recipe,
        ingredient: resolveRecipeRefOrList(recipe.ingredient, resolvedTags),
    }
}

function resolveStonecuttingRecipe(
    recipe: StonecuttingRecipe,
    resolvedTags: ResolvedItemTagsIndex
): StonecuttingRecipe {
    return {
        ...recipe,
        ingredient: resolveRecipeRefOrList(recipe.ingredient, resolvedTags),
    }
}

function resolveTransmuteRecipe(
    recipe: CraftingTransmuteRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingTransmuteRecipe {
    return {
        ...recipe,
        input: resolveRecipeRefOrList(recipe.input, resolvedTags),
        material: resolveRecipeRefOrList(recipe.material, resolvedTags),
    }
}

function resolveDyeRecipe(
    recipe: CraftingDyeRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingDyeRecipe {
    return {
        ...recipe,
        dye: resolveRecipeRefOrList(recipe.dye, resolvedTags),
        target: resolveRecipeRefOrList(recipe.target, resolvedTags),
    }
}

function resolveSmithingTransformRecipe(
    recipe: SmithingTransformRecipe,
    resolvedTags: ResolvedItemTagsIndex
): SmithingTransformRecipe {
    return {
        ...recipe,
        template: resolveRecipeRefOrList(recipe.template, resolvedTags),
        base: resolveRecipeRefOrList(recipe.base, resolvedTags),
        addition: resolveRecipeRefOrList(recipe.addition, resolvedTags),
    }
}

function resolveSmithingTrimRecipe(
    recipe: SmithingTrimRecipe,
    resolvedTags: ResolvedItemTagsIndex
): SmithingTrimRecipe {
    return {
        ...recipe,
        template: resolveRecipeRefOrList(recipe.template, resolvedTags),
        base: resolveRecipeRefOrList(recipe.base, resolvedTags),
        addition: resolveRecipeRefOrList(recipe.addition, resolvedTags),
        pattern: resolveRecipeRefOrList(recipe.pattern, resolvedTags),
    }
}

function resolveImbueRecipe(
    recipe: CraftingImbueRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingImbueRecipe {
    return {
        ...recipe,
        material: resolveRecipeRefOrList(recipe.material, resolvedTags),
        source: resolveRecipeRefOrList(recipe.source, resolvedTags),
    }
}

function resolveDecoratedPotRecipe(
    recipe: CraftingDecoratedPotRecipe,
    resolvedTags: ResolvedItemTagsIndex
): CraftingDecoratedPotRecipe {
    return {
        ...recipe,
        back: resolveRecipeRefOrList(recipe.back, resolvedTags),
        front: resolveRecipeRefOrList(recipe.front, resolvedTags),
        left: resolveRecipeRefOrList(recipe.left, resolvedTags),
        right: resolveRecipeRefOrList(recipe.right, resolvedTags),
    }
}

function resolveRecipeTagReferences(
    recipeMap: RecipeMap,
    resolvedTags: ResolvedItemTagsIndex
): RecipeMap {
    const resolvedEntries = Object.entries(recipeMap).map(
        ([recipeId, recipe]) => {
            let resolvedRecipe: RecipeData = recipe

            if (recipe.type === 'minecraft:crafting_shaped') {
                resolvedRecipe = resolveShapedRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:crafting_shapeless') {
                resolvedRecipe = resolveShapelessRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:stonecutting') {
                resolvedRecipe = resolveStonecuttingRecipe(recipe, resolvedTags)
            } else if (
                recipe.type === 'minecraft:smelting' ||
                recipe.type === 'minecraft:blasting' ||
                recipe.type === 'minecraft:smoking' ||
                recipe.type === 'minecraft:campfire_cooking'
            ) {
                resolvedRecipe = resolveCookingRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:crafting_transmute') {
                resolvedRecipe = resolveTransmuteRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:crafting_dye') {
                resolvedRecipe = resolveDyeRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:smithing_transform') {
                resolvedRecipe = resolveSmithingTransformRecipe(
                    recipe,
                    resolvedTags
                )
            } else if (recipe.type === 'minecraft:smithing_trim') {
                resolvedRecipe = resolveSmithingTrimRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:crafting_imbue') {
                resolvedRecipe = resolveImbueRecipe(recipe, resolvedTags)
            } else if (recipe.type === 'minecraft:crafting_decorated_pot') {
                resolvedRecipe = resolveDecoratedPotRecipe(recipe, resolvedTags)
            }

            return [recipeId, resolvedRecipe] as const
        }
    )

    return Object.fromEntries(resolvedEntries)
}

export async function loadRecipeMap(signal?: AbortSignal): Promise<RecipeMap> {
    const [response, tagMap] = await Promise.all([
        fetch(RECIPES_DATA_URL, {
            signal,
            headers: {
                Accept: 'application/json',
            },
        }),
        loadItemTagMap(signal),
    ])

    if (!response.ok) {
        throw new Error(`Failed to load recipes (${response.status})`)
    }

    const recipeMap = parseRecipeMap(await response.json())
    const resolvedTags = resolveItemTagIndex(tagMap)
    return resolveRecipeTagReferences(recipeMap, resolvedTags)
}
