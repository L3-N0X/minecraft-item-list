import type React from 'react'

export function ListItem({
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
