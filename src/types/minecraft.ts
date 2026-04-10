export type StackSize = -1 | 1 | 16 | 64

export type Tool =
    | 'sword'
    | 'axe'
    | 'pickaxe'
    | 'shovel'
    | 'hoe'
    | 'shears'
    | 'brush'
    | 'none'
    | 'any'

export type SpecialTool =
    | 'wooden_pickaxe'
    | 'stone_pickaxe'
    | 'copper_pickaxe'
    | 'iron_pickaxe'
    | 'golden_pickaxe'
    | 'diamond_pickaxe'
    | 'netherite_pickaxe'
    | 'wooden_shovel'
    | 'stone_shovel'
    | 'copper_shovel'
    | 'iron_shovel'
    | 'golden_shovel'
    | 'diamond_shovel'
    | 'netherite_shovel'
    | 'shears'
    | 'brush'

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic'

export type Renewable = 'yes' | 'no' | 'vault_only'

export type Transparency = 'transparent' | 'partial' | 'opaque'

export type Obtainability = 'survival' | 'creative_only' | 'unobtainable'

export interface QuantitySpecObject {
    min: number
    max: number
}

export type QuantitySpec = number | QuantitySpecObject

export interface ItemData {
    displayName: string
    displayNameGerman: string
    isBlock: boolean
    renewable: Renewable
    stackSize: StackSize
    rarityTier: RarityTier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
    block?: {
        blastResistance: number
        hardness: number
        luminousLevel: number
        transparency: Transparency
        waterloggable: boolean
        isBlockEntity: boolean
        bestTools: Tool[]
        flammable: boolean
        catchesFire: boolean
    }
    item?: {
        damage?: {
            attackDamage: number
            attackSpeed: number
        }
        armor?: {
            armorPoints: number
            toughness: number
            knockbackResistance: number
        }
        durability?: number
        enchantability?: number
        fireResistant: boolean
    }
    edible?: {
        hunger: number
        saturation: number
        alwaysConsumable: boolean
    }
    breaking?: {
        requiresSilkTouch: 'silk_touch_only' | 'yes' | 'no'
        requiresSpecialToolsToDrop?: SpecialTool[]
        instantBreaking: boolean
    }
    obtaining: {
        obtainability: Obtainability
        craftable: boolean
        difficultyToObtain: number
        recipeShape?: (
            | '2x2_crafting'
            | '3x3_crafting'
            | 'crafting_special'
            | 'crafting_repair'
            | 'crafting_tippedarrow'
            | 'crafting_firework_star'
            | 'smelting'
            | 'stonecutting'
            | 'smoking'
            | 'blasting'
            | 'campfire_cooking'
        )[]
        naturalGeneration?: {
            biomes?: string[]
            dimensions: string[]
            comment?: string
            partOfStructures?: {
                structures: string[]
                comment?: string
            }
        }
        generatedLoot?: {
            structures: {
                structure: string
                chests: {
                    chestName: string
                    chance: number
                    quantity: QuantitySpec
                }[]
                comment?: string
            }[]
        }
        mobLoot?: {
            mob: string
            chance: number
            quantity: QuantitySpec
            comment?: string
        }[]
        blockLoot?: {
            blocks: string[]
            chance: number
            quantity: QuantitySpec
        }[]
        trading?: {
            villagers?: {
                profession: string
                level: string
                probability: number
                quantity: QuantitySpec
                comment?: string
            }[]
            wanderingTrader?: {
                chance: number
                quantity: QuantitySpec
                comment?: string
            }
        }
        fishing?: {
            category: 'fish' | 'treasure' | 'junk'
            chance: number
            quantity: QuantitySpec
            comment?: string
        }
        bartering?: {
            chance: number
            quantity: QuantitySpec
            comment?: string
        }
        smelting?: {
            smeltable: string[]
            xpFromSmelting: number
        }
    }
    compostable?: {
        chance: number
    }
    craftingIngredient?: boolean
    isArmorTrimMaterial?: boolean
    fuel?: {
        burnTimeSeconds: number
        numberOfItemsSmelted: number
    }
    possibleEnchantments?: {
        id: string
        levels: QuantitySpec
    }[]
    mostDominantColor?: string
}
