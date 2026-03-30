import type React from 'react'

export function BiomeIcon({ biome }: { biome: string }) {
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
