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
