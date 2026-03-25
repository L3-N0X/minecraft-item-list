import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useData, type ItemData } from '../context/DataContext'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
    ArrowUpIcon,
    ArrowDownIcon,
    MagnifyingGlassIcon,
    XIcon,
    CaretRightIcon,
} from '@phosphor-icons/react'

export function HomeView() {
    const { items, itemIds } = useData()
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    // Global Ctrl+K handler
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
        }
        window.addEventListener('keydown', handleGlobalKeyDown)
        return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [])

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const filteredResults = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) return []

        const searchTerms = query.split(/\s+/).filter(Boolean)

        const results = itemIds
            .map((id) => {
                const item = items[id]
                if (!item) return null
                const idLower = id.toLowerCase()
                const nameLower = item.displayName.toLowerCase()
                const germanLower = (item.displayNameGerman || '').toLowerCase()

                let score = 0
                const matchesAllTerms = searchTerms.every((term) => {
                    const termInId = idLower.includes(term)
                    const termInName = nameLower.includes(term)
                    const termInGerman = germanLower.includes(term)

                    if (termInId || termInName || termInGerman) {
                        if (idLower === term || nameLower === term) score += 100
                        if (
                            idLower.startsWith(term) ||
                            nameLower.startsWith(term)
                        )
                            score += 50
                        score += (term.length / idLower.length) * 10
                        return true
                    }
                    return false
                })

                if (!matchesAllTerms) return null

                return { id, item, score }
            })
            .filter(
                (
                    entry
                ): entry is { id: string; item: ItemData; score: number } =>
                    entry !== null
            )
            .sort((a, b) => b.score - a.score)

        return results.slice(0, 50)
    }, [search, items, itemIds])

    // Scroll selected item into view
    useEffect(() => {
        if (scrollContainerRef.current && filteredResults.length > 0) {
            const selectedElement = scrollContainerRef.current.children[
                selectedIndex
            ] as HTMLElement
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth',
                })
            }
        }
    }, [selectedIndex, filteredResults])

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0)
        // Auto-select if there is exactly one result
        if (filteredResults.length === 1 && filteredResults[0] !== undefined) {
            setSelectedItemId(filteredResults[0].id)
        } else if (search.trim() === '') {
            // Only clear selection if search is empty
            setSelectedItemId(null)
        }
    }, [search, filteredResults.length])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (filteredResults.length === 0) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex((prev) => (prev + 1) % filteredResults.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(
                (prev) =>
                    (prev - 1 + filteredResults.length) % filteredResults.length
            )
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const selected = filteredResults[selectedIndex]
            if (selected) {
                setSelectedItemId(selected.id)
            }
        } else if (e.key === 'Escape') {
            setSelectedItemId(null)
            setSearch('')
        }
    }

    const selectedItem = selectedItemId ? items[selectedItemId] : null
    const isSearching = search.trim().length > 0

    return (
        <div
            className={`flex flex-col items-center transition-all duration-500 ease-in-out ${selectedItemId || isSearching ? 'pt-0' : 'pt-[8vh]'} min-h-[85vh] gap-3 max-w-2xl mx-auto px-4`}
        >
            <div className="w-full space-y-4">
                <div
                    className={`flex flex-col items-center space-y-4 text-center transition-all duration-500 ease-in-out ${
                        selectedItemId || isSearching
                            ? 'h-0 opacity-0 pointer-events-none -translate-y-4 overflow-hidden'
                            : 'h-auto opacity-100'
                    }`}
                >
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight">
                            MC Item Search
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Type to find, arrows to navigate, Enter to select.
                        </p>
                    </div>
                </div>

                <div className="relative group">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors z-20 pointer-events-none" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search items..."
                        className="h-14 text-2xl pl-12 pr-12 rounded-2xl shadow-xl border-primary/20 focus-visible:ring-primary bg-background/60 backdrop-blur-xl transition-all duration-300 group-focus-within:shadow-primary/10 relative z-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {search ? (
                        <button
                            onClick={() => {
                                setSearch('')
                                setSelectedItemId(null)
                                inputRef.current?.focus()
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-colors z-20"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                    ) : (
                        <KbdGroup className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                            <Kbd className="text-sm p-2">Ctrl</Kbd>
                            <Kbd className="text-sm p-2">K</Kbd>
                        </KbdGroup>
                    )}
                </div>
            </div>

            {search && !selectedItemId && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col">
                    {filteredResults.length > 0 ? (
                        <>
                            <div className="relative z-20 rounded-2xl border border-white/10 bg-background/40 backdrop-blur-xl shadow-2xl overflow-hidden">
                                <div
                                    ref={scrollContainerRef}
                                    className="max-h-[55vh] overflow-y-auto"
                                >
                                    {filteredResults.map(
                                        ({ id, item }, index) => (
                                            <div
                                                key={id}
                                                onClick={() => {
                                                    setSelectedIndex(index)
                                                    setSelectedItemId(id)
                                                }}
                                                className={`group px-4 py-2 flex items-center gap-4 transition-all cursor-pointer border-b border-white/5 last:border-b-0 ${
                                                    selectedIndex === index
                                                        ? 'bg-primary/20'
                                                        : 'hover:bg-white/10'
                                                }`}
                                            >
                                                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                                                    <img
                                                        src={`/renders/${item.isBlock ? 'blocks' : 'items'}/${id}.png`}
                                                        alt=""
                                                        className="h-8 w-8 object-contain image-pixelated"
                                                        onError={(e) => {
                                                            const target =
                                                                e.currentTarget
                                                            if (
                                                                target.src.includes(
                                                                    '/blocks/'
                                                                )
                                                            ) {
                                                                target.src = `/renders/items/${id}.png`
                                                            } else {
                                                                target.src =
                                                                    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span
                                                        className={`font-bold text-lg leading-tight truncate transition-colors ${selectedIndex === index ? 'text-primary' : 'text-foreground/90 group-hover:text-foreground'}`}
                                                    >
                                                        {item.displayName}
                                                    </span>
                                                    <span className="text-[11px] font-mono text-muted-foreground truncate opacity-70">
                                                        {id.replace(
                                                            'minecraft:',
                                                            ''
                                                        )}
                                                    </span>
                                                </div>
                                                {selectedIndex === index && (
                                                    <div className="ml-auto text-primary">
                                                        <CaretRightIcon className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="z-10 -mt-3 pt-5 pb-2.5 px-6 rounded-b-2xl border-x border-b border-white/10 bg-black/40 backdrop-blur-xl flex justify-end items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <Kbd className="text-[9px] bg-white/5 border-white/10 py-0 px-1.5">
                                            <ArrowUpIcon className="h-3 w-3" />
                                        </Kbd>
                                        <Kbd className="text-[9px] bg-white/5 border-white/10 py-0 px-1.5">
                                            <ArrowDownIcon className="h-3 w-3" />
                                        </Kbd>
                                    </div>
                                    <span>Select</span>
                                </div>
                                <span className="opacity-20 text-xs">|</span>
                                <div className="flex items-center gap-2">
                                    <Kbd className="text-[9px] bg-white/5 border-white/10 py-0 px-1.5">
                                        Enter
                                    </Kbd>
                                    <span>Open</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 bg-background/20 backdrop-blur-md rounded-2xl border-dashed border-2 border-white/10">
                            <p className="text-muted-foreground italic">
                                No matches found for "{search}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {selectedItemId && selectedItem && (
                <div className="w-full animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 flex-1">
                    <Card className="h-full border-2 border-primary/10 bg-background/40 backdrop-blur-xl rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl overflow-auto">
                        <div className="flex items-center gap-6 w-full max-w-3xl border-b border-white/10 pb-6">
                            <div className="p-6 bg-background/40 backdrop-blur-md rounded-2xl shadow-inner border border-white/10">
                                <img
                                    src={`/renders/${selectedItem.isBlock ? 'blocks' : 'items'}/${selectedItemId}.png`}
                                    alt={selectedItem.displayName}
                                    className="h-24 w-24 object-contain image-pixelated"
                                    onError={(e) => {
                                        const target = e.currentTarget
                                        if (target.src.includes('/blocks/')) {
                                            target.src = `/renders/items/${selectedItemId}.png`
                                        } else {
                                            target.src =
                                                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <h2 className="text-4xl font-black tracking-tight">
                                    {selectedItem.displayName}
                                </h2>
                                <p className="text-xl font-mono text-muted-foreground">
                                    {selectedItemId}
                                </p>
                                {selectedItem.displayNameGerman && (
                                    <p className="text-lg text-muted-foreground/80 italic">
                                        {selectedItem.displayNameGerman}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
                            {/* Placeholder for more specific item data */}
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-white/10 rounded-2xl bg-background/20">
                                <p className="text-lg font-medium">
                                    Detailed item statistics and properties
                                </p>
                                <p className="text-sm">
                                    Coming soon in the next layout iteration.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}
