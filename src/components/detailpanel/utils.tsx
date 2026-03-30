export const PICKAXE_TIERS = [
    'wooden_pickaxe',
    'stone_pickaxe',
    'copper_pickaxe',
    'iron_pickaxe',
    'golden_pickaxe',
    'diamond_pickaxe',
    'netherite_pickaxe',
]

export const SHOVEL_TIERS = [
    'wooden_shovel',
    'stone_shovel',
    'copper_shovel',
    'iron_shovel',
    'golden_shovel',
    'diamond_shovel',
    'netherite_shovel',
]

export const ROMAN_NUMERALS = [
    '',
    'I',
    'II',
    'III',
    'IV',
    'V',
    'VI',
    'VII',
    'VIII',
    'IX',
    'X',
]

export const getRarityColor = (tier: string) => {
    switch (tier) {
        case 'uncommon':
            return 'text-yellow-400'
        case 'rare':
            return 'text-cyan-400'
        case 'epic':
            return 'text-pink-400'
        default:
            return 'text-white'
    }
}

export const formatRenewable = (r: string) => {
    if (r === 'yes') return 'Yes'
    if (r === 'no') return 'No'
    if (r === 'vault_only') return 'Vault'
    return undefined
}

export const formatBoolean = (b: boolean | undefined) => {
    if (b === undefined) return undefined
    return b ? (
        <span className="text-emerald-400/90">Yes</span>
    ) : (
        <span className="dark:text-red-400/80 text-red-700/80">No</span>
    )
}

export const filterTools = (tools: string[] | undefined) => {
    if (!tools || tools.length === 0) return []
    const result: string[] = []
    let lowestPickaxeIndex = Infinity
    let lowestPickaxe = ''
    let lowestShovelIndex = Infinity
    let lowestShovel = ''

    tools.forEach((tool) => {
        const pIdx = PICKAXE_TIERS.indexOf(tool)
        if (pIdx !== -1) {
            if (pIdx < lowestPickaxeIndex) {
                lowestPickaxeIndex = pIdx
                lowestPickaxe = tool
            }
        } else {
            const sIdx = SHOVEL_TIERS.indexOf(tool)
            if (sIdx !== -1) {
                if (sIdx < lowestShovelIndex) {
                    lowestShovelIndex = sIdx
                    lowestShovel = tool
                }
            } else {
                result.push(tool)
            }
        }
    })

    if (lowestPickaxe) result.unshift(lowestPickaxe)
    if (lowestShovel) result.unshift(lowestShovel)

    return result
}

export function formatNumber(num: number | undefined) {
    if (num === undefined) return 'Unknown'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

export function formatQuantity(
    quantity: number | { min: number; max: number } | undefined
): string {
    if (quantity === undefined) return '?'
    if (typeof quantity === 'number') return quantity.toString()
    return `${quantity.min}-${quantity.max}`
}

export function formatChance(chance: number | undefined): string {
    if (chance === undefined) return '?'
    return `${(chance * 100).toFixed(1)}%`
}
