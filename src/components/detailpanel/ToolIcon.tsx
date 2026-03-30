import type React from 'react'

export function ToolIcon({ tool }: { tool: string }) {
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
