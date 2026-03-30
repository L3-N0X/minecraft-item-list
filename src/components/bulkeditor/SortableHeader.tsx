import type { Column } from '@tanstack/react-table'
import { Button } from '../ui/button'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { DataTableFacetedFilter } from './FacetedSorting'

export type FilterOption = {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

export const SortableHeader = <TData,>({
    column,
    title,
    isFilterable,
    options,
}: {
    column: Column<TData, unknown>
    title: string
    isFilterable?: boolean
    options?: FilterOption[]
}) => {
    const isSorted = column.getIsSorted()
    return (
        <div className="flex flex-col gap-0.5 items-start">
            <Button
                variant="ghost"
                onClick={() => {
                    const current = column.getIsSorted()
                    if (current === 'asc') {
                        column.toggleSorting(true) // Set to desc
                    } else if (current === 'desc') {
                        column.clearSorting() // Clear sorting
                    } else {
                        column.toggleSorting(false) // Set to asc
                    }
                }}
                className="-ml-2 h-8 px-2 font-bold hover:bg-transparent"
            >
                {title}
                {isSorted === 'asc' ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                ) : isSorted === 'desc' ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                ) : (
                    <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
                )}
            </Button>
            {isFilterable && options && (
                <DataTableFacetedFilter
                    column={column}
                    title={title}
                    options={options}
                />
            )}
        </div>
    )
}
