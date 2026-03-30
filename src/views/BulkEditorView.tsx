import React, { useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    type ColumnDef,
    type ColumnFiltersState,
    type Row,
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
import {
    type ItemData,
    type Renewable,
    type RarityTier,
    type StackSize,
} from '../types/minecraft'

type FilterOption = {
    label: string
    value: string
    icon?: React.ComponentType<{ className?: string }>
}

type TableRowData = {
    id: string
    displayName: string
    displayNameGerman: string
    categories: string[]
    difficulty: number
    hasNaturalGen: boolean
    hasLoot: boolean
    requiresSilkTouch: boolean
    craftable: boolean
    hasMobLoot: boolean
    hasBlockLoot: boolean
    hasTrading: boolean
    hasSmelting: boolean
    renewable: Renewable
    isBlock: boolean
    stackSize: StackSize
    rarityTier: RarityTier
    rawItem: ItemData
}
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
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
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
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
import { PencilIcon } from '@phosphor-icons/react'

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
                                variant="outline"
                                className="rounded-sm px-1 font-normal lg:hidden"
                            >
                                {selectedValues.size}
                            </Badge>
                            <div className="hidden space-x-1 lg:flex">
                                {selectedValues.size > 2 ? (
                                    <Badge
                                        variant="outline"
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
                                                variant="outline"
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

const SortableHeader = <TData,>({
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

const YesNoCell = React.memo(
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

const binaryFilterFn = (
    row: Row<TableRowData>,
    id: string,
    filterValues: string[]
) => {
    const val = !!row.getValue(id)
    const valStr = val.toString()
    return filterValues.includes(valStr)
}

export function BulkEditorView() {
    const {
        items,
        itemIds,
        categories,
        getItemCategories,
        updateItem,
        bulkEditorState,
        setBulkEditorState,
    } = useData()
    const navigate = useNavigate()

    const { sorting, columnFilters, columnVisibility, rowSelection } =
        bulkEditorState

    const setSorting = (
        updaterOrValue: SortingState | ((old: SortingState) => SortingState)
    ) => {
        setBulkEditorState((prev) => ({
            ...prev,
            sorting:
                typeof updaterOrValue === 'function'
                    ? updaterOrValue(prev.sorting)
                    : updaterOrValue,
        }))
    }

    const setColumnFilters = (
        updaterOrValue:
            | ColumnFiltersState
            | ((old: ColumnFiltersState) => ColumnFiltersState)
    ) => {
        setBulkEditorState((prev) => ({
            ...prev,
            columnFilters:
                typeof updaterOrValue === 'function'
                    ? updaterOrValue(prev.columnFilters)
                    : updaterOrValue,
        }))
    }

    const setColumnVisibility = (
        updaterOrValue:
            | VisibilityState
            | ((old: VisibilityState) => VisibilityState)
    ) => {
        setBulkEditorState((prev) => ({
            ...prev,
            columnVisibility:
                typeof updaterOrValue === 'function'
                    ? updaterOrValue(prev.columnVisibility)
                    : updaterOrValue,
        }))
    }

    const setRowSelection = (
        updaterOrValue:
            | Record<string, boolean>
            | ((old: Record<string, boolean>) => Record<string, boolean>)
    ) => {
        setBulkEditorState((prev) => ({
            ...prev,
            rowSelection:
                typeof updaterOrValue === 'function'
                    ? updaterOrValue(prev.rowSelection)
                    : updaterOrValue,
        }))
    }

    // Bulk Action State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [bulkActionTab, setBulkActionTab] = useState<'categorize' | 'field'>(
        'categorize'
    )

    // Categorization State
    const [targetCategory, setTargetCategory] = useState<string>('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [bulkActionType, setBulkActionType] = useState<'existing' | 'new'>(
        'existing'
    )

    // Field Update State
    const [selectedFieldKey, setSelectedFieldKey] = useState<string>('')
    const [fieldOperation, setFieldOperation] = useState<
        'set' | 'add' | 'multiply' | 'toggle'
    >('set')
    const [bulkFieldValue, setBulkFieldValue] = useState<string>('')

    const EDITABLE_FIELDS = [
        { label: 'Is Block', path: ['isBlock'], type: 'boolean' },
        {
            label: 'Renewable',
            path: ['renewable'],
            type: 'enum',
            options: ['yes', 'no', 'vault_only'],
        },
        {
            label: 'Stack Size',
            path: ['stackSize'],
            type: 'enum',
            options: ['1', '16', '64'],
        },
        {
            label: 'Rarity Tier',
            path: ['rarityTier'],
            type: 'enum',
            options: ['common', 'uncommon', 'rare', 'epic'],
        },
        {
            label: 'Obtainability',
            path: ['obtaining', 'obtainability'],
            type: 'enum',
            options: ['survival', 'creative_only', 'unobtainable'],
        },
        {
            label: 'Craftable',
            path: ['obtaining', 'craftable'],
            type: 'boolean',
        },
        {
            label: 'Difficulty to Obtain',
            path: ['obtaining', 'difficultyToObtain'],
            type: 'number',
        },
        {
            label: 'Requires Silk Touch',
            path: ['breaking', 'requiresSilkTouch'],
            type: 'enum',
            options: ['yes', 'no', 'silk_touch_only'],
        },
        {
            label: 'Instant Breaking',
            path: ['breaking', 'instantBreaking'],
            type: 'boolean',
        },
        {
            label: 'Fire Resistant',
            path: ['item', 'fireResistant'],
            type: 'boolean',
        },
        { label: 'Hunger', path: ['edible', 'hunger'], type: 'number' },
        { label: 'Saturation', path: ['edible', 'saturation'], type: 'number' },
    ]

    const data = useMemo<TableRowData[]>(() => {
        return itemIds.map((id) => {
            const item = items[id]
            if (!item) {
                return {
                    id,
                    displayName: '',
                    displayNameGerman: '',
                    categories: [],
                    difficulty: -1,
                    hasNaturalGen: false,
                    hasLoot: false,
                    requiresSilkTouch: false,
                    craftable: false,
                    hasMobLoot: false,
                    hasBlockLoot: false,
                    hasTrading: false,
                    hasSmelting: false,
                    renewable: 'no',
                    isBlock: false,
                    stackSize: 64,
                    rarityTier: 'common',
                    rawItem: {} as ItemData,
                }
            }
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

    const columns = useMemo<ColumnDef<TableRowData>[]>(
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
                size: 40,
                header: () => null,
                cell: ({ row }) => (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => navigate(`/edit/${row.original.id}`)}
                        title="Edit item"
                    >
                        <Pencil className="h-3 w-3" />
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
                        {row.getValue('id') as string}
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
                        {row.getValue('displayName') as string}
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
                        {row.getValue('displayNameGerman') as string}
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
                                    variant="outline"
                                    className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                >
                                    {cat}
                                </Badge>
                            ))}
                        </div>
                    )
                },
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const rowCats = row.getValue(id) as string[]
                    return value.some((v) => rowCats.includes(v))
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
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const val = row.getValue(id) as number
                    return value.includes(val.toString())
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
                    <YesNoCell
                        value={row.getValue('hasNaturalGen') as boolean}
                    />
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
                        value={row.getValue('hasLoot') as boolean}
                        trueColor="dark:text-green-400 text-green-600"
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
                        value={row.getValue('requiresSilkTouch') as boolean}
                        trueColor="dark:text-blue-400 text-blue-600"
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
                    <YesNoCell value={row.getValue('craftable') as boolean} />
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
                    <YesNoCell value={row.getValue('hasMobLoot') as boolean} />
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
                    <YesNoCell
                        value={row.getValue('hasBlockLoot') as boolean}
                    />
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
                    <YesNoCell value={row.getValue('hasTrading') as boolean} />
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
                    <YesNoCell value={row.getValue('hasSmelting') as boolean} />
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
                    const renewable = row.getValue('renewable') as Renewable
                    return (
                        <Badge
                            variant="outline"
                            className={cn(
                                'text-[10px] rounded-sm',
                                renewable === 'yes'
                                    ? 'border-green-700 text-green-800 dark:border-green-400 dark:text-green-400'
                                    : renewable === 'vault_only'
                                      ? 'border-blue-700 text-blue-800 dark:border-blue-400 dark:text-blue-400'
                                      : 'border-red-700 text-red-800 dark:border-red-400 dark:text-red-400'
                            )}
                        >
                            {renewable === 'vault_only' ? 'Vault' : renewable}
                        </Badge>
                    )
                },
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id) as string)
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
                cell: ({ row }) => (
                    <div>{row.getValue('stackSize') as number}</div>
                ),
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const val = row.getValue(id) as number
                    return value.includes(val.toString())
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
                    const rarity = row.getValue('rarityTier') as RarityTier
                    const colors: Record<string, string> = {
                        common: 'dark:bg-gray-500/10 dark:text-gray-500 bg-white/10 text-gray-800 dark:border-gray-400 border-gray-700',
                        uncommon:
                            'dark:bg-yellow-500/10 dark:text-yellow-400 bg-yellow-100/10 text-yellow-800 border-yellow-700 dark:border-yellow-500',
                        rare: 'dark:bg-blue-500/10 dark:text-blue-400 bg-blue-100/10 text-blue-800 border-blue-700 dark:border-blue-500',
                        epic: 'dark:bg-purple-500/10 dark:text-purple-400 bg-purple-100/10 text-purple-800 border-purple-700 dark:border-purple-500',
                    }
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
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    return value.includes(row.getValue(id) as string)
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

    const selectedField = EDITABLE_FIELDS.find(
        (f) => f.label === selectedFieldKey
    )

    const applyPatch = (
        itemData: ItemData,
        path: string[],
        op: string,
        val: string | number | boolean
    ) => {
        const newData = JSON.parse(JSON.stringify(itemData))
        let current = newData
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i]
            if (key === undefined) continue
            if (!current[key]) current[key] = {}
            current = current[key]
        }

        const lastKey = path[path.length - 1]
        if (lastKey === undefined) {
            console.error('Invalid path for patching:', path)
            return newData
        }
        const currentValue = current[lastKey]

        if (op === 'set') {
            if (selectedField?.type === 'number') {
                current[lastKey] = Number(val)
            } else if (selectedField?.type === 'boolean') {
                current[lastKey] = val === 'true'
            } else if (
                selectedField?.type === 'enum' &&
                selectedField.path[selectedField.path.length - 1] ===
                    'stackSize'
            ) {
                current[lastKey] = Number(val)
            } else {
                current[lastKey] = val
            }
        } else if (op === 'add') {
            current[lastKey] = (Number(currentValue) || 0) + Number(val)
        } else if (op === 'multiply') {
            current[lastKey] = (Number(currentValue) || 0) * Number(val)
        } else if (op === 'toggle') {
            current[lastKey] = !currentValue
        }

        return newData
    }

    const handleBulkAction = async () => {
        const selectedItemIds = selectedRows.map((row) => row.original.id)

        if (bulkActionTab === 'categorize') {
            const categoryToAssign =
                bulkActionType === 'new' ? newCategoryName : targetCategory
            if (!categoryToAssign) return

            for (const id of selectedItemIds) {
                const item = items[id]
                if (!item) continue
                const currentItemCats = getItemCategories(id)
                if (!currentItemCats.includes(categoryToAssign)) {
                    await updateItem(id, item, [
                        ...currentItemCats,
                        categoryToAssign,
                    ])
                }
            }
        } else if (bulkActionTab === 'field') {
            if (!selectedField) return

            for (const id of selectedItemIds) {
                const item = items[id]
                if (!item) continue

                const newData = applyPatch(
                    item,
                    selectedField.path,
                    fieldOperation,
                    bulkFieldValue
                )
                await updateItem(id, newData, getItemCategories(id))
            }
        }

        setIsBulkDialogOpen(false)
        setRowSelection({})
        setNewCategoryName('')
        setSelectedFieldKey('')
        setBulkFieldValue('')
    }

    const toggleAllFiltered = () => {
        const filteredRows = table.getFilteredRowModel().rows
        const allFilteredSelected =
            table.getFilteredSelectedRowModel().rows.length ===
            filteredRows.length

        if (allFilteredSelected) {
            setRowSelection({})
        } else {
            const newSelection: Record<string, boolean> = {}
            filteredRows.forEach((row) => {
                newSelection[row.id] = true
            })
            setRowSelection(newSelection)
        }
    }

    return (
        <div className="w-full flex flex-col h-[calc(100vh-80px)] gap-1 py-2">
            <div className="flex items-center justify-between shrink-0 mb-2">
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
                            <Button variant="outline" className="ml-auto">
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

                {selectedCount > 0 && (
                    <Button
                        variant="default"
                        className="ml-2"
                        size="sm"
                        onClick={() => setIsBulkDialogOpen(true)}
                    >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Bulk Edit ({selectedCount})
                    </Button>
                )}
            </div>

            <div
                className="rounded-md border bg-background/40 overflow-auto relative flex-1"
                ref={tableContainerRef}
            >
                {/* <Table className="table-fixed min-w-full">
                 */}
                <table className="w-full caption-bottom text-sm table-fixed min-w-full">
                    <TableHeader className="sticky top-0 z-10 shadow-sm bg-background">
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
                                if (!row) return null
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
                </table>
            </div>

            <div className="flex items-center justify-between shrink-0 py-2">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} rows selected
                </div>
            </div>

            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bulk Edit Items</DialogTitle>
                        <DialogDescription>
                            Apply changes to {selectedCount} selected items.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Action Mode</Label>
                            <Select
                                value={bulkActionTab}
                                onValueChange={(v: 'categorize' | 'field') =>
                                    setBulkActionTab(v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="categorize">
                                        Categorize
                                    </SelectItem>
                                    <SelectItem value="field">
                                        Update Field
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator className="my-2" />

                        {bulkActionTab === 'categorize' ? (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label>Action Type</Label>
                                    <Select
                                        value={bulkActionType}
                                        onValueChange={(
                                            v: 'existing' | 'new'
                                        ) => setBulkActionType(v)}
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
                                                setNewCategoryName(
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label>Select Field</Label>
                                    <Select
                                        value={selectedFieldKey}
                                        onValueChange={setSelectedFieldKey}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select field to edit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <ScrollArea className="h-64">
                                                {EDITABLE_FIELDS.map((f) => (
                                                    <SelectItem
                                                        key={f.label}
                                                        value={f.label}
                                                    >
                                                        {f.label}
                                                    </SelectItem>
                                                ))}
                                            </ScrollArea>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {selectedField && (
                                    <div className="flex flex-col gap-2">
                                        <Label>Operation</Label>
                                        <Select
                                            value={fieldOperation}
                                            onValueChange={(
                                                v:
                                                    | 'set'
                                                    | 'add'
                                                    | 'multiply'
                                                    | 'toggle'
                                            ) => setFieldOperation(v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select operation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="set">
                                                    Set Value
                                                </SelectItem>
                                                {selectedField.type ===
                                                    'number' && (
                                                    <>
                                                        <SelectItem value="add">
                                                            Add / Subtract
                                                        </SelectItem>
                                                        <SelectItem value="multiply">
                                                            Multiply
                                                        </SelectItem>
                                                    </>
                                                )}
                                                {selectedField.type ===
                                                    'boolean' && (
                                                    <SelectItem value="toggle">
                                                        Toggle
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedField &&
                                    fieldOperation !== 'toggle' && (
                                        <div className="flex flex-col gap-2">
                                            <Label>Value</Label>
                                            {selectedField.type === 'enum' ? (
                                                <Select
                                                    value={bulkFieldValue}
                                                    onValueChange={
                                                        setBulkFieldValue
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select value" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {selectedField.options?.map(
                                                            (opt) => (
                                                                <SelectItem
                                                                    key={opt}
                                                                    value={opt}
                                                                >
                                                                    {opt}
                                                                </SelectItem>
                                                            )
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            ) : selectedField.type ===
                                              'boolean' ? (
                                                <Select
                                                    value={bulkFieldValue}
                                                    onValueChange={
                                                        setBulkFieldValue
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select boolean" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">
                                                            True
                                                        </SelectItem>
                                                        <SelectItem value="false">
                                                            False
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Input
                                                    type={
                                                        selectedField.type ===
                                                        'number'
                                                            ? 'number'
                                                            : 'text'
                                                    }
                                                    placeholder="Enter value..."
                                                    value={bulkFieldValue}
                                                    onChange={(e) =>
                                                        setBulkFieldValue(
                                                            e.target.value
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    )}
                            </>
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
                                bulkActionTab === 'categorize'
                                    ? (bulkActionType === 'existing' &&
                                          !targetCategory) ||
                                      (bulkActionType === 'new' &&
                                          !newCategoryName)
                                    : !selectedField ||
                                      (fieldOperation !== 'toggle' &&
                                          !bulkFieldValue)
                            }
                        >
                            Apply to {selectedCount} items
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
