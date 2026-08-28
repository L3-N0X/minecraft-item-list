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

export interface MobSpecialRequirementConfig {
    label: string
    shortLabel: string
    className: string
}

export const MOB_SPECIAL_REQUIREMENTS: Record<
    string,
    MobSpecialRequirementConfig
> = {
    when_equipped: {
        label: 'When Equipped',
        shortLabel: 'Equipped',
        className:
            'bg-blue-500/10 text-blue-800 dark:text-blue-400 border-blue-600 dark:border-blue-500/40',
    },
    fire_aspect_or_on_fire: {
        label: 'Fire Aspect / On Fire',
        shortLabel: 'On Fire',
        className:
            'bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-600 dark:border-orange-500/40',
    },
    killed_by_skeleton: {
        label: 'Killed by Skeleton',
        shortLabel: 'Skeleton Kill',
        className:
            'bg-purple-500/10 text-purple-800 dark:text-purple-400 border-purple-600 dark:border-purple-500/40',
    },
    player_kill_only: {
        label: 'Player Kill Only',
        shortLabel: 'Player Only',
        className:
            'bg-red-500/10 text-red-800 dark:text-red-400 border-red-600 dark:border-red-500/40',
    },
    sheared: {
        label: 'Sheared',
        shortLabel: 'Sheared',
        className:
            'bg-sky-500/10 text-sky-800 dark:text-sky-400 border-sky-600 dark:border-sky-500/40',
    },
    charged_creeper: {
        label: 'Charged Creeper',
        shortLabel: 'Charged Creeper',
        className:
            'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400 border-yellow-600 dark:border-yellow-500/40',
    },
    fox_mouth: {
        label: 'Fox Mouth Hold',
        shortLabel: 'Fox Mouth',
        className:
            'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-600 dark:border-amber-500/40',
    },
    cat_gift: {
        label: 'Cat Gift',
        shortLabel: 'Cat Gift',
        className:
            'bg-pink-500/10 text-pink-800 dark:text-pink-400 border-pink-600 dark:border-pink-500/40',
    },
    periodic_drop: {
        label: 'Periodic Passive Drop',
        shortLabel: 'Periodic Drop',
        className:
            'bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500/40',
    },
    killed_by_frog: {
        label: 'Killed by Frog',
        shortLabel: 'Frog Kill',
        className:
            'bg-teal-500/10 text-teal-800 dark:text-teal-400 border-teal-600 dark:border-teal-500/40',
    },
    mob_interaction: {
        label: 'Mob Interaction',
        shortLabel: 'Interaction',
        className:
            'bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500/40',
    },
}
