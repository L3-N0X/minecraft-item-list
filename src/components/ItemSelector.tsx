import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

const PAGE_SIZE = 50

interface ItemSelectorProps {
    items: string[]
    onSelect: (item: string) => void
    selectedItem?: string
    placeholder?: string
    autoOpen?: boolean
    onConfirm?: () => void
}

export function ItemSelector({
    items: itemIds,
    onSelect,
    selectedItem,
    placeholder = 'Select item...',
    autoOpen = false,
    onConfirm,
}: ItemSelectorProps) {
    const [open, setOpen] = React.useState(autoOpen)
    const [search, setSearch] = React.useState('')
    const [activeIndex, setActiveIndex] = React.useState(0)
    const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE)
    const { items } = useData()

    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    // ── Filtered list (memoised so it only recomputes when search/items change) ──
    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return itemIds
        return itemIds.filter(
            (id) =>
                id.toLowerCase().includes(q) ||
                (items[id]?.displayName ?? '').toLowerCase().includes(q)
        )
    }, [itemIds, items, search])

    // ── Reset active index + visible window whenever the filter changes ──
    React.useEffect(() => {
        setActiveIndex(0)
        setVisibleCount(PAGE_SIZE)
        if (listRef.current) listRef.current.scrollTop = 0
    }, [search])

    // ── When the popover opens: clear search, reset state, focus input ──
    React.useEffect(() => {
        if (open) {
            setSearch('')
            setActiveIndex(0)
            setVisibleCount(PAGE_SIZE)

            // Defer focus so Radix has finished mounting the portal
            const id = requestAnimationFrame(() => inputRef.current?.focus())
            return () => cancelAnimationFrame(id)
        }
    }, [open])

    // ── Load the next page when the user scrolls near the bottom ──
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
            setVisibleCount((v) => Math.min(v + PAGE_SIZE, filtered.length))
        }
    }

    // ── Keyboard navigation ──
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault()
                setActiveIndex((i) => {
                    const next = Math.min(i + 1, filtered.length - 1)
                    // Extend the visible window if we're approaching the end
                    if (next >= visibleCount - 5) {
                        setVisibleCount((v) =>
                            Math.min(v + PAGE_SIZE, filtered.length)
                        )
                    }
                    return next
                })
                break
            }
            case 'ArrowUp': {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, 0))
                break
            }
            case 'Enter': {
                e.preventDefault()
                const id = filtered[activeIndex]
                if (id) {
                    onSelect(id)
                    setOpen(false)
                }
                break
            }
            case 'Escape': {
                e.preventDefault()
                setOpen(false)
                break
            }
        }
    }

    const visibleItems = filtered.slice(0, visibleCount)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-10 font-mono"
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Enter' &&
                            !open &&
                            selectedItem &&
                            onConfirm
                        ) {
                            e.preventDefault()
                            onConfirm()
                        }
                    }}
                >
                    <span className="truncate">
                        {selectedItem ?? placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-(--radix-popover-trigger-width) p-0"
                // Prevent the popover from stealing focus away from our input
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {/* ── Search input ── */}
                <div className="flex items-center border-b px-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mr-2 h-4 w-4 shrink-0 opacity-50"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={inputRef}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search items…"
                        autoComplete="off"
                        spellCheck={false}
                        className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                    />
                </div>

                {/* ── Scrollable item list ── */}
                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="max-h-75 overflow-y-auto overflow-x-hidden p-1"
                    // Keep mouse-wheel scrolling working even when the popover is inside a dialog
                    onWheel={(e) => e.stopPropagation()}
                >
                    {visibleItems.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No item found.
                        </div>
                    ) : (
                        visibleItems.map((id, index) => (
                            <div
                                key={id}
                                role="option"
                                aria-selected={selectedItem === id}
                                className={cn(
                                    'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm',
                                    'hover:bg-accent hover:text-accent-foreground',
                                    index === activeIndex &&
                                        'bg-accent text-accent-foreground'
                                )}
                                // Highlight on hover so keyboard and mouse stay in sync
                                onMouseMove={() => setActiveIndex(index)}
                                onClick={() => {
                                    onSelect(id)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        'h-4 w-4 shrink-0',
                                        selectedItem === id
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    )}
                                />
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate font-medium">
                                        {items[id]?.displayName}
                                    </span>
                                    <span className="truncate font-mono text-xs text-muted-foreground">
                                        {id}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Lazy-load sentinel / hint */}
                    {visibleCount < filtered.length && (
                        <div className="py-2 text-center text-xs text-muted-foreground">
                            {filtered.length - visibleCount} more — keep
                            scrolling or refine your search
                        </div>
                    )}
                </div>

                {/* ── Footer hint ── */}
                <div className="border-t px-3 py-1.5 text-xs text-muted-foreground flex items-center justify-between">
                    <span>
                        {filtered.length} / {itemIds.length} items
                    </span>
                    <span className="opacity-60">
                        ↑↓ navigate · Enter select · Esc close
                    </span>
                </div>
            </PopoverContent>
        </Popover>
    )
}
