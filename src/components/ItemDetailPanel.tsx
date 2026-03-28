import React, { useState, useRef, useMemo } from 'react'
import type { ItemData } from '@/context/DataContext'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card'
import { InfoIcon, SmileySadIcon, ArrowsClockwise } from '@phosphor-icons/react'
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
                'relative bg-white/4 dark:bg-black/30 backdrop-blur z-5 rounded-2xl flex flex-col border overflow-hidden',
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
                {!isFlipped && (
                    <div
                        className="absolute w-full h-full backface-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <GlassPanel
                            className="h-full hover:scale-[1.01] transition-transform"
                            contentClassName={contentClassName}
                            title={title}
                        >
                            {children}
                            <div className="absolute top-2 right-2">
                                <ArrowsClockwise
                                    className="w-4 h-4 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
                                    weight="bold"
                                />
                            </div>
                        </GlassPanel>
                    </div>
                )}

                {/* Back */}
                {isFlipped && (
                    <div
                        className="absolute w-full h-full backface-hidden"
                        style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                        }}
                    >
                        <GlassPanel className="h-full" title={title}>
                            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
                                <InfoIcon className="w-8 h-8 text-muted-foreground/60" />
                                <p className="text-sm text-muted-foreground/80 text-center leading-relaxed">
                                    {comment}
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-xs"
                                >
                                    <ArrowsClockwise className="w-3 h-3 mr-1" />
                                    Flip Back
                                </Button>
                            </div>
                        </GlassPanel>
                    </div>
                )}
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
        <div className="flex flex-col items-center gap-1 p-1.5" title={biome}>
            <div className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden border border-white/10 shrink-0">
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
            <span className="text-[9px] text-center text-muted-foreground/80 max-w-15 leading-tight truncate">
                {biome.replace(/_/g, ' ')}
            </span>
        </div>
    )
}

function StructureIcon({ structure }: { structure: string }) {
    return (
        <div
            className="flex flex-col items-center gap-1 p-1.5"
            title={structure}
        >
            <div className="w-12 h-12 flex items-center justify-center rounded-lg overflow-hidden border border-white/10 shrink-0">
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
            <span className="text-[9px] text-center text-muted-foreground/80 max-w-15 leading-tight truncate">
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

function DimensionBadge({ dimension }: { dimension: string }) {
    const getDimensionColor = (dim: string) => {
        if (dim.includes('nether'))
            return 'bg-red-500/20 text-red-300 border-red-500/30'
        if (dim.includes('end'))
            return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'text-[10px] px-2.5 py-0.5 uppercase tracking-[0.15em] font-bold',
                getDimensionColor(dimension)
            )}
        >
            {dimension.replace(/_/g, ' ')}
        </Badge>
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

    // Scroll Refs
    const mobLootScrollRef = useRef<HTMLDivElement>(null)
    const biomesScrollRef = useRef<HTMLDivElement>(null)
    const structuresScrollRef = useRef<HTMLDivElement>(null)

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
        () => setupDragScroll(biomesScrollRef, 'horizontal'),
        []
    )
    const structuresDragProps = useMemo(
        () => setupDragScroll(structuresScrollRef, 'horizontal'),
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
        <div className="w-full grid grid-cols-12 auto-rows-[160px] gap-2 md:gap-3 animate-in fade-in duration-700 pb-12 max-w-350 mx-auto">
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
                className="md:col-span-2"
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
                className="md:col-span-2"
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
            <GlassPanel className="md:col-span-3" title="Edible">
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
                className="md:col-span-2 flex flex-col items-center justify-center"
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
            {hasBreaking && (
                <GlassPanel className="md:col-span-4" title="Breaking">
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex h-1/2">
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
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-center text-muted-foreground font-semibold">
                                    {item.obtaining.obtainability === 'survival'
                                        ? 'Drops by Hand'
                                        : 'Does not drop'}
                                </span>
                            </div>
                        )}
                    </div>
                </GlassPanel>
            )}

            {/* Mob Loot Panel */}
            <GlassPanel
                className="md:col-span-9 row-span-1"
                title="Mob Loot"
                contentClassName="overflow-hidden"
            >
                {item.obtaining.mobLoot && item.obtaining.mobLoot.length > 0 ? (
                    <div
                        ref={mobLootScrollRef}
                        className="flex flex-row h-full overflow-x-auto scrollbar-hidden items-center cursor-grab select-none active:cursor-grabbing"
                        {...mobLootDragProps}
                    >
                        {item.obtaining.mobLoot.map((loot, idx) => (
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
                                {idx <
                                    (item.obtaining.mobLoot?.length ?? 0) -
                                        1 && (
                                    <div className="h-[50%] w-px bg-white/10 shrink-0" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <SmileySadIcon
                            weight="thin"
                            className="w-12 h-12 mb-2 text-muted-foreground/50"
                        />
                        <div className="text-muted-foreground/60 text-sm mt-1.5 font-bold">
                            No Mob Loot
                        </div>
                    </div>
                )}
            </GlassPanel>

            {/* Block Loot Panel */}
            <GlassPanel
                className="md:col-span-2"
                title="Block Loot"
                contentClassName="flex flex-col items-center justify-center"
            >
                {(() => {
                    const blockLoot = item.obtaining.blockLoot?.[0]
                    const firstBlock = blockLoot?.blocks?.[0]

                    if (!blockLoot || !firstBlock) {
                        return (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <SmileySadIcon
                                    weight="thin"
                                    className="w-12 h-12 mb-2 text-muted-foreground/50"
                                />
                                <div className="text-muted-foreground/60 text-sm mt-1.5 font-bold">
                                    No Block Loot
                                </div>
                            </div>
                        )
                    }

                    return (
                        <>
                            <div className="flex-1 flex flex-col items-center justify-center gap-1.5 pt-2">
                                <img
                                    src={`/renders/blocks/${firstBlock}.png`}
                                    alt={firstBlock}
                                    className="h-12 w-12 drop-shadow-sm object-contain image-pixelated"
                                    onError={(e) => {
                                        const target = e.currentTarget
                                        if (target.src.includes('/blocks/')) {
                                            target.src = `/renders/items/${firstBlock}.png`
                                        } else {
                                            target.src =
                                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                        }
                                    }}
                                />
                                <span className="text-[11px] font-bold font-mono text-center tracking-tight text-foreground/80 uppercase px-2 leading-tight">
                                    {firstBlock.replace(/_/g, ' ')}
                                </span>
                            </div>
                            <div className="flex gap-2 items-baseline mb-4">
                                <span className="text-base font-semibold font-mono text-emerald-400/90 leading-none">
                                    {formatChance(blockLoot.chance)}
                                </span>
                                <div className="shrink-0 h-3 w-px bg-white/20" />
                                <span className="text-sm font-mono text-muted-foreground tracking-tighter">
                                    {formatQuantity(blockLoot.quantity)}x
                                </span>
                            </div>
                        </>
                    )
                })()}
            </GlassPanel>

            {/* ROW 5-6: GENERATED LOOT */}
            <FlippableGlassPanel
                className="md:col-span-9 row-span-2"
                title="Generated Loot"
                comment={
                    item.obtaining.generatedLoot?.structures.find(
                        (s) => s.comment
                    )?.comment
                }
                contentClassName="p-4 overflow-hidden"
            >
                {item.obtaining.generatedLoot &&
                item.obtaining.generatedLoot.structures.length > 0 ? (
                    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-thin pr-2">
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
                                            return sortedChests.map(
                                                (chest, chestIdx) => (
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
                                                                        {structureData.structure.replace(
                                                                            /_/g,
                                                                            ' '
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="py-2 px-3 font-mono text-xs">
                                                            {chest.chestName.replace(
                                                                /_/g,
                                                                ' '
                                                            )}
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
                                            )
                                        })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <InfoIcon
                            weight="thin"
                            className="w-12 h-12 mb-2 text-muted-foreground/50"
                        />
                        <div className="text-muted-foreground/60 text-sm mt-1.5 font-bold">
                            This item is not in any loot tables
                        </div>
                    </div>
                )}
            </FlippableGlassPanel>

            {/* ROW 4: NATURAL GENERATION */}
            <FlippableGlassPanel
                className="md:col-span-12 row-span-2"
                title="Natural Generation"
                comment={item.obtaining.naturalGeneration?.comment}
                contentClassName="p-4 overflow-hidden"
            >
                {item.obtaining.naturalGeneration ? (
                    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin pr-2">
                        {/* Dimensions */}
                        <div className="flex flex-col gap-2">
                            <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                Dimensions
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {item.obtaining.naturalGeneration.dimensions.map(
                                    (dim) => (
                                        <DimensionBadge
                                            key={dim}
                                            dimension={dim}
                                        />
                                    )
                                )}
                            </div>
                        </div>

                        {/* Biomes */}
                        {item.obtaining.naturalGeneration.biomes &&
                            item.obtaining.naturalGeneration.biomes.length >
                                0 && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                        Biomes
                                    </span>
                                    <div
                                        ref={biomesScrollRef}
                                        className="flex flex-row overflow-x-auto scrollbar-hidden gap-2 cursor-grab active:cursor-grabbing select-none"
                                        {...biomesDragProps}
                                    >
                                        {item.obtaining.naturalGeneration.biomes.map(
                                            (biome) => (
                                                <BiomeIcon
                                                    key={biome}
                                                    biome={biome}
                                                />
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Structures */}
                        {item.obtaining.naturalGeneration.partOfStructures && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                                        Part of Structures
                                    </span>
                                    {item.obtaining.naturalGeneration
                                        .partOfStructures.comment && (
                                        <span className="text-xs text-muted-foreground/60 italic">
                                            {
                                                item.obtaining.naturalGeneration
                                                    .partOfStructures.comment
                                            }
                                        </span>
                                    )}
                                </div>
                                <div
                                    ref={structuresScrollRef}
                                    className="flex flex-row overflow-x-auto scrollbar-hidden gap-2 cursor-grab active:cursor-grabbing select-none"
                                    {...structuresDragProps}
                                >
                                    {item.obtaining.naturalGeneration.partOfStructures.structures.map(
                                        (structure) => (
                                            <StructureIcon
                                                key={structure}
                                                structure={structure}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <InfoIcon
                            weight="thin"
                            className="w-12 h-12 mb-2 text-muted-foreground/50"
                        />
                        <div className="text-muted-foreground/60 text-sm mt-1.5 font-bold">
                            This item does not naturally generate in the world
                        </div>
                    </div>
                )}
            </FlippableGlassPanel>
        </div>
    )
}
