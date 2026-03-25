import React from 'react'
import type { ItemData } from '@/context/DataContext'

interface ItemDetailPanelProps {
    item: ItemData
    itemId: string
}

export function ItemDetailPanel({ item, itemId }: ItemDetailPanelProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl bg-background/20">
                <p className="text-lg font-medium">
                    Detailed item statistics and properties
                </p>
                <p className="text-sm">
                    Coming soon in the next layout iteration.
                </p>
            </div>
        </div>
    )
}
