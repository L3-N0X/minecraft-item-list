import React from 'react'
import type { ItemData } from '@/context/DataContext'
import { cn } from '@/lib/utils'

interface ItemDetailPanelProps {
    item: ItemData
    itemId: string
}

function StatItem({
    label,
    value,
    className,
}: {
    label: string
    value: string | number
    className?: string
}) {
    return (
        <div className="flex flex-col items-center justify-center p-2 backdrop-blur-md first:rounded-tl-2xl nth-[2]:rounded-tr-2xl nth-[3]:rounded-bl-2xl last:rounded-br-2xl">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                {label}
            </span>
            <span className={cn('text-sm font-bold tracking-tight', className)}>
                {value}
            </span>
        </div>
    )
}

function GlassPanel({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                'bg-white/5 dark:bg-black/10 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden',
                className
            )}
        >
            {children}
        </div>
    )
}

export function ItemDetailPanel({ item, itemId }: ItemDetailPanelProps) {
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
        return r
    }

    return (
        <div className="w-full space-y-4 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* Image Panel */}
                <GlassPanel className="md:col-span-1 flex items-center justify-center p-4">
                    <img
                        src={`/renders/${item.isBlock ? 'blocks' : 'items'}/${itemId}.png`}
                        alt={item.displayName}
                        className="h-full w-full object-contain image-pixelated drop-shadow-lg"
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

                <GlassPanel className="md:col-span-5 p-6 flex flex-col justify-center">
                    <h2 className="text-4xl font-black tracking-tight text-foreground">
                        {item.displayName}
                    </h2>
                    {item.displayNameGerman && (
                        <div className="flex gap-2 items-center mt-2">
                            <span className="text-xl text-muted-foreground/80 font-bold mr-0.5">
                                DE
                            </span>
                            <span className="text-xl text-muted-foreground/80 font-medium">
                                {item.displayNameGerman}
                            </span>
                        </div>
                    )}
                    <p className="text-md font-mono text-muted-foreground mt-1.5">
                        {itemId}
                    </p>
                </GlassPanel>

                {/* Stats 2x2 Panel */}
                <GlassPanel className="md:col-span-1 grid grid-cols-2 grid-rows-2 p-2">
                    <StatItem
                        label="Renewable"
                        value={formatRenewable(item.renewable)}
                    />
                    <StatItem
                        label="Type"
                        value={item.isBlock ? 'Block' : 'Item'}
                    />
                    <StatItem
                        label="Stack"
                        value={item.stackSize === -1 ? '∞' : item.stackSize}
                    />
                    <StatItem
                        label="Rarity"
                        value={
                            item.rarityTier.charAt(0).toUpperCase() +
                            item.rarityTier.slice(1)
                        }
                        className={
                            getRarityColor(item.rarityTier) +
                            ' font-medium font-mono text-[10px] leading-5'
                        }
                    />
                </GlassPanel>
            </div>
        </div>
    )
}
