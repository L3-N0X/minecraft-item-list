import { getAssetPath } from '@/lib/utils'
import type React from 'react'

export function ItemIcon({ item }: { item: string }) {
    return (
        <div
            className="w-7 h-7 flex items-center justify-center rounded-2xl"
            title={item}
        >
            <img
                src={getAssetPath(`/items/${item}.png`)}
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
