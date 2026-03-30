import { cn } from '@/lib/utils'
import type React from 'react'

export function FoodBar({
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
