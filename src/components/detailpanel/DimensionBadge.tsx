import { cn, getAssetPath } from '@/lib/utils'
import type React from 'react'

export function DimensionBadge({ dimension }: { dimension: string }) {
    const getDimensionColor = (dim: string) => {
        if (dim.includes('nether')) return 'text-red-300 border-red-500/30'
        if (dim.includes('end')) return 'text-purple-300 border-purple-500/30'
        return 'text-emerald-300 border-emerald-500/30'
    }

    return (
        <div className="flex justify-center items-center border rounded-lg pr-2.5 gap-3 h-8 pl-1">
            <img
                src={getAssetPath(`/dimensions/${dimension}.png`)}
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
