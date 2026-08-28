import type { RarityTier, Renewable, StackSize } from '@/types/minecraft'
import type { Row } from '@tanstack/react-table'
import type { ItemData } from '../schema-types'

export type TableRowData = {
    id: string
    displayName: string
    displayNameGerman: string
    categories: string[]
    difficulty: number
    hasNaturalGen: boolean
    hasLoot: boolean
    requiresSilkTouch: boolean
    craftable: boolean
    hasMobLoot: boolean
    mobs: string[]
    mobSpecialRequirements: string[]
    hasBlockLoot: boolean
    hasTrading: boolean
    hasSmelting: boolean
    renewable: Renewable
    isBlock: boolean
    stackSize: StackSize
    rarityTier: RarityTier
    biomes: string[]
    structures: string[]
    generatedLoot: string[]
    recipeShape: string[]
    craftingIngredient: boolean | null
    blastResistance: number | null
    hardness: number | null
    luminousLevel: number | null
    transparency: string | null
    waterloggable: boolean | null
    bestTools: string[]
    flammable: boolean | null
    catchesFire: boolean | null
    durability: number | null
    enchantability: number | null
    isArmor: boolean
    isFood: boolean
    hunger: number | null
    saturation: number | null
    instantBreaking: boolean | null
    hasBartering: boolean
    hasFishing: boolean
    dimensions: string[]
    obtainability: string | null
    rawItem: ItemData
}

export const binaryFilterFn = (
    row: Row<TableRowData>,
    id: string,
    filterValues: string[]
) => {
    const val = !!row.getValue(id)
    const valStr = val.toString()
    return filterValues.includes(valStr)
}
