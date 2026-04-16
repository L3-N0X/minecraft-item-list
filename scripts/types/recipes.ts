export type RecipeRef = string
export type RecipeRefOrList = RecipeRef | RecipeRef[]

export type RecipeCategory =
    | 'blocks'
    | 'building'
    | 'equipment'
    | 'food'
    | 'misc'
    | 'redstone'

export type RecipeType =
    | 'minecraft:blasting'
    | 'minecraft:campfire_cooking'
    | 'minecraft:crafting_decorated_pot'
    | 'minecraft:crafting_dye'
    | 'minecraft:crafting_imbue'
    | 'minecraft:crafting_shaped'
    | 'minecraft:crafting_shapeless'
    | 'minecraft:crafting_special_bannerduplicate'
    | 'minecraft:crafting_special_bookcloning'
    | 'minecraft:crafting_special_firework_rocket'
    | 'minecraft:crafting_special_firework_star'
    | 'minecraft:crafting_special_firework_star_fade'
    | 'minecraft:crafting_special_mapextending'
    | 'minecraft:crafting_special_repairitem'
    | 'minecraft:crafting_special_shielddecoration'
    | 'minecraft:crafting_transmute'
    | 'minecraft:smelting'
    | 'minecraft:smithing_transform'
    | 'minecraft:smithing_trim'
    | 'minecraft:smoking'
    | 'minecraft:stonecutting'

export interface RecipeResult {
    id: string
    count?: number
}

export interface BaseRecipe {
    type: RecipeType
    category?: RecipeCategory
    group?: string
    result?: RecipeResult
}

export interface CraftingShapedRecipe extends BaseRecipe {
    type: 'minecraft:crafting_shaped'
    key: Record<string, RecipeRefOrList>
    pattern: string[]
    result: RecipeResult
}

export interface CraftingShapelessRecipe extends BaseRecipe {
    type: 'minecraft:crafting_shapeless'
    ingredients: RecipeRefOrList[]
    result: RecipeResult
}

export interface CookingRecipe extends BaseRecipe {
    type:
        | 'minecraft:smelting'
        | 'minecraft:blasting'
        | 'minecraft:smoking'
        | 'minecraft:campfire_cooking'
    ingredient: RecipeRefOrList
    cookingtime: number
    experience: number
    result: RecipeResult
}

export interface StonecuttingRecipe extends BaseRecipe {
    type: 'minecraft:stonecutting'
    ingredient: RecipeRefOrList
    result: RecipeResult
}

export interface SmithingTransformRecipe extends BaseRecipe {
    type: 'minecraft:smithing_transform'
    template: RecipeRefOrList
    base: RecipeRefOrList
    addition: RecipeRefOrList
    result: RecipeResult
}

export interface SmithingTrimRecipe extends BaseRecipe {
    type: 'minecraft:smithing_trim'
    template: RecipeRefOrList
    base: RecipeRefOrList
    addition: RecipeRefOrList
    pattern: RecipeRefOrList
}

export interface CraftingDecoratedPotRecipe extends BaseRecipe {
    type: 'minecraft:crafting_decorated_pot'
    back: RecipeRefOrList
    front: RecipeRefOrList
    left: RecipeRefOrList
    right: RecipeRefOrList
    result: RecipeResult
}

export interface CraftingDyeRecipe extends BaseRecipe {
    type: 'minecraft:crafting_dye'
    dye: RecipeRefOrList
    target: RecipeRefOrList
    result: RecipeResult
}

export interface CraftingImbueRecipe extends BaseRecipe {
    type: 'minecraft:crafting_imbue'
    material: RecipeRefOrList
    source: RecipeRefOrList
    result: RecipeResult
}

export interface CraftingTransmuteRecipe extends BaseRecipe {
    type: 'minecraft:crafting_transmute'
    input: RecipeRefOrList
    material: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialBannerDuplicateRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_bannerduplicate'
    banner: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialBookCloningRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_bookcloning'
    material: RecipeRefOrList
    source: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialFireworkRocketRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_firework_rocket'
    fuel: RecipeRefOrList
    shell: RecipeRefOrList
    star: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialFireworkStarRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_firework_star'
    dye: RecipeRefOrList
    fuel: RecipeRefOrList
    shapes?: Record<string, RecipeRefOrList>
    trail?: RecipeRefOrList
    twinkle?: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialFireworkStarFadeRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_firework_star_fade'
    dye: RecipeRefOrList
    target: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialMapExtendingRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_mapextending'
    map: RecipeRefOrList
    material: RecipeRefOrList
    result: RecipeResult
}

export interface SpecialRepairItemRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_repairitem'
}

export interface SpecialShieldDecorationRecipe extends BaseRecipe {
    type: 'minecraft:crafting_special_shielddecoration'
    banner: RecipeRefOrList
    target: RecipeRefOrList
    result: RecipeResult
}

export type RecipeData =
    | CraftingShapedRecipe
    | CraftingShapelessRecipe
    | CookingRecipe
    | StonecuttingRecipe
    | SmithingTransformRecipe
    | SmithingTrimRecipe
    | CraftingDecoratedPotRecipe
    | CraftingDyeRecipe
    | CraftingImbueRecipe
    | CraftingTransmuteRecipe
    | SpecialBannerDuplicateRecipe
    | SpecialBookCloningRecipe
    | SpecialFireworkRocketRecipe
    | SpecialFireworkStarRecipe
    | SpecialFireworkStarFadeRecipe
    | SpecialMapExtendingRecipe
    | SpecialRepairItemRecipe
    | SpecialShieldDecorationRecipe

export type RecipeMap = Record<string, RecipeData>
