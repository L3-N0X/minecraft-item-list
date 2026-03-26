import React from 'react'
import type { ItemData } from '@/context/DataContext'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { InfoIcon, SmileySadIcon } from '@phosphor-icons/react'
import { Button } from './ui/button'

interface ItemDetailPanelProps {
    item: ItemData
    itemId: string
}

function StatItem({
    label,
    value,
    labelFontSize = 'text-[10px]',
    valueFontSize = 'text-base',
    className,
    reverseLabel = false,
}: {
    label: string
    value: string | number | React.ReactNode
    labelFontSize?: string
    valueFontSize?: string
    className?: string
    reverseLabel?: boolean
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center p-1 gap-1',
                className
            )}
        >
            {!reverseLabel ? (
                <span
                    className={cn(
                        'text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold mb-0.5',
                        labelFontSize
                    )}
                >
                    {label}
                </span>
            ) : null}
            <span
                className={cn(
                    'text-sm tracking-tight text-center leading-tight font-mono',
                    valueFontSize
                )}
            >
                {value}
            </span>
            {reverseLabel ? (
                <span
                    className={cn(
                        'text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold mb-0.5',
                        labelFontSize
                    )}
                >
                    {label}
                </span>
            ) : null}
        </div>
    )
}

function ListItem({
    label,
    value,
}: {
    label: string
    value: string | number | React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between gap-1 py-1 px-4">
            <span className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap font-semibold">
                {label}
            </span>
            <div className="flex-1 border-t border-muted-foreground/30 mx-2 border-dashed" />
            <span className="text-sm tracking-tight text-right font-mono">
                {value}
            </span>
        </div>
    )
}

function GlassPanel({
    children,
    className,
    contentClassName,
    title,
}: {
    children: React.ReactNode
    className?: string
    contentClassName?: string
    title?: string
}) {
    return (
        <div
            className={cn(
                'relative bg-white/4 dark:bg-black/30 backdrop-blur z-5 rounded-2xl flex flex-col border',
                className
            )}
        >
            {title && (
                <div className="px-4 pt-3.5 flex items-center justify-center">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                        {title}
                    </h3>
                </div>
            )}
            <div className={cn('flex-1 flex flex-col', contentClassName)}>
                {children}
            </div>
        </div>
    )
}

function FoodBar({
    hunger,
    className,
}: {
    hunger: number
    className?: string
}) {
    const fullIcons = Math.floor(hunger / 2)
    const halfIcon = hunger % 2 === 1

    return (
        <div className={cn('flex gap-0.5', className)}>
            {halfIcon && (
                <img
                    src="/food_half.png"
                    alt="half food"
                    className="w-4 image-pixelated"
                />
            )}
            {Array.from({ length: fullIcons }).map((_, i) => (
                <img
                    key={i}
                    src="/food.png"
                    alt="food"
                    className="w-4 image-pixelated"
                />
            ))}
        </div>
    )
}

const PICKAXE_TIERS = [
    'wooden_pickaxe',
    'stone_pickaxe',
    'copper_pickaxe',
    'iron_pickaxe',
    'golden_pickaxe',
    'diamond_pickaxe',
    'netherite_pickaxe',
]
const SHOVEL_TIERS = [
    'wooden_shovel',
    'stone_shovel',
    'copper_shovel',
    'iron_shovel',
    'golden_shovel',
    'diamond_shovel',
    'netherite_shovel',
]

function ToolIcon({ tool }: { tool: string }) {
    return (
        <div
            className="w-7 h-7 flex items-center justify-center rounded-2xl"
            title={tool}
        >
            {tool === 'any' ? (
                <span className="text-sm tracking-tight text-center leading-tight font-mono">
                    Any
                </span>
            ) : (
                <img
                    src={`/besttool/${tool}.png`}
                    alt={tool}
                    className="w-full h-full object-contain image-pixelated drop-shadow-sm"
                    onError={(e) => {
                        e.currentTarget.src =
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }}
                />
            )}
        </div>
    )
}

function ItemIcon({ item }: { item: string }) {
    return (
        <div
            className="w-7 h-7 flex items-center justify-center rounded-2xl"
            title={item}
        >
            <img
                src={`/renders/items/${item}.png`}
                alt={item}
                className="w-full h-full object-contain image-pixelated"
                onError={(e) => {
                    e.currentTarget.src =
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                }}
            />
        </div>
    )
}

function formatNumber(num: number | undefined) {
    if (num === undefined) return 'Unknown'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

export function ItemDetailPanel({ item, itemId }: ItemDetailPanelProps) {
    const { getItemCategories } = useData()
    const categories = getItemCategories(itemId)

    const getRarityColor = (tier: string) => {
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

    const formatRenewable = (r: string) => {
        if (r === 'yes') return 'Yes'
        if (r === 'no') return 'No'
        if (r === 'vault_only') return 'Vault'
        return undefined
    }

    const formatBoolean = (b: boolean | undefined) => {
        if (b === undefined) return undefined
        return b ? (
            <span className="text-emerald-400/90">Yes</span>
        ) : (
            <span className="text-red-400/80">No</span>
        )
    }

    const filterTools = (tools: string[] | undefined) => {
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

    const hasEdible =
        item.edible &&
        (item.edible.hunger !== undefined ||
            item.edible.saturation !== undefined)
    const hasCompostable = !!item.compostable
    const hasBlockStats = item.isBlock && item.block
    const hasItemStats = !item.isBlock && item.item
    const hasBreaking = item.isBlock && item.breaking

    return (
        <div className="w-full grid grid-rows-5 grid-cols-12 gap-2 animate-in fade-in duration-700 pb-12 max-w-300 mx-auto">
            {/* ROW 1: HEADER */}
            <GlassPanel className="md:col-span-2 aspect-square flex items-center justify-center p-4">
                <img
                    src={`/renders/${item.isBlock ? 'blocks' : 'items'}/${itemId}.png`}
                    alt={item.displayName}
                    className="w-full h-full object-contain drop-shadow-md transition-transform hover:scale-105 duration-500"
                    onError={(e) => {
                        const target = e.currentTarget
                        if (target.src.includes('/blocks/')) {
                            target.src = `/renders/items/${itemId}.png`
                        } else {
                            target.src =
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                        }
                    }}
                />
            </GlassPanel>

            <GlassPanel
                className="md:col-span-10 px-8 py-6 flex flex-col justify-center"
                contentClassName="gap-1"
            >
                <div className="flex justify-between gap-3">
                    <h2 className="text-3xl font-black tracking-tight text-foreground leading-none">
                        {item.displayName}
                    </h2>
                    <HoverCard openDelay={500} closeDelay={700}>
                        <HoverCardTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                            >
                                <InfoIcon className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="flex w-64 flex-col gap-0.5">
                            {item.displayNameGerman && (
                                <div className="flex gap-2 items-center">
                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-black text-muted-foreground/40 uppercase">
                                        DE
                                    </span>
                                    <span className="text-lg text-muted-foreground/60 font-semibold tracking-tight">
                                        {item.displayNameGerman}
                                    </span>
                                </div>
                            )}
                        </HoverCardContent>
                    </HoverCard>
                </div>
                <div className="flex mb-1.5 items-center">
                    <span className="text-lg font-mono text-muted-foreground/30 tracking-tight">
                        {itemId}
                    </span>
                </div>
                <div className="flex flex-no-wrap overflow-y-auto scrollbar-hidden items-center gap-2">
                    {categories.map((cat) => (
                        <Badge
                            key={cat}
                            variant="outline"
                            className="bg-white/9 border-none text-[10px] px-2.5 py-0.5 uppercase tracking-[0.2em] font-black text-muted-foreground"
                        >
                            {cat}
                        </Badge>
                    ))}
                    {categories.length === 0 && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-semibold">
                            No Categories
                        </span>
                    )}
                </div>
            </GlassPanel>

            {/* ROW 2: CORE STATS & ATTRIBUTES */}
            {/* 2x2 Stats Panel - Fixed 2x2 layout */}
            <GlassPanel
                className="md:col-span-2 min-h-35"
                contentClassName="grid grid-cols-2 grid-rows-2 p-2"
            >
                <StatItem
                    label="Renew"
                    value={formatRenewable(item.renewable)}
                />
                <StatItem
                    label="Type"
                    value={item.isBlock ? 'Block' : 'Item'}
                />
                <StatItem label="Stack" value={item.stackSize} />
                <StatItem
                    label="Rarity"
                    valueFontSize="text-xs leading-6"
                    value={
                        item.rarityTier.charAt(0).toUpperCase() +
                        item.rarityTier.slice(1)
                    }
                    className={getRarityColor(item.rarityTier)}
                />
            </GlassPanel>

            {/* Big 1x1 Difficulty Panel */}
            <GlassPanel
                className="md:col-span-2 min-h-35"
                contentClassName="flex flex-col items-center justify-center gap-2.5"
                title="Difficulty"
            >
                {item.obtaining.difficultyToObtain < 0 ? (
                    <div className="text-lg font-bold text-center font-mono text-foreground/90 tracking-tighter mb-4">
                        {item.obtaining.obtainability === 'unobtainable' ? (
                            <p className="text-red-400">
                                Not
                                <br />
                                Obtainable
                            </p>
                        ) : item.obtaining.obtainability === 'creative_only' ? (
                            <p className="text-pink-300">
                                Creative
                                <br />
                                Only
                            </p>
                        ) : (
                            'Unknown'
                        )}
                    </div>
                ) : (
                    <>
                        <div className="text-6xl font-black font-mono text-foreground/90 tracking-tighter leading-none">
                            {item.obtaining.difficultyToObtain}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-3">
                            to obtain
                        </p>
                    </>
                )}
            </GlassPanel>

            {/* Edible Panel */}
            <GlassPanel className="md:col-span-3 min-h-35" title="Edible">
                <div className="flex items-center h-full flex-col gap-3">
                    {hasEdible ? (
                        <>
                            <FoodBar
                                hunger={item.edible!.hunger}
                                className="pt-4"
                            />
                            <div className="grid grid-cols-3 w-full">
                                <StatItem
                                    label="Hunger"
                                    reverseLabel
                                    value={item.edible?.hunger}
                                />
                                <StatItem
                                    label="Saturate"
                                    reverseLabel
                                    value={item.edible?.saturation}
                                />
                                <StatItem
                                    label="Always"
                                    reverseLabel
                                    value={formatBoolean(
                                        item.edible?.alwaysConsumable
                                    )}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full mb-3">
                            <SmileySadIcon
                                weight="thin"
                                className="w-12 h-12 mb-2 text-muted-foreground/50"
                            />
                            <div className="text-muted-foreground/60 text-sm mt-1.5 font-bold">
                                Not Edible
                            </div>
                        </div>
                    )}
                </div>
            </GlassPanel>

            {/* Compostable Panel */}
            <GlassPanel
                className="md:col-span-2 min-h-35 flex flex-col items-center justify-center"
                title="Compostable"
            >
                <div className="flex flex-col items-center justify-center gap-1">
                    <img
                        src="/renders/blocks/composter.png"
                        alt="compost"
                        className={`h-12 w-12 drop-shadow-sm mt-4 ${hasCompostable ? '' : 'grayscale opacity-70'}`}
                    />
                    {hasCompostable ? (
                        <div className="text-2xl font-bold text-emerald-400/80 tracking-tighter">
                            {(item.compostable!.chance * 100).toFixed(0)}%
                        </div>
                    ) : (
                        <div className="text-muted-foreground/60 text-sm mt-0.5 font-bold tracking-tight">
                            Not Compostable
                        </div>
                    )}
                </div>
            </GlassPanel>

            <GlassPanel className="md:col-span-3">
                <div className="grid grid-cols-2 grid-rows-2 p-2">
                    <StatItem
                        label="Crafting Ingredient"
                        labelFontSize="text-[9px]"
                        valueFontSize="text-[14px]"
                        reverseLabel
                        value={formatBoolean(item.craftingIngredient)}
                    />
                    <StatItem
                        label="Armor Trim Material"
                        labelFontSize="text-[9px]"
                        valueFontSize="text-[14px]"
                        reverseLabel
                        value={formatBoolean(item.isArmorTrimMaterial)}
                    />

                    <StatItem
                        label="Burn Time"
                        labelFontSize="text-[9px]"
                        valueFontSize="text-[14px]"
                        reverseLabel
                        value={
                            item.fuel
                                ? `${item.fuel.burnTimeSeconds}s`
                                : formatBoolean(false)
                        }
                    />
                    <StatItem
                        label="Items Smelted"
                        labelFontSize="text-[9px]"
                        valueFontSize="text-[14px]"
                        reverseLabel
                        value={
                            item.fuel?.numberOfItemsSmelted
                                ? item.fuel.numberOfItemsSmelted
                                : formatBoolean(false)
                        }
                    />
                </div>
            </GlassPanel>

            {/* Block Properties 4x2 grid */}
            <GlassPanel
                className="md:col-span-3 row-span-2"
                title="Block Properties"
                contentClassName="flex flex-col "
            >
                {hasBlockStats && (
                    <div className="flex-1 flex flex-col mt-2.5 gap-0.5">
                        <ListItem
                            label="Hardness"
                            value={item.block?.hardness}
                        />
                        <ListItem
                            label="Blast Resistance"
                            value={formatNumber(item.block?.blastResistance)}
                        />
                        <ListItem
                            label="Luminous"
                            value={item.block?.luminousLevel}
                        />
                        <ListItem
                            label="Transparent"
                            value={(() => {
                                switch (item.block?.transparency) {
                                    case 'transparent':
                                        return (
                                            <span className="text-emerald-400/90">
                                                Yes
                                            </span>
                                        )
                                    case 'partial':
                                        return (
                                            <span className="text-amber-400/80">
                                                Partial
                                            </span>
                                        )
                                    default:
                                        return (
                                            <span className="text-red-400/80">
                                                Opaque
                                            </span>
                                        )
                                }
                            })()}
                        />

                        <ListItem
                            label="Waterloggable"
                            value={formatBoolean(item.block?.waterloggable)}
                        />
                        <ListItem
                            label="Block Entity"
                            value={formatBoolean(item.block?.isBlockEntity)}
                        />
                        <ListItem
                            label="Flammable"
                            value={formatBoolean(item.block?.flammable)}
                        />
                        <ListItem
                            label="Catches Fire"
                            value={formatBoolean(item.block?.catchesFire)}
                        />
                    </div>
                )}
                {hasItemStats && (
                    <div className="flex-1 flex flex-col mt-2.5 gap-0.5">
                        <ListItem
                            label="Durability"
                            value={item.item?.durability}
                        />
                        <ListItem
                            label="Attack Damage"
                            value={
                                item.item?.damage?.attackDamage !== undefined
                                    ? item.item.damage.attackDamage
                                    : formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Attack Speed"
                            value={
                                item.item?.damage?.attackSpeed !== undefined
                                    ? item.item.damage.attackSpeed
                                    : formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Armor Points"
                            value={
                                item.item?.armor?.armorPoints !== undefined
                                    ? item.item.armor.armorPoints
                                    : formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Armor Toughness"
                            value={
                                item.item?.armor?.toughness !== undefined
                                    ? item.item.armor.toughness
                                    : formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Knockback Resist."
                            value={
                                item.item?.armor?.knockbackResistance !==
                                undefined
                                    ? item.item.armor.knockbackResistance
                                    : formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Enchantability"
                            value={item.item?.enchantability}
                        />
                        <ListItem
                            label="Fire Resistant"
                            value={formatBoolean(item.item?.fireResistant)}
                        />
                    </div>
                )}
            </GlassPanel>

            {/* Breaking Panel */}
            <GlassPanel className="md:col-span-4 min-h-35" title="Breaking">
                {hasBreaking && (
                    <div className="flex-1 flex flex-col justify-center mb-3">
                        <div className="grid grid-cols-3 h-1/2">
                            <StatItem
                                label="Silktouch"
                                value={
                                    item.breaking?.requiresSilkTouch ===
                                    'silk_touch_only'
                                        ? 'Required'
                                        : item.breaking?.requiresSilkTouch ===
                                            'yes'
                                          ? 'Yes'
                                          : 'No'
                                }
                            />
                            <StatItem
                                label="Instant"
                                value={formatBoolean(
                                    item.breaking?.instantBreaking
                                )}
                            />
                            <div className="flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold">
                                    Best Tool
                                </span>
                                {item.block?.bestTools.map((tool) => (
                                    <ToolIcon key={tool} tool={tool} />
                                ))}
                            </div>
                        </div>
                        {(item.breaking?.requiresSpecialToolsToDrop?.length ??
                        0 > 0) ? (
                            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-2 relative">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold absolute top-1">
                                    Required Tools
                                </span>
                                <div className="flex flex-wrap justify-center gap-2 mt-3">
                                    {filterTools(
                                        item.breaking
                                            ?.requiresSpecialToolsToDrop
                                    ).map((item) => (
                                        <ItemIcon key={item} item={item} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold mt-2.5">
                                {item.obtaining.obtainability === 'survival'
                                    ? 'Drops by Hand'
                                    : 'Does not drop'}
                            </span>
                        )}
                    </div>
                )}
            </GlassPanel>
        </div>
    )
}
