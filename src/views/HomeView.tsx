import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useData, type ItemData } from '../context/DataContext'
import { Input } from '@/components/ui/input'
import { ItemDetailPanel } from '@/components/ItemDetailPanel'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import {
    ArrowUpIcon,
    ArrowDownIcon,
    MagnifyingGlassIcon,
    XIcon,
    CaretRightIcon,
    SmileyXEyesIcon,
} from '@phosphor-icons/react'

export function HomeView() {
    const { items, itemIds } = useData()
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [displayLimit, setDisplayLimit] = useState(50)
    const skipScrollRef = useRef(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const loadMoreRef = useRef<HTMLButtonElement>(null)

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

                // German search removed to prevent cross-language noise

                let score = 0

                // STRICT FILTERING: Every typed term MUST be a contiguous substring
                const matchesAllTerms = searchTerms.every((term) => {
                    const isSubstringId = idLower.includes(term)
                    const isSubstringName = nameLower.includes(term)

                    if (isSubstringId || isSubstringName) {
                        // SMART SCORING: Heavily reward if a word starts with the term
                        // e.g., "dia" gets huge points in "Diamond", but less in "Obsidian"
                        const startsWithRegex = new RegExp(`\\b${term}`, 'i')

                        if (
                            startsWithRegex.test(nameLower) ||
                            startsWithRegex.test(idLower)
                        ) {
                            score += 50

                            // Extra bonus if they typed the exact full word (e.g., "test")
                            const exactWordRegex = new RegExp(
                                `\\b${term}\\b`,
                                'i'
                            )
                            if (
                                exactWordRegex.test(nameLower) ||
                                exactWordRegex.test(idLower)
                            ) {
                                score += 50 // Total 100 points for an exact word match
                            }
                        } else {
                            // It's in the string, but in the middle of a word (e.g., "est" in "test")
                            score += 10
                        }
                        return true
                    }

                    return false // If even one term isn't found as a substring, discard the item
                })

                if (!matchesAllTerms) return null

                // TIE-BREAKER: Shorter names score slightly higher
                // This ensures "Test Block" ranks above "Test Instance Block"
                score += 10 / (nameLower.length || 1)

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

    const totalResultsCount = filteredResults.length
    const displayedResults = filteredResults.slice(0, displayLimit)
    const hasMoreResults = totalResultsCount > displayLimit

    // Scroll selected item into view
    useEffect(() => {
        if (skipScrollRef.current) {
            skipScrollRef.current = false
            return
        }
        if (scrollContainerRef.current && displayedResults.length > 0) {
            const maxIndex = hasMoreResults
                ? displayedResults.length
                : displayedResults.length - 1
            if (selectedIndex < 0 || selectedIndex > maxIndex) return
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
    }, [selectedIndex, displayedResults, hasMoreResults])

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0)
        setDisplayLimit(50)
        if (search.trim() === '') {
            // Only clear selection if search is empty
            setSelectedItemId(null)
        }
    }, [search])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (filteredResults.length === 0) return

        const maxIndex = hasMoreResults
            ? displayedResults.length
            : displayedResults.length - 1

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (selectedIndex === -1 || selectedIndex >= maxIndex) {
                if (hasMoreResults && selectedIndex === maxIndex) {
                    return
                }
                setSelectedIndex(hasMoreResults ? maxIndex : 0)
            } else {
                setSelectedIndex(selectedIndex + 1)
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (selectedIndex <= 0) {
                setSelectedIndex(maxIndex)
            } else {
                setSelectedIndex(selectedIndex - 1)
            }
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (hasMoreResults && selectedIndex === displayedResults.length) {
                skipScrollRef.current = true
                setDisplayLimit((prev) => prev + 50)
            } else {
                const selected = displayedResults[selectedIndex]
                if (selected) {
                    setSelectedItemId(selected.id)
                }
            }
        } else if (e.key === 'Escape') {
            setSelectedItemId(null)
            setSearch('')
        }
    }

    const autoSelectedId = useMemo(() => {
        return search.trim() !== '' && filteredResults.length === 1
            ? filteredResults[0]?.id
            : null
    }, [search, filteredResults])

    const activeItemId = selectedItemId || autoSelectedId
    const selectedItem = activeItemId ? items[activeItemId] : null
    const isSearching = search.trim().length > 0

    return (
        <div
            className={`flex flex-col items-center transition-all duration-500 ease-in-out ${activeItemId || isSearching ? 'pt-0' : 'pt-[8vh]'} min-h-[85vh] gap-3 ${activeItemId ? 'max-w-7xl' : 'max-w-2xl'} mx-auto w-full`}
        >
            <div className="max-w-2xl mx-auto w-full space-y-2">
                <div
                    className={`flex flex-col items-center space-y-4 text-center transition-all duration-500 ease-in-out ${
                        activeItemId || isSearching
                            ? 'h-0 opacity-0 pointer-events-none -translate-y-4 overflow-hidden'
                            : 'h-auto opacity-100'
                    }`}
                >
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black tracking-tight">
                            MC Item Search
                        </h1>
                        <p className="text-muted-foreground text-base mb-3">
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
                        className="h-14 text-2xl pl-12 pr-12 rounded-2xl shadow-xl border-primary/20 focus-visible:ring-primary bg-background/60 backdrop-blur-xl transition-all duration-500 group-focus-within:shadow-primary/10 relative z-10"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                            if (selectedItemId) {
                                setSelectedItemId(null)
                            }
                        }}
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

            {search && !activeItemId && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-500 flex flex-col">
                    {filteredResults.length > 0 ? (
                        <>
                            <div className="relative z-20 rounded-2xl border dark:border-white/10 border-border/50 bg-background/40 backdrop-blur-xl dark:shadow-2xl shadow-lg overflow-hidden">
                                <div
                                    ref={scrollContainerRef}
                                    className="max-h-[55vh] overflow-y-auto"
                                >
                                    {displayedResults.map(
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
                                    {hasMoreResults && (
                                        <button
                                            ref={loadMoreRef}
                                            onClick={() => {
                                                skipScrollRef.current = true
                                                setDisplayLimit(
                                                    (prev) => prev + 50
                                                )
                                            }}
                                            className={`w-full py-3 text-sm font-medium text-center transition-colors border-t border-white/5 ${
                                                selectedIndex ===
                                                displayedResults.length
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/10'
                                            }`}
                                        >
                                            Load more (
                                            {totalResultsCount - displayLimit}{' '}
                                            remaining)
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="z-10 -mt-3 pt-5 pb-2.5 px-6 rounded-b-2xl border-x border-b border-white/10 dark:bg-background/40 bg-background/60 backdrop-blur-xl flex justify-end items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
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
                            <SmileyXEyesIcon
                                weight="duotone"
                                className="mx-auto mb-4 h-16 w-16 text-muted-foreground"
                            />
                            <p className="text-muted-foreground">
                                No results were found for
                            </p>
                            <p className="text-xl font-mono text-muted-foreground/80 mt-3">
                                "{search}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            <div className="w-full">
                {activeItemId && selectedItem && (
                    <div
                        key={activeItemId}
                        className="w-full animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 flex-1"
                    >
                        <div className="h-full rounded-3xl p-2 flex flex-col items-center overflow-auto">
                            <ItemDetailPanel
                                item={selectedItem}
                                itemId={activeItemId}
                            />
                        </div>
                    </div>
                )}
            </div>
            <div className="absolute bottom-4 dark:text-primary/15 text-primary/20">
                by l3_n0x
            </div>
        </div>
    )
}
