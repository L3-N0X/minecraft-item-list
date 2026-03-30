import { getAssetPath } from '@/lib/utils'
import type React from 'react'

export function MobIcon({ mob }: { mob: string }) {
    return (
        <div
            className="w-26 h-26 flex items-center justify-center rounded-xl overflow-hidden shrink-0"
            title={mob}
        >
            <img
                src={getAssetPath(`/entities/${mob}.png`)}
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
