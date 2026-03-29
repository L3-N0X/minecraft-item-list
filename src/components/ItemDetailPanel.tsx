import React, { useState, useRef, useMemo } from 'react'
import type { ItemData } from '@/context/DataContext'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { ExclamationMarkIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react'
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
                'relative bg-white/4 dark:bg-black/30 backdrop-blur z-5 rounded-2xl flex flex-col border dark:border-border border-white/40 overflow-hidden',
                className
            )}
        >
            {title && (
                <div className="px-4 pt-3.5 flex items-center justify-center shrink-0">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                        {title}
                    </h3>
                </div>
            )}
            <div
                className={cn('flex-1 min-h-0 flex flex-col', contentClassName)}
            >
                {children}
            </div>
        </div>
    )
}

function FlippableGlassPanel({
    children,
    comment,
    className,
    contentClassName,
    title,
}: {
    children: React.ReactNode
    comment?: string
    className?: string
    contentClassName?: string
    title?: string
}) {
    const [isFlipped, setIsFlipped] = useState(false)

    if (!comment) {
        return (
            <GlassPanel
                className={className}
                contentClassName={contentClassName}
                title={title}
            >
                {children}
            </GlassPanel>
        )
    }

    return (
        <div
            className={cn('relative perspective-1000', className)}
            style={{ perspective: '1000px' }}
        >
            <div
                className={cn(
                    'relative w-full h-full transition-transform duration-500 transform-style-3d cursor-pointer',
                    isFlipped && 'rotate-y-180'
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front */}
                <div
                    className="absolute w-full h-full backface-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        opacity: isFlipped ? 0 : 1,
                        transition: 'opacity 0s 150ms',
                        pointerEvents: isFlipped ? 'none' : 'auto',
                    }}
                >
                    <GlassPanel
                        className="h-full hover:scale-[1.01] transition-transform"
                        contentClassName={contentClassName}
                        title={title}
                    >
                        {children}
                        <div className="absolute top-2 right-2">
                            <ExclamationMarkIcon
                                className="w-6 h-6 dark:text-red-400/40 dark:hover:text-red-400/70 text-red-800/40 hover:text-red-800/70 transition-colors"
                                weight="duotone"
                            />
                        </div>
                    </GlassPanel>
                </div>

                {/* Back */}
                <div
                    className="absolute w-full h-full backface-hidden"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        opacity: isFlipped ? 1 : 0,
                        transition: 'opacity 0s 250ms',
                        pointerEvents: isFlipped ? 'auto' : 'none',
                    }}
                >
                    <GlassPanel className="h-full" title={title}>
                        <div className="flex-1 flex flex-col items-center justify-center px-3 py-1 gap-1 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted-foreground/30 mb-5">
                            <div className="flex flex-col items-center justify-around h-full">
                                <ExclamationMarkIcon
                                    className="w-8 h-8 min-h-8 dark:text-red-400/40 dark:hover:text-red-400/70 text-red-800/40 hover:text-red-800/70"
                                    weight="duotone"
                                />
                                <p className="text-sm text-muted-foreground/80 text-center">
                                    {comment}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-xs"
                                >
                                    <ArrowsClockwiseIcon className="w-3 h-3 mr-1" />
                                    Flip Back
                                </Button>
                            </div>
                        </div>
                    </GlassPanel>
                </div>
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

function BiomeIcon({ biome }: { biome: string }) {
    return (
        <div
            className="flex flex-col items-center gap-2 py-2 px-1 w-full shrink-0"
            title={biome}
        >
            <div className="w-13 h-13 flex items-center justify-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-black/20">
                <img
                    src={`/biomes/${biome}.png`}
                    alt={biome}
                    className="w-full h-full object-cover image-pixelated"
                    draggable={false}
                    onError={(e) => {
                        e.currentTarget.src =
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }}
                />
            </div>
            <span className="text-[10px] text-center text-foreground font-mono leading-tight capitalize tracking-tight">
                {biome.replace(/_/g, ' ')}
            </span>
        </div>
    )
}

function StructureIcon({ structure }: { structure: string }) {
    return (
        <div
            className="flex flex-col items-center gap-2 py-2 px-1 w-full shrink-0"
            title={structure}
        >
            <div className="w-13 h-13 flex items-center justify-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-black/20">
                <img
                    src={`/structures/${structure}.png`}
                    alt={structure}
                    className="w-full h-full object-cover image-pixelated"
                    draggable={false}
                    onError={(e) => {
                        e.currentTarget.src =
                            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                    }}
                />
            </div>
            <span className="text-[10px] text-center text-foreground font-mono leading-tight capitalize tracking-tight">
                {structure.replace(/_/g, ' ')}
            </span>
        </div>
    )
}

function MobIcon({ mob }: { mob: string }) {
    return (
        <div
            className="w-26 h-26 flex items-center justify-center rounded-xl overflow-hidden shrink-0"
            title={mob}
        >
            <img
                src={`/entities/${mob}.png`}
                alt={mob}
                className="w-full h-full object-contain image-pixelated drop-shadow-sm p-1.5"
                draggable={false}
                onError={(e) => {
                    e.currentTarget.src =
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                }}
            />
        </div>
    )
}

const ROMAN_NUMERALS = [
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

function DimensionItem({ dimension }: { dimension: string }) {
    const getDimensionColor = (dim: string) => {
        if (dim.includes('nether')) return 'text-red-300 border-red-500/30'
        if (dim.includes('end')) return 'text-purple-300 border-purple-500/30'
        return 'text-emerald-300 border-emerald-500/30'
    }

    return (
        <div className="flex justify-center items-center border rounded-lg pr-2.5 gap-3 h-8 pl-1">
            <img
                src={`/dimensions/${dimension}.png`}
                alt={dimension}
                className="w-6 h-6 rounded-sm object-cover image-pixelated"
                onError={(e) => {
                    e.currentTarget.src =
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                }}
            />
            <div
                className={cn(
                    'text-sm tracking-[0.05em] font-mono capitalize',
                    getDimensionColor(dimension)
                )}
            >
                {dimension.replace(/_/g, ' ')}
            </div>
        </div>
    )
}

function formatNumber(num: number | undefined) {
    if (num === undefined) return 'Unknown'
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
}

function formatQuantity(
    quantity: number | { min: number; max: number } | undefined
): string {
    if (quantity === undefined) return '?'
    if (typeof quantity === 'number') return quantity.toString()
    return `${quantity.min}-${quantity.max}`
}

function formatChance(chance: number | undefined): string {
    if (chance === undefined) return '?'
    return `${(chance * 100).toFixed(1)}%`
}

export function ItemDetailPanel({ item, itemId }: ItemDetailPanelProps) {
    const { getItemCategories } = useData()
    const categories = getItemCategories(itemId)
    const blockLoots = item.obtaining.blockLoot ?? []
    const totalBlocks = blockLoots.reduce(
        (acc, loot) => acc + (loot.blocks?.length ?? 0),
        0
    )

    const generatedLootStructures =
        item.obtaining.generatedLoot?.structures ?? []
    const totalLootRows = generatedLootStructures.reduce(
        (acc, s) => acc + s.chests.length,
        0
    )

    // Scroll Refs
    const mobLootScrollRef = useRef<HTMLDivElement>(null)
    const biomesScrollRef = useRef<HTMLDivElement>(null)
    const structuresScrollRef = useRef<HTMLDivElement>(null)
    const tradingScrollRef = useRef<HTMLDivElement>(null)
    const blockLootScrollRef = useRef<HTMLDivElement>(null)

    // Reusable drag-to-scroll logic
    const setupDragScroll = (
        ref: React.RefObject<HTMLDivElement | null>,
        direction: 'horizontal' | 'vertical' | 'both' = 'horizontal'
    ) => {
        const state = {
            isDragging: false,
            startX: 0,
            startY: 0,
            scrollLeft: 0,
            scrollTop: 0,
            hasMoved: false,
        }

        return {
            onMouseDown: (e: React.MouseEvent) => {
                if (!ref.current) return
                state.isDragging = true
                state.hasMoved = false
                state.startX = e.clientX
                state.startY = e.clientY
                state.scrollLeft = ref.current.scrollLeft
                state.scrollTop = ref.current.scrollTop
                ref.current.style.cursor = 'grabbing'
                ref.current.style.userSelect = 'none'
            },
            onMouseLeave: () => {
                if (!ref.current) return
                state.isDragging = false
                ref.current.style.cursor =
                    direction === 'horizontal' ? 'grab' : 'default'
                ref.current.style.userSelect = 'auto'
            },
            onMouseUp: () => {
                if (!ref.current) return
                state.isDragging = false
                ref.current.style.cursor =
                    direction === 'horizontal' ? 'grab' : 'default'
                ref.current.style.userSelect = 'auto'
            },
            onMouseMove: (e: React.MouseEvent) => {
                if (!state.isDragging || !ref.current) return

                const walkX = e.clientX - state.startX
                const walkY = e.clientY - state.startY

                if (Math.abs(walkX) > 3 || Math.abs(walkY) > 3) {
                    state.hasMoved = true
                }

                if (!state.hasMoved) return

                e.preventDefault()
                e.stopPropagation()

                if (direction === 'horizontal' || direction === 'both') {
                    ref.current.scrollLeft = state.scrollLeft - walkX * 1.5
                }

                if (direction === 'vertical' || direction === 'both') {
                    ref.current.scrollTop = state.scrollTop - walkY * 1.5
                }
            },
            onClick: (e: React.MouseEvent) => {
                if (state.hasMoved) {
                    e.preventDefault()
                    e.stopPropagation()
                }
            },
        }
    }

    const mobLootDragProps = useMemo(
        () => setupDragScroll(mobLootScrollRef, 'horizontal'),
        []
    )
    const biomesDragProps = useMemo(
        () => setupDragScroll(biomesScrollRef, 'both'),
        []
    )
    const structuresDragProps = useMemo(
        () => setupDragScroll(structuresScrollRef, 'both'),
        []
    )
    const tradingDragProps = useMemo(
        () => setupDragScroll(tradingScrollRef, 'horizontal'),
        []
    )
    const blockLootDragProps = useMemo(
        () => setupDragScroll(blockLootScrollRef, 'horizontal'),
        []
    )

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
            <span className="dark:text-red-400/80 text-red-700/80">No</span>
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
    const itemStatCount = function () {
        if (hasBlockStats) return 8
        let count = 0
        if (item.item?.armor?.armorPoints !== undefined) count += 3
        if (item.item?.damage !== undefined) count += 2
        if (item.item?.enchantability !== undefined) count++
        if (item.item?.durability !== undefined) count++
        if (item.item?.fireResistant !== undefined) count++
        return count
    }

    const hasBreaking = item.isBlock && item.breaking

    const mobLoot = item.obtaining.mobLoot ?? []
    const hasMobLoot = mobLoot.length > 0
    const tradingVillagers = item.obtaining.trading?.villagers ?? []
    const hasWanderingTrader = !!item.obtaining.trading?.wanderingTrader
    const traderCount = tradingVillagers.length + (hasWanderingTrader ? 1 : 0)
    const hasTrading = traderCount > 0

    const biomes = item.obtaining.naturalGeneration?.biomes ?? []
    const structures =
        item.obtaining.naturalGeneration?.partOfStructures?.structures ?? []
    const hasBiomes =
        biomes.length > 0 ||
        (item.obtaining.naturalGeneration !== undefined &&
            biomes.length === 0 &&
            item.obtaining.naturalGeneration.comment !== undefined &&
            item.obtaining.naturalGeneration.comment.length === 0)
    const hasStructures = structures.length > 0

    return (
        <div className="w-full grid grid-cols-12 auto-rows-[160px] grid-flow-row-dense gap-2 md:gap-3 animate-in fade-in duration-700 pb-12 max-w-350 mx-auto">
            {/* ROW 1: HEADER */}
            <GlassPanel className="md:col-span-2 flex items-center justify-center p-4">
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
                    <HoverCard openDelay={200} closeDelay={500}>
                        <HoverCardTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 p-0"
                            >
                                {/* <InfoIcon className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" /> */}
                                <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-black text-muted-foreground/40 uppercase">
                                    DE
                                </span>
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent
                            className="flex min-w-64 w-auto flex-col gap-0.5"
                            side="left"
                        >
                            {item.displayNameGerman && (
                                <div className="flex gap-2 items-center">
                                    <span className="text-base bg-white/10 px-1.5 py-0.5 rounded font-black text-muted-foreground/40 uppercase">
                                        DE
                                    </span>
                                    <h2 className="text-xl font-black tracking-tight text-foreground leading-none">
                                        {item.displayNameGerman}
                                    </h2>
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
                className="md:col-span-3"
                contentClassName="grid grid-cols-2 grid-rows-2 p-2 flex-1"
            >
                <StatItem
                    label="Renewable"
                    value={formatRenewable(item.renewable)}
                />
                <StatItem
                    label="Type"
                    value={item.isBlock ? 'Block' : 'Item'}
                />
                <StatItem label="Stack" value={item.stackSize} />
                <StatItem
                    label="Rarity"
                    // valueFontSize="text-xs leading-6"
                    value={
                        item.rarityTier.charAt(0).toUpperCase() +
                        item.rarityTier.slice(1)
                    }
                    className={getRarityColor(item.rarityTier)}
                />
            </GlassPanel>

            {/* Big 1x1 Difficulty Panel */}
            <GlassPanel
                className="md:col-span-2"
                contentClassName="flex flex-col items-center justify-center"
                title="Difficulty"
            >
                {item.obtaining.difficultyToObtain < 0 ? (
                    <div className="text-lg font-bold text-center font-mono text-foreground/90 tracking-tighter mb-4">
                        {item.obtaining.obtainability === 'unobtainable' ? (
                            <p className="dark:text-red-400/80 text-red-800/80">
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
                        <div className="flex-1 flex justify-center items-center text-6xl font-black font-mono text-foreground/90 tracking-tighter leading-none">
                            {item.obtaining.difficultyToObtain}
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-5">
                            to obtain
                        </p>
                    </>
                )}
            </GlassPanel>

            {/* Craftable Panel */}
            <GlassPanel
                className="md:col-span-2 flex flex-col items-center justify-center"
                title="Craftable"
            >
                <div className="flex flex-col items-center justify-center gap-2 mt-2">
                    <img
                        src="/crafting_yes.png"
                        alt="craftable"
                        className={`h-16 w-16 drop-shadow-sm mt-2 ${item.obtaining.craftable ? '' : 'grayscale opacity-50'}`}
                        onError={(e) => {
                            e.currentTarget.src =
                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                        }}
                    />
                    <div
                        className={cn(
                            'text-xs font-mono tracking-tight mt-1',
                            item.obtaining.craftable
                                ? 'text-emerald-400/90'
                                : 'dark:text-red-400/80 text-red-700/80'
                        )}
                    >
                        {item.obtaining.craftable ? 'Yes' : 'No'}
                    </div>
                </div>
            </GlassPanel>

            {/* Smelting Panel */}
            <GlassPanel
                className="md:col-span-2 flex flex-col items-center justify-center"
                title="Smeltable"
            >
                <div className="flex flex-1 flex-col items-center justify-center gap-1">
                    <div className="flex flex-1 flex-wrap gap-y-0.5 gap-x-2 items-center justify-center min-h-12 mt-2">
                        {item.obtaining.smelting &&
                        item.obtaining.smelting.smeltable.length > 0 ? (
                            item.obtaining.smelting.smeltable.map(
                                (furnace, index) => (
                                    <React.Fragment key={furnace}>
                                        <img
                                            key={furnace}
                                            src={
                                                furnace === 'campfire'
                                                    ? '/renders/items/campfire.png'
                                                    : `/renders/blocks/${furnace}.png`
                                            }
                                            alt={furnace}
                                            className="h-10 w-10 drop-shadow-sm object-contain image-pixelated"
                                            title={furnace.replace(/_/g, ' ')}
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                            }}
                                        />
                                        {index === 1 && (
                                            <div className="basis-full h-0 m-0" />
                                        )}
                                    </React.Fragment>
                                )
                            )
                        ) : (
                            <img
                                src="/renders/blocks/furnace.png"
                                alt="furnace"
                                className="h-14 w-14 drop-shadow-sm grayscale opacity-40 object-contain image-pixelated"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                }}
                            />
                        )}
                    </div>
                    <div
                        className={cn(
                            'text-xs font-mono tracking-tight mb-5',
                            (item.obtaining.smelting?.smeltable.length ?? 0) > 0
                                ? 'text-emerald-400/90'
                                : 'dark:text-red-400/80 text-red-700/80'
                        )}
                    >
                        {(item.obtaining.smelting?.smeltable.length ?? 0) > 0
                            ? 'Yes'
                            : 'No'}
                    </div>
                </div>
            </GlassPanel>

            <GlassPanel className="md:col-span-3">
                <div className="grid grid-cols-2 grid-rows-2 p-2 flex-1">
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
                className={cn(
                    itemStatCount() > 3 ? 'md:row-span-2' : 'md:row-span-1',
                    'md:col-span-3'
                )}
                // "md:col-span-3 row-span-2"
                title="Properties"
                contentClassName="flex flex-col overflow-y-auto"
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
                                            <span className="dark:text-emerald-400/90 text-emerald-800/90">
                                                Yes
                                            </span>
                                        )
                                    case 'partial':
                                        return (
                                            <span className="dark:text-amber-400/80 text-amber-700/80">
                                                Partial
                                            </span>
                                        )
                                    default:
                                        return (
                                            <span className="dark:text-red-400/80 text-red-700/80">
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
                        {item.item?.durability !== undefined && (
                            <ListItem
                                label="Durability"
                                value={item.item?.durability}
                            />
                        )}
                        {item.item?.damage?.attackDamage !== undefined && (
                            <ListItem
                                label="Attack Damage"
                                value={
                                    item.item?.damage?.attackDamage !==
                                    undefined
                                        ? item.item.damage.attackDamage
                                        : formatBoolean(false)
                                }
                            />
                        )}
                        {item.item?.damage?.attackSpeed !== undefined && (
                            <ListItem
                                label="Attack Speed"
                                value={
                                    item.item?.damage?.attackSpeed !== undefined
                                        ? item.item.damage.attackSpeed
                                        : formatBoolean(false)
                                }
                            />
                        )}
                        {item.item?.armor && (
                            <>
                                <ListItem
                                    label="Armor Points"
                                    value={
                                        item.item?.armor?.armorPoints !==
                                        undefined
                                            ? item.item.armor.armorPoints
                                            : formatBoolean(false)
                                    }
                                />
                                <ListItem
                                    label="Armor Toughness"
                                    value={
                                        item.item?.armor?.toughness !==
                                        undefined
                                            ? item.item.armor.toughness
                                            : formatBoolean(false)
                                    }
                                />
                                <ListItem
                                    label="Knockback Resist."
                                    value={
                                        item.item?.armor
                                            ?.knockbackResistance !== undefined
                                            ? item.item.armor
                                                  .knockbackResistance
                                            : formatBoolean(false)
                                    }
                                />
                            </>
                        )}
                        <ListItem
                            label="Enchantability"
                            value={
                                item.item?.enchantability ??
                                formatBoolean(false)
                            }
                        />
                        <ListItem
                            label="Fire Resistant"
                            value={formatBoolean(item.item?.fireResistant)}
                        />
                    </div>
                )}
            </GlassPanel>

            {/* Breaking Panel */}
            {hasBreaking && (
                <GlassPanel className="md:col-span-4" title="Breaking">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex h-1/2 flex-1">
                            <StatItem
                                className="flex-1"
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
                                className="flex-1"
                                label="Instant"
                                value={formatBoolean(
                                    item.breaking?.instantBreaking
                                )}
                            />
                            <div className="flex-1 flex flex-col items-center justify-center gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold">
                                    Best Tool
                                </span>
                                <div className="flex gap-1">
                                    {item.block?.bestTools.map((tool) => (
                                        <ToolIcon key={tool} tool={tool} />
                                    ))}
                                </div>
                            </div>
                        </div>
                        {(item.breaking?.requiresSpecialToolsToDrop?.length ??
                        0 > 0) ? (
                            <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold absolute top-0">
                                    Required Tools
                                </span>
                                <div className="flex flex-wrap justify-center gap-2 mt-3 overflow-y-auto">
                                    {filterTools(
                                        item.breaking
                                            ?.requiresSpecialToolsToDrop
                                    ).map((item) => (
                                        <ItemIcon key={item} item={item} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] uppercase tracking-[0.2em] mb-5 text-center text-muted-foreground">
                                {item.obtaining.obtainability === 'survival'
                                    ? 'Drops by Hand'
                                    : 'Does not drop'}
                            </span>
                            // </div>
                        )}
                    </div>
                </GlassPanel>
            )}

            {/* Mob Loot Panel */}
            <GlassPanel
                className={cn(
                    hasMobLoot
                        ? mobLoot.length >= 2
                            ? 'md:col-span-9'
                            : 'md:col-span-5'
                        : 'md:col-span-2',
                    'row-span-1'
                )}
                title="Mob Loot"
                contentClassName="overflow-hidden"
            >
                {hasMobLoot ? (
                    <div
                        ref={mobLootScrollRef}
                        className="flex flex-row h-full overflow-x-auto scrollbar-hidden items-center cursor-grab select-none active:cursor-grabbing"
                        {...mobLootDragProps}
                    >
                        {mobLoot.map((loot, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-none items-center gap-4 px-6 min-w-50 h-3/4">
                                    <MobIcon mob={loot.mob} />
                                    <div className="flex flex-col h-full py-1 min-w-24">
                                        <span className="text-base font-bold min-w-0 uppercase tracking-tight text-foreground/90 truncate">
                                            {loot.mob.replace(/_/g, ' ')}
                                        </span>
                                        <div className="flex gap-2 items-baseline">
                                            <span className="text-base mt-1 font-semibold font-mono text-emerald-400/90 leading-none">
                                                {formatChance(loot.chance)}
                                            </span>
                                            <div className="shrink-0 h-3 w-px bg-white/20" />
                                            <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                                                {formatQuantity(loot.quantity)}x
                                            </span>
                                        </div>
                                        {(loot.comment && (
                                            <p className="text-[10px] text-muted-foreground/70 max-w-44 italic leading-tight line-clamp-2 mt-0.5">
                                                {loot.comment}
                                            </p>
                                        )) || <div className="mt-1" />}
                                    </div>
                                </div>
                                {idx < mobLoot.length - 1 && (
                                    <div className="h-[50%] w-px bg-white/10 shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <img
                            className="w-12 h-12 mb-2 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                            src="/entities/creeper.png"
                            alt="no mob loot"
                        />
                        <div className="text-muted-foreground/60 text-xs px-2 text-center">
                            No Mob Drops This Item
                        </div>
                    </div>
                )}
            </GlassPanel>

            {/* Edible Panel */}
            {!item.isBlock && (
                <GlassPanel
                    className={cn(
                        hasEdible ? 'md:col-span-3' : 'md:col-span-2'
                    )}
                    title="Edible"
                >
                    <div className="flex flex-1 items-center h-full flex-col gap-3">
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
                            <div className="flex flex-col items-center justify-center h-full flex-1 pb-5">
                                <div className="flex flex-1 items-center justify-center">
                                    <img
                                        src="/food.png"
                                        alt="not edible"
                                        className="w-12 h-12 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                                    />
                                </div>
                                <div className="text-muted-foreground/60 text-xs">
                                    Not Edible
                                </div>
                            </div>
                        )}
                    </div>
                </GlassPanel>
            )}

            {/* Compostable Panel */}
            {hasCompostable && (
                <GlassPanel
                    className="md:col-span-2 flex flex-col items-center justify-center"
                    title="Compostable"
                >
                    <div className="flex flex-1 flex-col items-center justify-center pb-5">
                        <div className="flex flex-1 items-center justify-center">
                            <img
                                src="/renders/blocks/composter.png"
                                alt="compost"
                                className={`h-12 w-12 mt-2 drop-shadow-sm ${hasCompostable ? '' : 'grayscale opacity-70'}`}
                            />
                        </div>
                        {hasCompostable ? (
                            <div className="text-2xl font-bold text-emerald-400/80 tracking-tighter">
                                {(item.compostable!.chance * 100).toFixed(0)}%
                            </div>
                        ) : (
                            <div className="text-muted-foreground/60 flex text-xs tracking-tight">
                                Not Compostable
                            </div>
                        )}
                    </div>
                </GlassPanel>
            )}

            {/* Enchantments Panel */}
            {item.possibleEnchantments &&
                item.possibleEnchantments.length > 0 && (
                    <GlassPanel
                        className={cn(
                            !item.possibleEnchantments ||
                                item.possibleEnchantments.length === 0
                                ? 'md:col-span-2'
                                : 'md:col-span-4',
                            !item.possibleEnchantments ||
                                item.possibleEnchantments.length <= 4
                                ? 'md:row-span-1'
                                : 'md:row-span-2'
                        )}
                        title="Enchantments"
                        contentClassName="flex flex-col overflow-y-auto"
                    >
                        <div className="flex-1 flex flex-col gap-0.5 pb-5 pt-2">
                            {item.possibleEnchantments?.map((ench) => {
                                const maxLevel =
                                    typeof ench.levels === 'number'
                                        ? ench.levels
                                        : ench.levels.max
                                const roman =
                                    maxLevel > 1
                                        ? ROMAN_NUMERALS[maxLevel] ||
                                          maxLevel.toString()
                                        : '/'
                                const name = ench.id.replace(/_/g, ' ')

                                return (
                                    <div
                                        key={ench.id}
                                        className="flex items-center justify-between gap-1 py-1 px-4"
                                    >
                                        <span className="text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground font-semibold leading-tight">
                                            {name}
                                        </span>
                                        {/* {roman ? ( */}
                                        <>
                                            <div className="flex-1 border-t border-muted-foreground/30 mx-2 border-dashed shrink-0" />
                                            <span className="text-sm tracking-tight text-right font-mono font-bold dark:text-purple-400/80 text-purple-800/80 shrink-0">
                                                {roman}
                                            </span>
                                        </>
                                        {/* ) : null} */}
                                    </div>
                                )
                            })}
                            {!item.possibleEnchantments ||
                            item.possibleEnchantments.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center">
                                    <div className="flex-1 flex items-center justify-center">
                                        <img
                                            className="w-12 h-12 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                                            src="/renders/items/enchanted_book.png"
                                        />
                                    </div>
                                    <div className="text-muted-foreground/60 text-center px-2 text-xs">
                                        Item cannot be enchanted
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </GlassPanel>
                )}

            {/* Fishing Panel */}
            {item.obtaining.fishing && (
                <FlippableGlassPanel
                    className="md:col-span-2"
                    title="Fishing"
                    comment={item.obtaining.fishing.comment}
                    contentClassName="flex flex-col items-center justify-center"
                >
                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <img
                            src="/renders/items/fishing_rod.png"
                            alt="Fishing"
                            className="h-10 w-10 drop-shadow-sm object-contain image-pixelated"
                        />
                        <span className="text-[12px] font-bold font-mono text-center tracking-tight text-foreground/80 uppercase px-2 leading-tight">
                            {item.obtaining.fishing.category}
                        </span>
                    </div>
                    <div className="flex gap-2 items-baseline mb-5">
                        <span className="text-sm font-mono text-emerald-400/90 leading-none">
                            {formatChance(item.obtaining.fishing.chance)}
                        </span>
                        <div className="shrink-0 h-3 w-px bg-white/20" />
                        <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                            {formatQuantity(item.obtaining.fishing.quantity)}x
                        </span>
                    </div>
                </FlippableGlassPanel>
            )}

            {/* Bartering Panel */}
            {item.obtaining.bartering && (
                <FlippableGlassPanel
                    className="md:col-span-2"
                    title="Bartering"
                    comment={item.obtaining.bartering?.comment}
                    contentClassName="flex flex-col items-center justify-center pb-5"
                >
                    <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                        <img
                            src="/bartering.png"
                            alt="Bartering"
                            className="h-12 w-12 drop-shadow-sm object-contain image-pixelated"
                            onError={(e) => {
                                e.currentTarget.src =
                                    '/renders/items/gold_ingot.png'
                            }}
                        />
                        <span className="text-[11px] font-bold font-mono text-center tracking-tight text-foreground/80 uppercase px-2 leading-tight">
                            Piglin
                        </span>
                    </div>
                    <div className="flex gap-2 items-baseline">
                        <span className="text-base font-semibold font-mono text-emerald-400/90 leading-none">
                            {formatChance(item.obtaining.bartering?.chance)}
                        </span>
                        <div className="shrink-0 h-3 w-px bg-white/20" />
                        <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                            {formatQuantity(item.obtaining.bartering?.quantity)}
                            x
                        </span>
                    </div>
                </FlippableGlassPanel>
            )}

            {/* Trading Panel */}
            {hasTrading && (
                <GlassPanel
                    className={cn(
                        traderCount >= 2 ? 'md:col-span-8' : 'md:col-span-5',
                        'row-span-1'
                    )}
                    title="Trading"
                    contentClassName="overflow-hidden"
                >
                    <div
                        ref={tradingScrollRef}
                        className="flex flex-row h-full overflow-x-auto scrollbar-hidden items-center cursor-grab select-none active:cursor-grabbing"
                        {...tradingDragProps}
                    >
                        {tradingVillagers.map((v, idx) => (
                            <React.Fragment key={idx}>
                                <div className="flex flex-none  gap-2 px-5 min-w-50 h-3/4">
                                    <div className="w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden shrink-0">
                                        <img
                                            src={`/villagers/${v.profession}.png`}
                                            alt={v.profession}
                                            draggable={false}
                                            className="w-full h-full object-contain image-pixelated drop-shadow-sm p-1"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col h-full py-1 min-w-24">
                                        <span className="text-base font-bold min-w-0 uppercase tracking-tight text-foreground/90 truncate">
                                            {v.profession.replace(/_/g, ' ')}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground/60 uppercase font-black">
                                            Level {v.level}
                                        </span>
                                        <div className="flex gap-2 items-baseline mt-1">
                                            <span className="text-base font-semibold font-mono text-emerald-400/90 leading-none">
                                                {formatChance(v.probability)}
                                            </span>
                                            <div className="shrink-0 h-3 w-px bg-white/20" />
                                            <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                                                {formatQuantity(v.quantity)}x
                                            </span>
                                        </div>
                                        {v.comment && (
                                            <p className="text-[10px] text-muted-foreground/70 max-w-44 italic leading-tight line-clamp-2 mt-0.5">
                                                {v.comment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {(idx < tradingVillagers.length - 1 ||
                                    hasWanderingTrader) && (
                                    <div className="h-[50%] w-px bg-white/10 shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                        {hasWanderingTrader && (
                            <div className="flex flex-none items-center gap-2 px-5 min-w-50 h-3/4">
                                <div className="w-20 h-20 flex items-center justify-center rounded-xl overflow-hidden shrink-0">
                                    <img
                                        src="/entities/wandering_trader.png"
                                        alt="Wandering Trader"
                                        className="w-full h-full object-contain image-pixelated drop-shadow-sm p-1"
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                '/renders/items/wandering_trader_spawn_egg.png'
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col h-full py-1 min-w-24">
                                    <span className="text-base font-bold min-w-0 uppercase tracking-tight text-foreground/90 truncate">
                                        Wandering Trader
                                    </span>
                                    <div className="flex gap-2 items-baseline mt-1">
                                        <span className="text-base font-semibold font-mono text-emerald-400/90 leading-none">
                                            {formatChance(
                                                item.obtaining.trading!
                                                    .wanderingTrader!.chance
                                            )}
                                        </span>
                                        <div className="shrink-0 h-3 w-px bg-white/20" />
                                        <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                                            {formatQuantity(
                                                item.obtaining.trading!
                                                    .wanderingTrader!.quantity
                                            )}
                                            x
                                        </span>
                                    </div>
                                    {item.obtaining.trading!.wanderingTrader!
                                        .comment && (
                                        <p className="text-[10px] text-muted-foreground/70 max-w-44 italic leading-tight line-clamp-2 mt-0.5">
                                            {
                                                item.obtaining.trading!
                                                    .wanderingTrader!.comment
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </GlassPanel>
            )}

            {/* ROW 5-6: GENERATED LOOT */}
            <GlassPanel
                className={cn(
                    item.obtaining.generatedLoot &&
                        item.obtaining.generatedLoot.structures.length > 0
                        ? cn(
                              'md:col-span-9',
                              totalLootRows <= 2 ? 'row-span-1' : 'row-span-2'
                          )
                        : 'md:col-span-3 row-span-1'
                )}
                title="Generated Loot"
                contentClassName="pb-5 overflow-hidden"
            >
                {item.obtaining.generatedLoot &&
                item.obtaining.generatedLoot.structures.length > 0 ? (
                    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-thin px-2">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-background backdrop-blur-md z-10">
                                    <tr className="border-b border-muted-foreground/20">
                                        <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                            Structure
                                        </th>
                                        <th className="text-left py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                            Chest
                                        </th>
                                        <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                            Chance
                                        </th>
                                        <th className="text-right py-2 px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                            Quantity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Sort structures by their highest chest chance, then sort chests within each structure */}
                                    {[
                                        ...item.obtaining.generatedLoot
                                            .structures,
                                    ]
                                        .sort((a, b) => {
                                            const maxChanceA = Math.max(
                                                ...a.chests.map((c) => c.chance)
                                            )
                                            const maxChanceB = Math.max(
                                                ...b.chests.map((c) => c.chance)
                                            )
                                            return maxChanceB - maxChanceA
                                        })
                                        .map((structureData) => {
                                            // Sort chests within structure by chance (descending)
                                            const sortedChests = [
                                                ...structureData.chests,
                                            ].sort(
                                                (a, b) => b.chance - a.chance
                                            )
                                            const cleanStructureName =
                                                structureData.structure
                                                    .replace(/_/g, ' ')
                                                    .split(' ')
                                                    .map(
                                                        (word) =>
                                                            word
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            word.slice(1)
                                                    )
                                                    .join(' ')

                                            return sortedChests.map(
                                                (chest, chestIdx) => {
                                                    const structurePrefix =
                                                        structureData.structure +
                                                        '_'
                                                    let rawChestName =
                                                        chest.chestName
                                                    if (
                                                        rawChestName.startsWith(
                                                            structurePrefix
                                                        )
                                                    ) {
                                                        rawChestName =
                                                            rawChestName.substring(
                                                                structurePrefix.length
                                                            )
                                                    }
                                                    const cleanChestName =
                                                        rawChestName
                                                            .replace(/_/g, ' ')
                                                            .split(' ')
                                                            .map(
                                                                (word) =>
                                                                    word
                                                                        .charAt(
                                                                            0
                                                                        )
                                                                        .toUpperCase() +
                                                                    word.slice(
                                                                        1
                                                                    )
                                                            )
                                                            .join(' ')

                                                    return (
                                                        <tr
                                                            key={`${structureData.structure}-${chestIdx}`}
                                                            className="border-b border-muted-foreground/10 transition-colors"
                                                        >
                                                            {chestIdx === 0 && (
                                                                <td
                                                                    rowSpan={
                                                                        sortedChests.length
                                                                    }
                                                                    className="py-2 px-3 align-middle"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 flex items-center justify-center">
                                                                            <img
                                                                                src={`/structures/${structureData.structure}.png`}
                                                                                alt={
                                                                                    structureData.structure
                                                                                }
                                                                                className="w-full h-full object-contain image-pixelated"
                                                                                onError={(
                                                                                    e
                                                                                ) => {
                                                                                    e.currentTarget.src =
                                                                                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                                                                }}
                                                                            />
                                                                        </div>
                                                                        <span className="font-mono text-xs">
                                                                            {
                                                                                cleanStructureName
                                                                            }
                                                                        </span>
                                                                        {structureData.comment && (
                                                                            <HoverCard
                                                                                openDelay={
                                                                                    100
                                                                                }
                                                                                closeDelay={
                                                                                    100
                                                                                }
                                                                            >
                                                                                <HoverCardTrigger
                                                                                    asChild
                                                                                >
                                                                                    <ExclamationMarkIcon
                                                                                        className="w-4 h-4 dark:text-amber-400/60 dark:hover:text-amber-400 text-amber-600/60 hover:text-amber-600 cursor-help transition-colors shrink-0"
                                                                                        weight="bold"
                                                                                    />
                                                                                </HoverCardTrigger>
                                                                                <HoverCardContent
                                                                                    side="top"
                                                                                    className="w-80 p-3 bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 shadow-xl"
                                                                                >
                                                                                    <div className="flex gap-2.5 items-start">
                                                                                        <div className="shrink-0 mt-0.5">
                                                                                            <ExclamationMarkIcon
                                                                                                className="w-4 h-4 dark:text-amber-400 text-amber-600"
                                                                                                weight="bold"
                                                                                            />
                                                                                        </div>
                                                                                        <p className="text-xs leading-relaxed text-foreground/80">
                                                                                            {
                                                                                                structureData.comment
                                                                                            }
                                                                                        </p>
                                                                                    </div>
                                                                                </HoverCardContent>
                                                                            </HoverCard>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            )}
                                                            <td className="py-2 px-3 font-mono text-xs">
                                                                {cleanChestName}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-xs text-emerald-400/80">
                                                                {formatChance(
                                                                    chest.chance
                                                                )}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono text-xs">
                                                                {formatQuantity(
                                                                    chest.quantity
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )
                                                }
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex flex-1 items-center justify-center">
                            <img
                                className="w-12 h-12 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                                src="/renders/blocks/chest.png"
                                alt="No Generated Loot"
                            />
                        </div>
                        <div className="text-muted-foreground/60 text-center text-xs">
                            This item is not in any loot tables
                        </div>
                    </div>
                )}
            </GlassPanel>

            {/* Block Loot Panel */}
            {totalBlocks > 0 && (
                <GlassPanel
                    className={cn(
                        totalBlocks > 1
                            ? 'md:col-span-4 row-span-1'
                            : totalBlocks === 1
                              ? 'md:col-span-3 row-span-1'
                              : 'md:col-span-2 row-span-1'
                    )}
                    title="Block Loot"
                    contentClassName="overflow-hidden"
                >
                    {totalBlocks > 0 ? (
                        <div
                            ref={blockLootScrollRef}
                            className={cn(
                                'flex h-full pb-2 scrollbar-hidden cursor-grab select-none active:cursor-grabbing',
                                totalBlocks > 1
                                    ? 'flex-row items-center overflow-x-auto'
                                    : 'flex-col items-center justify-center'
                            )}
                            {...blockLootDragProps}
                        >
                            {(() => {
                                const flattenedBlocks = blockLoots.flatMap(
                                    (loot) =>
                                        loot.blocks.map((block) => ({
                                            block,
                                            loot,
                                        }))
                                )
                                return flattenedBlocks.map(
                                    ({ block, loot }, idx) => (
                                        <React.Fragment key={`${block}-${idx}`}>
                                            <div className="flex flex-none flex-col items-center justify-center gap-1 px-4">
                                                <div className="flex flex-col items-center justify-center gap-1.5">
                                                    <img
                                                        src={`/renders/blocks/${block}.png`}
                                                        alt={block}
                                                        draggable={false}
                                                        className="h-12 w-12 drop-shadow-sm object-contain image-pixelated"
                                                        onError={(e) => {
                                                            const target =
                                                                e.currentTarget
                                                            if (
                                                                target.src.includes(
                                                                    '/blocks/'
                                                                )
                                                            ) {
                                                                target.src = `/renders/items/${block}.png`
                                                            } else {
                                                                target.src =
                                                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-[11px] font-bold font-mono text-center tracking-tight text-foreground/80 uppercase px-2 leading-tight">
                                                        {block.replace(
                                                            /_/g,
                                                            ' '
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 items-baseline">
                                                    <span className="text-base font-semibold font-mono text-emerald-400/90 leading-none">
                                                        {formatChance(
                                                            loot.chance
                                                        )}
                                                    </span>
                                                    <div className="shrink-0 h-3 w-px bg-white/20" />
                                                    <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                                                        {formatQuantity(
                                                            loot.quantity
                                                        )}
                                                        x
                                                    </span>
                                                </div>
                                            </div>
                                            {totalBlocks > 1 &&
                                                idx <
                                                    flattenedBlocks.length -
                                                        1 && (
                                                    <div className="h-[50%] w-px bg-white/10 shrink-0" />
                                                )}
                                        </React.Fragment>
                                    )
                                )
                            })()}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <img
                                className="w-12 h-12 flex-1 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                                src="/renders/blocks/grass_block.png"
                                alt="No Block Loot"
                            />
                            <div className="text-muted-foreground/60 text-xs px-3 text-center mb-5">
                                No special block drops this item
                            </div>
                        </div>
                    )}
                </GlassPanel>
            )}

            {/* Dimension Panel 1x3 */}
            <GlassPanel
                className="md:col-span-3"
                title="Generates In"
                contentClassName="flex justify-center items-center"
            >
                <div className="flex flex-col flex-1 justify-center items-center gap-1 mb-5">
                    {item.obtaining.naturalGeneration?.dimensions.map((dim) => (
                        <DimensionItem key={dim} dimension={dim} />
                    ))}
                    {item.obtaining.naturalGeneration?.dimensions.length ===
                        0 ||
                        (item.obtaining.naturalGeneration === undefined && (
                            <div className="flex-1 flex flex-col items-center justify-center h-full">
                                <img
                                    className="w-12 h-12 flex-1 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm"
                                    src="/renders/blocks/end_portal_frame.png"
                                />
                                <div className="text-muted-foreground/60 text-xs text-center">
                                    Does not naturally generate in any
                                    dimensions
                                </div>
                            </div>
                        ))}
                </div>
            </GlassPanel>

            {/* Biomes Panel */}
            <FlippableGlassPanel
                className={cn(
                    hasBiomes
                        ? biomes.length <= 4
                            ? `md:col-span-${Math.max(3, Math.min(6, biomes.length * 2))} row-span-1`
                            : 'md:col-span-6 row-span-2'
                        : 'md:col-span-3 row-span-1'
                )}
                title="Biome Generation"
                comment={item.obtaining.naturalGeneration?.comment}
                contentClassName="pb-5 overflow-hidden px-4"
            >
                {hasBiomes ? (
                    <div
                        ref={biomesScrollRef}
                        className={cn(
                            'grid gap-1 h-full overflow-y-auto scrollbar-thin pr-1 cursor-grab active:cursor-grabbing select-none content-start pt-2',
                            biomes.length >= 0 && biomes.length < 2
                                ? 'grid-cols-1'
                                : biomes.length === 2
                                  ? 'grid-cols-2'
                                  : biomes.length === 3
                                    ? 'grid-cols-3'
                                    : 'grid-cols-4'
                        )}
                        {...biomesDragProps}
                    >
                        {biomes.map((biome) => (
                            <BiomeIcon key={biome} biome={biome} />
                        ))}
                        {item.obtaining.naturalGeneration !== undefined &&
                            biomes.length === 0 &&
                            item.obtaining.naturalGeneration.comment !==
                                undefined &&
                            item.obtaining.naturalGeneration.comment.length ===
                                0 && (
                                <div className="flex flex-col items-center gap-2 py-2 px-1 w-full shrink-0">
                                    <div className="w-13 h-13 flex items-center justify-center rounded-xl overflow-hidden border border-white/10 shrink-0 shadow-md bg-black/20">
                                        <img
                                            src={`/dimensions/overworld.png`}
                                            className="w-full h-full object-cover image-pixelated"
                                            draggable={false}
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] text-center text-foreground font-mono leading-tight capitalize tracking-tight">
                                        Multiple biomes, see comment
                                    </span>
                                </div>
                            )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex-1 flex items-center justify-center">
                            <img
                                className="w-12 h-12 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm rounded-lg"
                                src="/biomes/ice_spikes.png"
                                alt="No Biomes"
                            />
                        </div>
                        <div className="text-muted-foreground/60 text-xs text-center">
                            Does not generate in specific biomes
                        </div>
                    </div>
                )}
            </FlippableGlassPanel>

            {/* Structures Panel */}
            <FlippableGlassPanel
                className={cn(
                    hasStructures
                        ? structures.length <= 4
                            ? `md:col-span-${Math.max(3, Math.min(6, structures.length * 2))} row-span-1`
                            : 'md:col-span-6 row-span-2'
                        : 'md:col-span-3 row-span-1'
                )}
                title="Part of Structures"
                comment={
                    item.obtaining.naturalGeneration?.partOfStructures?.comment
                }
                contentClassName="pb-5 overflow-hidden px-4"
            >
                {hasStructures ? (
                    <div
                        ref={structuresScrollRef}
                        className={cn(
                            'grid gap-1 h-full overflow-y-auto scrollbar-thin pr-1 cursor-grab active:cursor-grabbing select-none content-start pt-4',
                            structures.length === 1
                                ? 'grid-cols-1'
                                : structures.length === 2
                                  ? 'grid-cols-2'
                                  : structures.length === 3
                                    ? 'grid-cols-3'
                                    : 'grid-cols-4'
                        )}
                        {...structuresDragProps}
                    >
                        {structures.map((structure) => (
                            <StructureIcon
                                key={structure}
                                structure={structure}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="flex flex-1 justify-center items-center">
                            <img
                                className="w-12 h-12 text-muted-foreground/50 grayscale opacity-50 object-contain image-pixelated drop-shadow-sm rounded-lg"
                                src="/structures/village_plains.png"
                                alt="No Structures"
                            />
                        </div>
                        <div className="text-muted-foreground/60 text-xs text-center">
                            Does not generate within any structure
                        </div>
                    </div>
                )}
            </FlippableGlassPanel>
        </div>
    )
}
