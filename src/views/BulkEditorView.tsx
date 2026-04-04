import { useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useData } from '../context/DataContext'
import { type ItemData, type Renewable, type RarityTier } from '../types/minecraft'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card'
import { Settings2, X, Pencil, Download, Copy, Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { PencilIcon } from '@phosphor-icons/react'
import { SortableHeader } from '@/components/bulkeditor/SortableHeader'
import { binaryFilterFn, type TableRowData } from '@/components/bulkeditor/utils'
import { YesNoCell } from '@/components/bulkeditor/YesNoCell'

function getChestTypeColor(chestName: string): string {
    // Order matters - check ominous variants first before regular variants
    if (chestName.endsWith('_ominous_trial_spawner')) {
        return 'border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-400'
    }
    if (chestName.endsWith('_ominous_vault')) {
        return 'border-blue-400 text-blue-600 dark:border-blue-300 dark:text-blue-300'
    }
    if (chestName.endsWith('_trial_spawner')) {
        return 'border-orange-600 text-orange-700 dark:border-orange-500 dark:text-orange-500'
    }
    if (chestName.endsWith('_vault')) {
        return 'border-orange-500 text-orange-600 dark:border-orange-400 dark:text-orange-400'
    }
    if (chestName.endsWith('_suspicious_gravel')) {
        return 'border-gray-400 text-gray-600 dark:border-gray-400 dark:text-gray-300'
    }
    if (chestName.endsWith('_suspicious_sand')) {
        return 'border-yellow-600 text-yellow-700 dark:border-yellow-500 dark:text-yellow-400'
    }
    if (chestName.endsWith('_barrel')) {
        return 'border-amber-800 text-amber-900 dark:border-amber-700 dark:text-amber-600'
    }
    if (chestName.endsWith('_decorated_pot')) {
        return 'border-red-600 text-red-700 dark:border-red-500 dark:text-red-400'
    }
    if (chestName.endsWith('_dispenser')) {
        return 'border-slate-500 text-slate-600 dark:border-slate-400 dark:text-slate-300'
    }
    if (chestName === 'item_frame') {
        return 'border-amber-600 text-amber-700 dark:border-amber-500 dark:text-amber-400'
    }
    if (chestName.endsWith('_furnace')) {
        return 'border-gray-700 text-gray-800 dark:border-gray-600 dark:text-gray-500'
    }
    // Default for chests (both "chest" and things ending with "_chest")
    if (chestName === 'chest' || chestName.endsWith('_chest')) {
        return 'border-amber-700 text-amber-800 dark:border-amber-600 dark:text-amber-500'
    }
    // Fallback
    return 'border-gray-500 text-gray-700 dark:border-gray-400 dark:text-gray-400'
}

export function BulkEditorView() {
    const { items, itemIds, categories, getItemCategories, updateItem, bulkEditorState, setBulkEditorState, isStaticMode } =
        useData()
    const navigate = useNavigate()

    const { sorting, columnFilters, columnVisibility, rowSelection } = bulkEditorState

    const setSorting = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
        setBulkEditorState((prev) => ({
            ...prev,
            sorting: typeof updaterOrValue === 'function' ? updaterOrValue(prev.sorting) : updaterOrValue,
        }))
    }

    const setColumnFilters = (updaterOrValue: ColumnFiltersState | ((old: ColumnFiltersState) => ColumnFiltersState)) => {
        setBulkEditorState((prev) => ({
            ...prev,
            columnFilters: typeof updaterOrValue === 'function' ? updaterOrValue(prev.columnFilters) : updaterOrValue,
        }))
    }

    const setColumnVisibility = (updaterOrValue: VisibilityState | ((old: VisibilityState) => VisibilityState)) => {
        setBulkEditorState((prev) => ({
            ...prev,
            columnVisibility: typeof updaterOrValue === 'function' ? updaterOrValue(prev.columnVisibility) : updaterOrValue,
        }))
    }

    const setRowSelection = (
        updaterOrValue: Record<string, boolean> | ((old: Record<string, boolean>) => Record<string, boolean>)
    ) => {
        setBulkEditorState((prev) => ({
            ...prev,
            rowSelection: typeof updaterOrValue === 'function' ? updaterOrValue(prev.rowSelection) : updaterOrValue,
        }))
    }

    // Bulk Action State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false)
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
    const [exportType, setExportType] = useState<'id' | 'name'>('id')
    const [exportCase, setExportCase] = useState<'original' | 'caps'>('original')
    const [exportSeparator, setExportSeparator] = useState<'comma' | 'comma-space' | 'newline' | 'newline-comma'>('comma-space')
    const [bulkActionTab, setBulkActionTab] = useState<'categorize' | 'field'>('categorize')
    const [isCopied, setIsCopied] = useState(false)

    // Categorization State
    const [targetCategory, setTargetCategory] = useState<string>('')
    const [newCategoryName, setNewCategoryName] = useState('')
    const [bulkActionType, setBulkActionType] = useState<'existing' | 'new'>('existing')

    // Field Update State
    const [selectedFieldKey, setSelectedFieldKey] = useState<string>('')
    const [fieldOperation, setFieldOperation] = useState<'set' | 'add' | 'multiply' | 'toggle'>('set')
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
                    biomes: [],
                    structures: [],
                    generatedLoot: [],
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
                biomes: item.obtaining?.naturalGeneration?.biomes ?? [],
                structures: item.obtaining?.naturalGeneration?.partOfStructures?.structures ?? [],
                generatedLoot: item.obtaining?.generatedLoot?.structures.flatMap((s) => s.chests.map((c) => c.chestName)) ?? [],
                rawItem: item,
            }
        })
    }, [items, itemIds, getItemCategories])

    const filterOptions = useMemo(() => {
        const categoryOptions = Object.keys(categories)
            .sort()
            .map((cat) => ({ label: cat, value: cat }))

        const difficulties = Array.from(new Set(data.map((d) => d.difficulty))).sort((a, b) => a - b)
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

        const biomesSet = new Set<string>()
        data.forEach((d) => d.biomes.forEach((b) => biomesSet.add(b)))
        const biomeOptions = [
            { label: '⬢ None', value: '__NO_BIOME__' },
            ...Array.from(biomesSet)
                .sort()
                .map((biome) => ({
                    label: biome.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    value: biome,
                })),
        ]

        const structuresSet = new Set<string>()
        data.forEach((d) => d.structures.forEach((s) => structuresSet.add(s)))
        const structureOptions = [
            { label: '⬢ Any Village', value: '__ANY_VILLAGE__' },
            { label: '⬢ None', value: '__NO_STRUCTURE__' },
            ...Array.from(structuresSet)
                .sort()
                .map((structure) => ({
                    label: structure.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    value: structure,
                })),
        ]

        const generatedLootSet = new Set<string>()
        data.forEach((d) => d.generatedLoot.forEach((l) => generatedLootSet.add(l)))
        const generatedLootOptions = [
            { label: '⬢ Any Chest', value: '__ANY_CHEST__' },
            { label: '⬢ Any Suspicious Block', value: '__ANY_SUSPICIOUS__' },
            { label: '⬢ No Chest', value: '__NO_CHEST__' },
            { label: '⬢ Not Lootable', value: '__NO_LOOT__' },
            ...Array.from(generatedLootSet)
                .sort()
                .map((loot) => ({
                    label: loot.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
                    value: loot,
                })),
        ]

        return {
            categories: categoryOptions,
            difficulty: difficultyOptions,
            yesNo: yesNoOptions,
            renewable: renewableOptions,
            stackSize: stackSizeOptions,
            rarity: rarityOptions,
            biomes: biomeOptions,
            structures: structureOptions,
            generatedLoot: generatedLootOptions,
        }
    }, [categories, data])

    const columns = useMemo<ColumnDef<TableRowData>[]>(() => {
        const cols: ColumnDef<TableRowData>[] = []

        cols.push({
            id: 'select',
            size: 40,
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() && 'indeterminate')}
                    onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
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
        })

        if (!isStaticMode) {
            cols.push({
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
            })
        }

        cols.push(
            {
                accessorKey: 'id',
                size: 150,
                header: ({ column }) => <SortableHeader column={column} title="ID" />,
                cell: ({ row }) => (
                    <div className="font-mono text-xs overflow-hidden text-ellipsis">{row.getValue('id') as string}</div>
                ),
            },
            {
                accessorKey: 'displayName',
                size: 200,
                header: ({ column }) => <SortableHeader column={column} title="Name" />,
                cell: ({ row }) => (
                    <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                        {row.getValue('displayName') as string}
                    </div>
                ),
            },
            {
                accessorKey: 'displayNameGerman',
                size: 200,
                header: ({ column }) => <SortableHeader column={column} title="Name (DE)" />,
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
                    <SortableHeader column={column} title="Categories" isFilterable options={filterOptions.categories} />
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
                    <SortableHeader column={column} title="Diff" isFilterable options={filterOptions.difficulty} />
                ),
                cell: ({ row }) => {
                    const diff = row.getValue('difficulty') as number
                    if (diff === -1) return <span className="text-muted-foreground text-xs">N/A</span>
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
                    <SortableHeader column={column} title="Nat.Gen" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => <YesNoCell value={row.getValue('hasNaturalGen') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasLoot',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Loot" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => (
                    <YesNoCell value={row.getValue('hasLoot') as boolean} trueColor="dark:text-green-400 text-green-600" />
                ),
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'requiresSilkTouch',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Silk" isFilterable options={filterOptions.yesNo} />
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
                    <SortableHeader column={column} title="Craft" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => <YesNoCell value={row.getValue('craftable') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasMobLoot',
                size: 100,
                header: ({ column }) => <SortableHeader column={column} title="Mob" isFilterable options={filterOptions.yesNo} />,
                cell: ({ row }) => <YesNoCell value={row.getValue('hasMobLoot') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasBlockLoot',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader column={column} title="BlockL" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => <YesNoCell value={row.getValue('hasBlockLoot') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasTrading',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Trade" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => <YesNoCell value={row.getValue('hasTrading') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'hasSmelting',
                size: 100,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Smelt" isFilterable options={filterOptions.yesNo} />
                ),
                cell: ({ row }) => <YesNoCell value={row.getValue('hasSmelting') as boolean} />,
                filterFn: binaryFilterFn,
            },
            {
                accessorKey: 'renewable',
                size: 130,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Renew" isFilterable options={filterOptions.renewable} />
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
                    <SortableHeader column={column} title="Stack" isFilterable options={filterOptions.stackSize} />
                ),
                cell: ({ row }) => <div>{row.getValue('stackSize') as number}</div>,
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
                    <SortableHeader column={column} title="Rarity" isFilterable options={filterOptions.rarity} />
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
                        <Badge variant="outline" className={cn('capitalize text-[10px] rounded-sm', colors[rarity] || '')}>
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
                accessorKey: 'biomes',
                size: 200,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Biomes" isFilterable options={filterOptions.biomes} />
                ),
                cell: ({ row }) => {
                    const biomes = row.getValue('biomes') as string[]
                    const count = biomes.length

                    if (count === 0) {
                        return <span className="text-muted-foreground text-xs">N/A</span>
                    }

                    if (count <= 3) {
                        return (
                            <div className="flex flex-wrap gap-1 max-w-full overflow-hidden py-1">
                                {biomes.map((biome) => (
                                    <Badge
                                        key={biome}
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                    >
                                        {biome.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </Badge>
                                ))}
                            </div>
                        )
                    }

                    return (
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm cursor-help">
                                    {count} biomes
                                </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-80 p-3 max-h-64 overflow-y-auto">
                                <div className="flex flex-wrap gap-1">
                                    {biomes.map((biome) => (
                                        <Badge
                                            key={biome}
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                        >
                                            {biome.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )
                },
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const rowBiomes = row.getValue(id) as string[]

                    // Handle special filters
                    const specialFilters = value.filter((v) => v.startsWith('__'))
                    const normalFilters = value.filter((v) => !v.startsWith('__'))

                    const results: boolean[] = []

                    // Check special filters
                    if (specialFilters.includes('__NO_BIOME__')) {
                        results.push(rowBiomes.length === 0)
                    }

                    // Check normal filters
                    if (normalFilters.length > 0) {
                        results.push(normalFilters.some((v) => rowBiomes.includes(v)))
                    }

                    // Combine with OR logic
                    return results.length > 0 ? results.some((r) => r) : true
                },
            },
            {
                accessorKey: 'structures',
                size: 200,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Structures" isFilterable options={filterOptions.structures} />
                ),
                cell: ({ row }) => {
                    const structures = row.getValue('structures') as string[]
                    const count = structures.length

                    if (count === 0) {
                        return <span className="text-muted-foreground text-xs">N/A</span>
                    }

                    if (count <= 3) {
                        return (
                            <div className="flex flex-wrap gap-1 max-w-full overflow-hidden py-1">
                                {structures.map((structure) => (
                                    <Badge
                                        key={structure}
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                    >
                                        {structure.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </Badge>
                                ))}
                            </div>
                        )
                    }

                    return (
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm cursor-help">
                                    {count} structures
                                </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-80 p-3 max-h-64 overflow-y-auto">
                                <div className="flex flex-wrap gap-1">
                                    {structures.map((structure) => (
                                        <Badge
                                            key={structure}
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm"
                                        >
                                            {structure.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )
                },
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const rowStructures = row.getValue(id) as string[]

                    // Handle special filters
                    const specialFilters = value.filter((v) => v.startsWith('__'))
                    const normalFilters = value.filter((v) => !v.startsWith('__'))

                    const results: boolean[] = []

                    // Check special filters
                    if (specialFilters.includes('__ANY_VILLAGE__')) {
                        const hasVillage = rowStructures.some((s) => s.startsWith('village_'))
                        results.push(hasVillage)
                    }

                    if (specialFilters.includes('__NO_STRUCTURE__')) {
                        results.push(rowStructures.length === 0)
                    }

                    // Check normal filters
                    if (normalFilters.length > 0) {
                        results.push(normalFilters.some((v) => rowStructures.includes(v)))
                    }

                    // Combine with OR logic
                    return results.length > 0 ? results.some((r) => r) : true
                },
            },
            {
                accessorKey: 'generatedLoot',
                size: 220,
                header: ({ column }) => (
                    <SortableHeader column={column} title="Generated Loot" isFilterable options={filterOptions.generatedLoot} />
                ),
                cell: ({ row }) => {
                    const lootChests = row.getValue('generatedLoot') as string[]
                    const count = lootChests.length

                    if (count === 0) {
                        return <span className="text-muted-foreground text-xs">N/A</span>
                    }

                    if (count <= 2) {
                        return (
                            <div className="flex flex-wrap gap-1 max-w-full overflow-hidden py-1">
                                {lootChests.map((chest) => (
                                    <Badge
                                        key={chest}
                                        variant="outline"
                                        className={cn(
                                            'text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm',
                                            getChestTypeColor(chest)
                                        )}
                                    >
                                        {chest.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                    </Badge>
                                ))}
                            </div>
                        )
                    }

                    return (
                        <HoverCard openDelay={200} closeDelay={100}>
                            <HoverCardTrigger asChild>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm cursor-help">
                                    {count} loot sources
                                </Badge>
                            </HoverCardTrigger>
                            <HoverCardContent side="top" className="w-96 p-3 max-h-64 overflow-y-auto">
                                <div className="flex flex-wrap gap-1">
                                    {lootChests.map((chest) => (
                                        <Badge
                                            key={chest}
                                            variant="outline"
                                            className={cn(
                                                'text-[10px] px-1.5 py-0 whitespace-nowrap rounded-sm',
                                                getChestTypeColor(chest)
                                            )}
                                        >
                                            {chest.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                        </Badge>
                                    ))}
                                </div>
                            </HoverCardContent>
                        </HoverCard>
                    )
                },
                filterFn: (row, id, value: string[]) => {
                    if (!value || value.length === 0) return true
                    const rowLoot = row.getValue(id) as string[]

                    // Handle special filters
                    const specialFilters = value.filter((v) => v.startsWith('__'))
                    const normalFilters = value.filter((v) => !v.startsWith('__'))

                    const results: boolean[] = []

                    // Check special filters
                    if (specialFilters.includes('__ANY_CHEST__')) {
                        const hasChest = rowLoot.some((loot) => loot === 'chest' || loot.endsWith('_chest'))
                        results.push(hasChest)
                    }

                    if (specialFilters.includes('__ANY_SUSPICIOUS__')) {
                        const hasSuspicious = rowLoot.some(
                            (loot) => loot.endsWith('_suspicious_sand') || loot.endsWith('_suspicious_gravel')
                        )
                        results.push(hasSuspicious)
                    }

                    if (specialFilters.includes('__NO_CHEST__')) {
                        const hasNoChest = !rowLoot.some((loot) => loot === 'chest' || loot.endsWith('_chest'))
                        results.push(hasNoChest)
                    }

                    if (specialFilters.includes('__NO_LOOT__')) {
                        results.push(rowLoot.length === 0)
                    }

                    // Check normal filters
                    if (normalFilters.length > 0) {
                        results.push(normalFilters.some((v) => rowLoot.includes(v)))
                    }

                    // Combine with OR logic (any filter match returns true)
                    return results.length > 0 ? results.some((r) => r) : true
                },
            },
            {
                accessorKey: 'json',
                size: 300,
                header: 'JSON',
                cell: ({ row }) => {
                    const rawItem = row.original.rawItem
                    const json = useMemo(() => JSON.stringify(rawItem, null, 2), [rawItem])
                    return (
                        <pre className="text-[10px] max-h-32 overflow-auto bg-muted p-2 rounded max-w-full whitespace-pre-wrap">
                            {json}
                        </pre>
                    )
                },
            }
        )

        return cols
    }, [filterOptions, isStaticMode, navigate])

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
    const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end || 0) : 0

    const selectedRows = table.getFilteredSelectedRowModel().rows
    const selectedCount = selectedRows.length

    const selectedField = EDITABLE_FIELDS.find((f) => f.label === selectedFieldKey)

    const applyPatch = (itemData: ItemData, path: string[], op: string, val: string | number | boolean) => {
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
            } else if (selectedField?.type === 'enum' && selectedField.path[selectedField.path.length - 1] === 'stackSize') {
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
            const categoryToAssign = bulkActionType === 'new' ? newCategoryName : targetCategory
            if (!categoryToAssign) return

            for (const id of selectedItemIds) {
                const item = items[id]
                if (!item) continue
                const currentItemCats = getItemCategories(id)
                if (!currentItemCats.includes(categoryToAssign)) {
                    await updateItem(id, item, [...currentItemCats, categoryToAssign])
                }
            }
        } else if (bulkActionTab === 'field') {
            if (!selectedField) return

            for (const id of selectedItemIds) {
                const item = items[id]
                if (!item) continue

                const newData = applyPatch(item, selectedField.path, fieldOperation, bulkFieldValue)
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
        const allFilteredSelected = table.getFilteredSelectedRowModel().rows.length === filteredRows.length

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
                    <div className="flex items-center dark:bg-transparent gap-2 max-w-sm flex-1">
                        <Input
                            placeholder="Filter by name..."
                            value={(table.getColumn('displayName')?.getFilterValue() as string) ?? ''}
                            onChange={(event) => table.getColumn('displayName')?.setFilterValue(event.target.value)}
                            className="flex-1 border-border bg-white/40 focus:ring-2 focus:ring-primary/50 data-[state=open]:bg-secondary"
                        />
                        {table.getState().columnFilters.length > 0 && (
                            <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
                                Reset
                                <X className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    <Button variant="outline" onClick={toggleAllFiltered} className="hidden sm:flex">
                        {table.getFilteredSelectedRowModel().rows.length === table.getFilteredRowModel().rows.length &&
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
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 ml-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExportDialogOpen(true)}
                        disabled={selectedCount === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export {selectedCount > 0 ? `(${selectedCount})` : ''}
                    </Button>

                    {selectedCount > 0 && !isStaticMode && (
                        <Button variant="default" size="sm" onClick={() => setIsBulkDialogOpen(true)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Bulk Edit ({selectedCount})
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border bg-background/40 overflow-auto relative flex-1" ref={tableContainerRef}>
                {/* <Table className="table-fixed min-w-full">
                 */}
                <table className="w-full caption-bottom text-sm table-fixed min-w-full">
                    <TableHeader className="sticky top-0 z-10 shadow-sm dark:bg-background bg-accent">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} style={{ width: header.getSize() }} className="h-auto py-2">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {paddingTop > 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length} style={{ height: `${paddingTop}px` }} />
                            </TableRow>
                        )}
                        {rows.length > 0 ? (
                            virtualRows.map((virtualRow) => {
                                const row = rows[virtualRow.index]
                                if (!row) return null
                                return (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                style={{
                                                    width: cell.column.getSize(),
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                        {paddingBottom > 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length} style={{ height: `${paddingBottom}px` }} />
                            </TableRow>
                        )}
                    </TableBody>
                </table>
            </div>

            <div className="flex items-center justify-between shrink-0 py-2">
                <div className="text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} rows selected
                </div>
            </div>

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Export Selected Items</DialogTitle>
                        <DialogDescription>Configure and export {selectedCount} items.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label>Export Property</Label>
                                <Select value={exportType} onValueChange={(v: 'id' | 'name') => setExportType(v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="id">Item IDs</SelectItem>
                                        <SelectItem value="name">Item Names</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label>Case</Label>
                                <Select value={exportCase} onValueChange={(v: 'original' | 'caps') => setExportCase(v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="original">Original</SelectItem>
                                        <SelectItem value="caps">ALL CAPS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Separator</Label>
                            <Select
                                value={exportSeparator}
                                onValueChange={(v: 'comma' | 'comma-space' | 'newline' | 'newline-comma') =>
                                    setExportSeparator(v)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="comma">Comma</SelectItem>
                                    <SelectItem value="comma-space">Comma + Space</SelectItem>
                                    <SelectItem value="newline">Newline</SelectItem>
                                    <SelectItem value="newline-comma">Newline + Comma</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label>Preview</Label>
                            <div className="bg-muted p-2 rounded-md text-xs font-mono break-all max-h-48 overflow-y-auto whitespace-pre-wrap">
                                {(() => {
                                    const itemsToExport = selectedRows.map((row) => {
                                        let text = exportType === 'id' ? row.original.id : row.original.displayName
                                        if (exportCase === 'caps') {
                                            text = text.toUpperCase()
                                        }
                                        return text
                                    })

                                    const sepMap = {
                                        comma: ',',
                                        'comma-space': ', ',
                                        newline: '\n',
                                        'newline-comma': ',\n',
                                    }

                                    return itemsToExport.join(sepMap[exportSeparator])
                                })()}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-wrap gap-2 sm:justify-between">
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                            Close
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const itemsToExport = selectedRows.map((row) => {
                                        let text = exportType === 'id' ? row.original.id : row.original.displayName
                                        if (exportCase === 'caps') {
                                            text = text.toUpperCase()
                                        }
                                        return text
                                    })

                                    const sepMap = {
                                        comma: ',',
                                        'comma-space': ', ',
                                        newline: '\n',
                                        'newline-comma': ',\n',
                                    }

                                    const content = itemsToExport.join(sepMap[exportSeparator])
                                    const blob = new Blob([content], {
                                        type: 'text/plain',
                                    })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `mc-items-export-${exportType}.txt`
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    URL.revokeObjectURL(url)
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download .txt
                            </Button>
                            <Button
                                onClick={async () => {
                                    const itemsToExport = selectedRows.map((row) => {
                                        let text = exportType === 'id' ? row.original.id : row.original.displayName
                                        if (exportCase === 'caps') {
                                            text = text.toUpperCase()
                                        }
                                        return text
                                    })

                                    const sepMap = {
                                        comma: ',',
                                        'comma-space': ', ',
                                        newline: '\n',
                                        'newline-comma': ',\n',
                                    }

                                    const content = itemsToExport.join(sepMap[exportSeparator])

                                    try {
                                        await navigator.clipboard.writeText(content)
                                        setIsCopied(true)
                                        setTimeout(() => setIsCopied(false), 2000)
                                    } catch (err) {
                                        console.error('Failed to copy:', err)
                                    }
                                }}
                            >
                                {isCopied ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bulk Edit Items</DialogTitle>
                        <DialogDescription>Apply changes to {selectedCount} selected items.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label>Action Mode</Label>
                            <Select value={bulkActionTab} onValueChange={(v: 'categorize' | 'field') => setBulkActionTab(v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="categorize">Categorize</SelectItem>
                                    <SelectItem value="field">Update Field</SelectItem>
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
                                        onValueChange={(v: 'existing' | 'new') => setBulkActionType(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select action type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="existing">Add to Existing Category</SelectItem>
                                            <SelectItem value="new">Create New Category</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {bulkActionType === 'existing' ? (
                                    <div className="flex flex-col gap-2">
                                        <Label>Select Category</Label>
                                        <Select value={targetCategory} onValueChange={setTargetCategory}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <ScrollArea className="h-64">
                                                    {Object.keys(categories)
                                                        .sort()
                                                        .map((cat) => (
                                                            <SelectItem key={cat} value={cat}>
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
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col gap-2">
                                    <Label>Select Field</Label>
                                    <Select value={selectedFieldKey} onValueChange={setSelectedFieldKey}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select field to edit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <ScrollArea className="h-64">
                                                {EDITABLE_FIELDS.map((f) => (
                                                    <SelectItem key={f.label} value={f.label}>
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
                                            onValueChange={(v: 'set' | 'add' | 'multiply' | 'toggle') => setFieldOperation(v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select operation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="set">Set Value</SelectItem>
                                                {selectedField.type === 'number' && (
                                                    <>
                                                        <SelectItem value="add">Add / Subtract</SelectItem>
                                                        <SelectItem value="multiply">Multiply</SelectItem>
                                                    </>
                                                )}
                                                {selectedField.type === 'boolean' && (
                                                    <SelectItem value="toggle">Toggle</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {selectedField && fieldOperation !== 'toggle' && (
                                    <div className="flex flex-col gap-2">
                                        <Label>Value</Label>
                                        {selectedField.type === 'enum' ? (
                                            <Select value={bulkFieldValue} onValueChange={setBulkFieldValue}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select value" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedField.options?.map((opt) => (
                                                        <SelectItem key={opt} value={opt}>
                                                            {opt}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        ) : selectedField.type === 'boolean' ? (
                                            <Select value={bulkFieldValue} onValueChange={setBulkFieldValue}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select boolean" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">True</SelectItem>
                                                    <SelectItem value="false">False</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Input
                                                type={selectedField.type === 'number' ? 'number' : 'text'}
                                                placeholder="Enter value..."
                                                value={bulkFieldValue}
                                                onChange={(e) => setBulkFieldValue(e.target.value)}
                                            />
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleBulkAction}
                            disabled={
                                bulkActionTab === 'categorize'
                                    ? (bulkActionType === 'existing' && !targetCategory) ||
                                      (bulkActionType === 'new' && !newCategoryName)
                                    : !selectedField || (fieldOperation !== 'toggle' && !bulkFieldValue)
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
