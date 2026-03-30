import { cn } from '@/lib/utils'
import React from 'react'

export const YesNoCell = React.memo(
    ({
        value,
        trueColor = 'dark:text-green-400 text-green-800',
    }: {
        value: boolean
        trueColor?: string
    }) => (
        <div className="text-center">
            {value ? (
                <span className={cn('font-medium', trueColor)}>Yes</span>
            ) : (
                <span className="text-muted-foreground">No</span>
            )}
        </div>
    )
)
