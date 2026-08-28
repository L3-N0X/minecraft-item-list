import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useRef,
} from 'react'

import {
    type ItemData,
    type ItemData as MinecraftItemData,
} from '../types/minecraft'

import {
    type ColumnFiltersState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table'

import { getDataUrl } from '../lib/utils'

import {
    fetchVersionConfig,
    validateVersion,
    createVersionApi,
    type VersionOption,
    type VersionConfig,
    type CreateVersionPayload,
} from '../lib/versions'

export type { MinecraftItemData as ItemData }
export type CategoriesData = Record<string, string[]>

interface BulkEditorState {
    sorting: SortingState
    columnFilters: ColumnFiltersState
    columnVisibility: VisibilityState
    rowSelection: Record<string, boolean>
}

interface DataContextType {
    items: Record<string, MinecraftItemData>
    itemIds: string[]
    categories: CategoriesData
    updateItem: (
        id: string,
        data: MinecraftItemData,
        itemCategories?: string[]
    ) => Promise<void>
    getItemIndex: (id: string) => number
    getItemCategories: (id: string) => string[]
    isLoading: boolean
    isStaticMode: boolean
    bulkEditorState: BulkEditorState
    setBulkEditorState: React.Dispatch<React.SetStateAction<BulkEditorState>>
    activeVersion: string
    availableVersions: VersionOption[]
    setActiveVersion: (version: string) => void
    createVersion: (payload: CreateVersionPayload) => Promise<void>
    schema: Record<string, unknown> | null
    structureToChest: Record<string, string[]>
    tags: Record<string, unknown> | null
}

const DataContext = createContext<DataContextType | undefined>(undefined)

function getUrlVersion(): string | null {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    return params.get('v')
}

export function DataProvider({ children }: { children: React.ReactNode }) {
    const isStaticMode = import.meta.env.VITE_STATIC_MODE === 'true'
    const [versionConfig, setVersionConfig] = useState<VersionConfig | null>(
        null
    )
    const [availableVersions, setAvailableVersions] = useState<VersionOption[]>(
        []
    )
    const [activeVersion, setActiveVersionState] =
        useState<string>('26.1-snapshot-10')

    const [items, setItems] = useState<Record<string, ItemData>>({})
    const [categories, setCategories] = useState<CategoriesData>({})
    const [schema, setSchema] = useState<Record<string, unknown> | null>(null)
    const [structureToChest, setStructureToChest] = useState<
        Record<string, string[]>
    >({})
    const [tags, setTags] = useState<Record<string, unknown> | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load initial version config
    useEffect(() => {
        fetchVersionConfig()
            .then((config) => {
                setVersionConfig(config)
                setAvailableVersions(config.versions)
                const initialUrlVer = getUrlVersion()
                const initialStorageVer = localStorage.getItem('mc_version')
                const validVersion = validateVersion(
                    initialUrlVer || initialStorageVer,
                    config
                )
                setActiveVersionState(validVersion)
            })
            .catch((err) => {
                console.error('Failed to load version config:', err)
            })
    }, [])

    const setActiveVersion = (version: string) => {
        if (!versionConfig) return
        const valid = validateVersion(version, versionConfig)
        setActiveVersionState(valid)
        localStorage.setItem('mc_version', valid)

        // Update URL search parameter ?v=...
        const url = new URL(window.location.href)
        url.searchParams.set('v', valid)
        window.history.pushState({}, '', url.toString())
    }

    const createVersion = async (payload: CreateVersionPayload) => {
        if (isStaticMode) {
            throw new Error('Version creation is not available in static mode')
        }

        const result = await createVersionApi(payload)
        setVersionConfig(result.config)
        setAvailableVersions(result.config.versions)

        const newVer = payload.newVersionId
        setActiveVersionState(newVer)
        localStorage.setItem('mc_version', newVer)

        // Update URL search parameter ?v=...
        const url = new URL(window.location.href)
        url.searchParams.set('v', newVer)
        window.history.pushState({}, '', url.toString())
    }

    // Bulk Editor State persistence
    const [bulkEditorState, setBulkEditorState] = useState<BulkEditorState>({
        sorting: [],
        columnFilters: [],
        columnVisibility: {
            json: false,
            isBlock: false,
            id: false,
            displayNameGerman: false,
            craftable: false,
            hasMobLoot: false,
            hasBlockLoot: false,
            hasTrading: false,
            hasSmelting: false,
            renewable: false,
            stackSize: false,
            rarityTier: false,
            craftingIngredient: false,
            luminousLevel: false,
            blastResistance: false,
            hardness: false,
            transparency: false,
            waterloggable: false,
            bestTools: false,
            flammable: false,
            catchesFire: false,
            durability: false,
            enchantability: false,
            isArmor: false,
            isFood: false,
            hunger: false,
            saturation: false,
            instantBreaking: false,
            hasBartering: false,
            hasFishing: false,
            dimensions: false,
            obtainability: false,
        },
        rowSelection: {},
    })

    // Ref to track pending saves for debouncing
    const saveTimeoutRef = useRef<
        Record<string, ReturnType<typeof setTimeout>>
    >({})

    useEffect(() => {
        if (!activeVersion) return
        setIsLoading(true)

        const versionPath = `/data/versions/${activeVersion}`
        const itemsUrl = isStaticMode
            ? getDataUrl(`${versionPath}/items.json`)
            : `/api/items?version=${activeVersion}`
        const categoriesUrl = isStaticMode
            ? getDataUrl(`${versionPath}/categories.json`)
            : `/api/categories?version=${activeVersion}`
        const schemaUrl = getDataUrl(`${versionPath}/schema.json`)
        const structureToChestUrl = getDataUrl(
            `${versionPath}/structure_to_chest.json`
        )
        const tagsUrl = getDataUrl(`${versionPath}/tags.json`)

        Promise.all([
            fetch(itemsUrl).then((res) => res.json()),
            fetch(categoriesUrl).then((res) => res.json()),
            fetch(schemaUrl)
                .then((res) => res.json())
                .catch(() => null),
            fetch(structureToChestUrl)
                .then((res) => res.json())
                .catch(() => null),
            fetch(tagsUrl)
                .then((res) => res.json())
                .catch(() => null),
        ])
            .then(
                ([
                    itemsData,
                    categoriesData,
                    schemaData,
                    structData,
                    tagsData,
                ]) => {
                    const normalizedItems = itemsData.items ?? itemsData
                    setItems(normalizedItems)
                    setCategories(categoriesData)
                    if (schemaData) setSchema(schemaData)
                    if (structData)
                        setStructureToChest(
                            structData.structureToChestMapping ?? structData
                        )
                    if (tagsData) setTags(tagsData)
                    setIsLoading(false)
                }
            )
            .catch((err) => {
                console.error(
                    `Failed to load data for version ${activeVersion}:`,
                    err
                )
                setIsLoading(false)
            })
    }, [activeVersion, isStaticMode])

    const itemIds = useMemo(() => Object.keys(items).sort(), [items])

    const getItemCategories = (id: string) => {
        return Object.entries(categories)
            .filter(([, itemIds]) => itemIds.includes(id))
            .map(([catName]) => catName)
    }

    const updateItem = async (
        id: string,
        data: ItemData,
        itemCategories?: string[]
    ) => {
        // Optimistic update
        setItems((prev) => ({ ...prev, [id]: data }))
        if (itemCategories) {
            setCategories((prev) => {
                const next = { ...prev }
                // Remove item from all
                for (const catName in next) {
                    const catItems = next[catName]
                    if (catItems) {
                        next[catName] = catItems.filter(
                            (itemId) => itemId !== id
                        )
                    }
                }
                // Add to new
                for (const catName of itemCategories) {
                    if (!next[catName]) next[catName] = []
                    const catItems = next[catName]
                    if (catItems && !catItems.includes(id)) {
                        catItems.push(id)
                    }
                }
                return next
            })
        }

        // Disable save to server if in static mode
        if (isStaticMode) {
            return
        }

        // Clear existing timeout for this item if any
        if (saveTimeoutRef.current[id]) {
            clearTimeout(saveTimeoutRef.current[id])
        }

        // Debounce save to 500ms
        saveTimeoutRef.current[id] = setTimeout(async () => {
            try {
                const response = await fetch('/api/items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id,
                        data,
                        categories: itemCategories,
                        version: activeVersion,
                    }),
                })
                if (!response.ok) throw new Error('Failed to save')
            } catch (error) {
                console.error('Save error:', error)
                alert(
                    'Failed to save to disk! Please check your connection and try again.'
                )
            } finally {
                delete saveTimeoutRef.current[id]
            }
        }, 500)
    }

    const getItemIndex = (id: string) => itemIds.indexOf(id)

    return (
        <DataContext.Provider
            value={{
                items,
                itemIds,
                categories,
                updateItem,
                getItemIndex,
                getItemCategories,
                isLoading,
                isStaticMode,
                bulkEditorState,
                setBulkEditorState,
                activeVersion,
                availableVersions,
                setActiveVersion,
                createVersion,
                schema,
                structureToChest,
                tags,
            }}
        >
            {children}
        </DataContext.Provider>
    )
}

export function useData() {
    const context = useContext(DataContext)
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider')
    }
    return context
}
