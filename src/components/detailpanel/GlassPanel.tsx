import { cn } from '@/lib/utils'
import type React from 'react'
import { Button } from './ui/button'
import { useState } from 'react'
import { ArrowsClockwiseIcon, ExclamationMarkIcon } from '@phosphor-icons/react'

export function GlassPanel({
    children,
    className,
    contentClassName,
    title,
    style,
    ...rest
}: {
    children: React.ReactNode
    className?: string
    contentClassName?: string
    title?: string
    style?: React.CSSProperties
} & React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'relative bg-white/4 dark:bg-white/2 backdrop-blur z-5 rounded-2xl flex flex-col border dark:border-white/10 border-white/40 overflow-hidden',
                className
            )}
            style={style}
            {...rest}
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

export function FlippableGlassPanel({
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
