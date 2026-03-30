import { cn } from '@/lib/utils'
import type React from 'react'

export function StatItem({
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
