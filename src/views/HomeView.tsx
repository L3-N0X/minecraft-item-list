import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useData, type ItemData } from '../context/DataContext'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Card } from '@/components/ui/card'

export function HomeView() {
    const { items, itemIds } = useData()
    const [search, setSearch] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

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

    // Reset selection when search changes
    useEffect(() => {
        setSelectedIndex(0)
        if (filteredResults.length === 1 && filteredResults[0] !== undefined) {
            setSelectedItemId(filteredResults[0].id)
        } else {
            setSelectedItemId(null)
        }
    }, [search, filteredResults])

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

    return (
        <div
            className={`flex flex-col items-center transition-all duration-500 ease-in-out ${selectedItemId ? 'pt-4' : 'pt-[15vh]'} min-h-[85vh] gap-6 max-w-2xl mx-auto px-4`}
        >
            <div
                className={`w-full space-y-4 transition-all duration-500 ${selectedItemId ? 'scale-95 opacity-80' : ''}`}
            >
                {!selectedItemId && (
                    <div className="space-y-1 text-center animate-in fade-in slide-in-from-top-4 duration-500">
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            MC Item Search
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Type to find, arrows to navigate, Enter to select.
                        </p>
                    </div>
                )}

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Search items... (Ctrl+K)"
                        className="pl-11 h-12 text-lg rounded-xl shadow-md border-primary/10 focus-visible:ring-primary bg-background/50 backdrop-blur-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    {search && (
                        <button
                            onClick={() => {
                                setSearch('')
                                setSelectedItemId(null)
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {search && !selectedItemId && (
                <div className="w-full animate-in fade-in slide-in-from-top-2 duration-300">
                    {filteredResults.length > 0 ? (
                        <div className="space-y-1">
                            {filteredResults.map(({ id, item }, index) => (
                                <Card
                                    key={id}
                                    onClick={() => setSelectedItemId(id)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    className={`group px-3 py-1.5 flex items-center hover:bg-primary/5 transition-all cursor-pointer border-muted shadow-sm ${
                                        selectedIndex === index
                                            ? 'ring-2 ring-primary border-primary/50 bg-primary/5'
                                            : ''
                                    }`}
                                >
                                    <div className="grid grid-cols-[40px_1fr] items-center gap-3 w-full">
                                        <div className="flex justify-center p-1 rounded bg-muted/30 group-hover:bg-primary/10 transition-colors">
                                            <img
                                                src={`/renders/${item.isBlock ? 'blocks' : 'items'}/${id}.png`}
                                                alt=""
                                                className="h-7 w-7 object-contain image-pixelated"
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
                                        <span className="font-bold text-sm truncate text-left">
                                            {item.displayName}
                                        </span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/20 rounded-2xl border-dashed border-2">
                            <p className="text-muted-foreground italic">
                                No matches found for "{search}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {selectedItemId && selectedItem && (
                <div className="w-full animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 flex-1">
                    <Card className="h-full border-2 border-primary/10 bg-primary/5 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl overflow-auto">
                        <div className="flex items-center gap-6 w-full max-w-3xl border-b pb-6">
                            <div className="p-6 bg-background rounded-2xl shadow-inner border">
                                <img
                                    src={`/renders/${selectedItem.isBlock ? 'blocks' : 'items'}/${selectedItemId}.png`}
                                    alt={selectedItem.displayName}
                                    className="h-24 w-24 object-contain image-pixelated"
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
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-2xl bg-background/50">
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
