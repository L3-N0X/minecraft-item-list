import React, { useMemo, useState, useRef } from 'react'
import {
    type ColumnDef,
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
    type Column,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useData } from '../context/DataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
    Settings2,
    Tags,
    ArrowUpDown,
    Filter,
    Check,
    X,
    Pencil,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'

interface DataTableFacetedFilterProps<TData, TValue> {
    column?: Column<TData, TValue>
    title?: string
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
}

const DataTableFacetedFilter = function DataTableFacetedFilter<TData, TValue>({
    column,
    title,
    options,
}: DataTableFacetedFilterProps<TData, TValue>) {
    const selectedValues = new Set(column?.getFilterValue() as string[])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 border-dashed flex items-center -ml-2"
                >
                    <Filter className="h-3.5 w-3.5" />
                    {selectedValues?.size > 0 && (
                        <>
                            <Separator
                                orientation="vertical"
                                className="mx-2 h-4"
                            />
                            <Badge
                                variant="secondary"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="secondary"
                                        className="rounded-sm px-1 font-normal"
                                    >
                                        {selectedValues.size} selected
                                    </Badge>
                                ) : (
                                    options
                                        .filter((option) =>
                                            selectedValues.has(option.value)
                                        )
                                        .map((option) => (
                                            <Badge
                                                variant="secondary"
                                                key={option.value}
                                                className="rounded-sm px-1 font-normal"
                                            >
                                                {option.label}
                                            </Badge>
                                        ))
                                )}
                            </div>
                        </>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-50 p-0" align="start">
                <Command>
                    <CommandInput placeholder={title} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.has(
                                    option.value
                                )
                                return (
                                    <CommandItem
                                        key={option.value}
                                        onSelect={() => {
                                            const currentValues = new Set(
                                                column?.getFilterValue() as string[]
                                            )
                                            if (isSelected) {
                                                currentValues.delete(
                                                    option.value
                                                )
                                            } else {
                                                currentValues.add(option.value)
                                            }
                                            const filterValues =
                                                Array.from(currentValues)
                                            column?.setFilterValue(
                                                filterValues.length
                                                    ? filterValues
                                                    : undefined
                                            )
                                        }}
                                    >
                                        <div
                                            className={cn(
                                                'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'opacity-50 [&_svg]:invisible'
                                            )}
                                        >
                                            <Check className={cn('h-4 w-4')} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                        {selectedValues.size > 0 && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() =>
                                            column?.setFilterValue(undefined)
                                        }
                                        className="justify-center text-center"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

const SortableHeader = ({
    column,
    title,
    isFilterable,
    options,
}: {
    column: any
    title: string
    isFilterable?: boolean
    options?: any[]
}) => {
    return (
        <div className="flex flex-col gap-0.5 items-start">
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="-ml-2 h-8 px-2 font-bold hover:bg-transparent"
            >
                {title}
                <ArrowUpDown className="ml-2 h-4 w-4" />
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

const YesNoCell = React.memo(
    ({
        value,
        trueColor = 'text-green-500',
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

const binaryFilterFn = (row: any, id: string, filterValues: string[]) => {
    const val = !!row.getValue(id)
    const valStr = val.toString()
    return filterValues.includes(valStr)
}

export function BulkEditorView() {
    const { items, itemIds, categories, getItemCategories, updateItem } =
        useData()
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        json: false,
        isBlock: false,
    })
    const [rowSelection, setRowSelection] = useState({})
    const [editingItemId, setEditingItemId] = useState<string | null>(null)

    // Bulk Action State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [targetCategory, setTargetCategory] = useState<string>('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [bulkActionType, setBulkActionType] = useState<'existing' | 'new'>(
        'existing'
    )

    const data = useMemo(() => {
        return itemIds.map((id) => {
            const item = items[id]
            return {
                id,
                displayName: item.displayName,
                displayNameGerman: item.displayNameGerman,
                categories: getItemCategories(id),
                difficulty: item.obtaining?.difficultyToObtain ?? -1,
                hasNaturalGen: !!item.obtaining?.naturalGeneration,
                hasLoot: !!item.obtaining?.generatedLoot,
                requiresSilkTouch: item.breaking?.requiresSilkTouch === 'yes',
                craftable: !!item.obtaining?.craftable,
                hasMobLoot: !!item.obtaining?.mobLoot?.length,
                hasBlockLoot: !!item.obtaining?.blockLoot?.length,
                hasTrading: !!item.obtaining?.trading,
                hasSmelting: !!item.obtaining?.smelting,
                renewable: item.renewable,
                isBlock: item.isBlock,
                stackSize: item.stackSize,
                rarityTier: item.rarityTier,
                rawItem: item,
            }
        })
    }, [items, itemIds, getItemCategories])

    const filterOptions = useMemo(() => {
        const categoryOptions = Object.keys(categories)
            .sort()
            .map((cat) => ({ label: cat, value: cat }))

        const difficulties = Array.from(
            new Set(data.map((d) => d.difficulty))
        ).sort((a, b) => a - b)
        const difficultyOptions = difficulties.map((v) => ({
            label: v === -1 ? 'N/A' : v.toString(),
            value: v.toString(),
        }))

        const yesNoOptions = [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
        ]

        const renewableOptions = [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
            { label: 'Vault Only', value: 'vault_only' },
        ]

        const stackSizeOptions = [
            { label: '1', value: '1' },
            { label: '16', value: '16' },
            { label: '64', value: '64' },
        ]

        const rarityOptions = [
            { label: 'Common', value: 'common' },
            { label: 'Uncommon', value: 'uncommon' },
            { label: 'Rare', value: 'rare' },
            { label: 'Epic', value: 'epic' },
        ]

        return {
            categories: categoryOptions,
            difficulty: difficultyOptions,
            yesNo: yesNoOptions,
            renewable: renewableOptions,
            stackSize: stackSizeOptions,
            rarity: rarityOptions,
        }
    }, [categories, data])

    const columns = useMemo<ColumnDef<(typeof data)[0]>[]>(
        () => [
            {
                id: 'select',
                size: 40,
                header: ({ table }) => (
                    <Checkbox
                        checked={
                            table.getIsAllRowsSelected() ||
                            (table.getIsSomeRowsSelected() && 'indeterminate')
                        }
                        onCheckedChange={(value) =>
                            table.toggleAllRowsSelected(!!value)
                        }
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                id: 'edit',
                size: 50,
                header: () => null,
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingItemId(row.original.id)}
                        title="Edit item"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorKey: 'id',
                size: 150,
                header: ({ column }) => (
                    <SortableHeader column={column} title="ID" />
                ),
                cell: ({ row }) => (
                    <div className="font-mono text-xs overflow-hidden text-ellipsis">
                        {row.getValue('id')}
                    </div>
                ),
            },
            {
                accessorKey: 'displayName',
                size: 200,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Name" />
                ),
                cell: ({ row }) => (
                    <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {row.getValue('displayName')}
                    </div>
                ),
            },
            {
                accessorKey: 'displayNameGerman',
                size: 200,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Name (DE)" />
                ),
                cell: ({ row }) => (
                    <div className="text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                        {row.getValue('displayNameGerman')}
                    </div>
                ),
            },
            {
                accessorKey: 'categories',
                size: 350,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Categories"
                        isFilterable
                        options={filterOptions.categories}
                    />
                ),
                cell: ({ row }) => {
                    const cats = row.getValue('categories') as string[]
                    return (
                        <div className="flex flex-wrap gap-1 max-w-full overflow-hidden py-1">
                            {cats.map((cat) => (
                                <Badge
                                    key={cat}
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )
                },
                filterFn: (row, id, value) => {
                    if (!value || value.length === 0) return true
                    const rowCats = row.getValue(id) as string[]
                    return value.some((v: string) => rowCats.includes(v))
                },
            },
            {
                accessorKey: 'difficulty',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Diff"
                        isFilterable
                        options={filterOptions.difficulty}
                    />
                ),
                cell: ({ row }) => {
                    const diff = row.getValue('difficulty') as number
                    if (diff === -1)
                        return (
                            <span className="text-muted-foreground text-xs">
                                N/A
                            </span>
                        )
                    return <span>{diff}</span>
                },
                filterFn: (row, id, value) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id).toString())
                },
            },
            {
                accessorKey: 'hasNaturalGen',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Nat.Gen"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasNaturalGen')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasLoot',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Loot"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell
                        value={row.getValue('hasLoot')}
                        trueColor="text-emerald-500"
                    />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'requiresSilkTouch',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Silk"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell
                        value={row.getValue('requiresSilkTouch')}
                        trueColor="text-blue-500"
                    />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'craftable',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Craft"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('craftable')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasMobLoot',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Mob"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasMobLoot')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasBlockLoot',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="BlockL"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasBlockLoot')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasTrading',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Trade"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasTrading')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasSmelting',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Smelt"
                        isFilterable
                        options={filterOptions.yesNo}
                    />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasSmelting')} />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'renewable',
                size: 130,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Renew"
                        isFilterable
                        options={filterOptions.renewable}
                    />
                ),
                cell: ({ row }) => {
                    const renewable = row.getValue('renewable') as string
                    return (
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-[10px] rounded-sm',
                                renewable === 'yes'
                                    ? 'border-green-500 text-green-500'
                                    : renewable === 'vault_only'
                                      ? 'border-blue-500 text-blue-500'
                                      : 'border-red-500 text-red-500'
                            )}
                        >
                            {renewable === 'vault_only' ? 'Vault' : renewable}
                        </Badge>
                    )
                },
                filterFn: (row, id, value) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: 'stackSize',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Stack"
                        isFilterable
                        options={filterOptions.stackSize}
                    />
                ),
                cell: ({ row }) => <div>{row.getValue('stackSize')}</div>,
                filterFn: (row, id, value) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id).toString())
                },
            },
            {
                accessorKey: 'rarityTier',
                size: 120,
                header: ({ column }) => (
                    <SortableHeader
                        column={column}
                        title="Rarity"
                        isFilterable
                        options={filterOptions.rarity}
                    />
                ),
                cell: ({ row }) => {
                    const rarity = row.getValue('rarityTier') as string
                    const colors = {
                        common: 'bg-gray-500/10 text-gray-500',
                        uncommon:
                            'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
                        rare: 'bg-blue-500/10 text-blue-500',
                        epic: 'bg-purple-500/10 text-purple-500',
                    }
                    // @ts-ignore
                    return (
                        <Badge
                            variant="outline"
                            className={cn(
                                'capitalize text-[10px] rounded-sm',
                                colors[rarity] || ''
                            )}
                        >
                            {rarity}
                        </Badge>
                    )
                },
                filterFn: (row, id, value) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id))
                },
            },
            {
                accessorKey: 'json',
                size: 300,
                header: 'JSON',
                cell: ({ row }) => {
                    const rawItem = row.original.rawItem
                    const json = useMemo(
                        () => JSON.stringify(rawItem, null, 2),
                        [rawItem]
                    )
                    return (
                        <pre className="text-[10px] max-h-32 overflow-auto bg-muted p-2 rounded max-w-full whitespace-pre-wrap">
                            {json}
                        </pre>
                    )
                },
            },
        ],
        [filterOptions]
    )

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getRowId: (row) => row.id,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        columnResizeMode: 'onChange',
    })

    const { rows } = table.getRowModel()
    const tableContainerRef = useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 52,
        overscan: 10,
    })

    const virtualRows = rowVirtualizer.getVirtualItems()
    const totalSize = rowVirtualizer.getTotalSize()

    const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start || 0 : 0
    const paddingBottom =
        virtualRows.length > 0
            ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0)
            : 0

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length

    const handleBulkAction = async () => {
        const categoryToAssign =
            bulkActionType === 'new' ? newCategoryName : targetCategory
        if (!categoryToAssign) return

        const selectedItemIds = selectedRows.map((row) => row.original.id)

        for (const id of selectedItemIds) {
            const currentItemCats = getItemCategories(id)
            if (!currentItemCats.includes(categoryToAssign)) {
                await updateItem(id, items[id], [
                    ...currentItemCats,
                    categoryToAssign,
                ])
            }
        }

        setIsBulkDialogOpen(false)
        setRowSelection({})
        setNewCategoryName('')
    }

    const toggleAllFiltered = () => {
        const filteredRows = table.getFilteredRowModel().rows
        const allFilteredSelected =
            table.getFilteredSelectedRowModel().rows.length ===
            filteredRows.length

        if (allFilteredSelected) {
            setRowSelection({})
        } else {
            const newSelection = {}
            filteredRows.forEach((row) => {
                // @ts-ignore
                newSelection[row.id] = true
            })
            setRowSelection(newSelection)
        }
    }

    return (
        <div className="w-full flex flex-col h-[calc(100vh-140px)] gap-4">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 max-w-sm flex-1">
                        <Input
                            placeholder="Filter by name..."
                            value={
                                (table
                                    .getColumn('displayName')
                                    ?.getFilterValue() as string) ?? ''
                            }
                            onChange={(event) =>
                                table
                                    .getColumn('displayName')
                                    ?.setFilterValue(event.target.value)
                            }
                            className="flex-1"
                        />
                        {table.getState().columnFilters.length > 0 && (
                            <Button
                                variant="ghost"
                                onClick={() => table.resetColumnFilters()}
                                className="h-8 px-2 lg:px-3"
                            >
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleAllFiltered}
                        className="hidden sm:flex"
                    >
                        {table.getFilteredSelectedRowModel().rows.length ===
                            table.getFilteredRowModel().rows.length &&
                        table.getFilteredRowModel().rows.length > 0
                            ? 'Deselect All Filtered'
                            : 'Select All Filtered'}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="ml-auto"
                            >
                                <Settings2 className="mr-2 h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="ml-2">
                    {selectedCount > 0 && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsBulkDialogOpen(true)}
                        >
                            <Tags className="mr-2 h-4 w-4" />
                            Bulk Categorize ({selectedCount})
                        </Button>
                    )}
                </div>
            </div>

            <div
                className="rounded-md border overflow-auto relative flex-1"
                ref={tableContainerRef}
            >
                <Table className="table-fixed min-w-full">
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            style={{ width: header.getSize() }}
                                            className="h-auto py-2"
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {paddingTop > 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    style={{ height: `${paddingTop}px` }}
                                />
                            </TableRow>
                        )}
                        {rows.length > 0 ? (
                            virtualRows.map((virtualRow) => {
                                const row = rows[virtualRow.index]
                                return (
                                    <TableRow
                                        key={row.id}
                                        data-state={
                                            row.getIsSelected() && 'selected'
                                        }
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                style={{
                                                    width: cell.column.getSize(),
                                                }}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                        {paddingBottom > 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    style={{ height: `${paddingBottom}px` }}
                                />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between shrink-0 py-2">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="text-xs text-muted-foreground italic">
                    Showing all {rows.length} items virtualized
                </div>
            </div>

            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Categorize Items</DialogTitle>
                        <DialogDescription>
                            Assign {selectedCount} items to a category.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Action Type</Label>
                            <Select
                                value={bulkActionType}
                                onValueChange={(v: any) => setBulkActionType(v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="existing">
                                        Add to Existing Category
                                    </SelectItem>
                                    <SelectItem value="new">
                                        Create New Category
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {bulkActionType === 'existing' ? (
                            <div className="flex flex-col gap-2">
                                <Label>Select Category</Label>
                                <Select
                                    value={targetCategory}
                                    onValueChange={setTargetCategory}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-64">
                                            {Object.keys(categories)
                                                .sort()
                                                .map((cat) => (
                                                    <SelectItem
                                                        key={cat}
                                                        value={cat}
                                                    >
                                                        {cat}
                                                    </SelectItem>
                                                ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <Label>New Category Name</Label>
                                <Input
                                    placeholder="Enter category name..."
                                    value={newCategoryName}
                                    onChange={(e) =>
                                        setNewCategoryName(e.target.value)
                                    }
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsBulkDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkAction}
                            disabled={
                                (bulkActionType === 'existing' &&
                                    !targetCategory) ||
                                (bulkActionType === 'new' && !newCategoryName)
                            }
                        >
                            Apply to {selectedCount} items
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={editingItemId !== null}
                onOpenChange={() => setEditingItemId(null)}
            >
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                        <DialogDescription>
                            {editingItemId
                                ? `Editing: ${items[editingItemId]?.displayName || editingItemId}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {editingItemId && (
                        <div className="py-4">
                            <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-[60vh]">
                                {JSON.stringify(items[editingItemId], null, 2)}
                            </pre>
                            <p className="text-sm text-muted-foreground mt-4">
                                Main editor integration coming soon. For now,
                                you can copy the item data above.
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingItemId(null)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
