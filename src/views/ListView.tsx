import React, { useState, useMemo, useEffect, useRef, useDeferredValue, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateItemData } from "@/components/schemaValidation";
import { X, CheckCircle2 } from "lucide-react";

const PAGE_SIZE = 75;

function ItemRow({ id }: { id: string }) {
    const { items, getItemCategories } = useData();
    const navigate = useNavigate();
    const item = items[id];

    const errorCount = useMemo(() => validateItemData(item).size, [item]);
    const categories = useMemo(() => getItemCategories(id), [id, getItemCategories]);

    return (
        <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/edit/${id}`)}>
            <TableCell className="w-12 py-2">
                <img
                    src={`/renders/${item?.isBlock ? "blocks" : "items"}/${id}.png`}
                    alt=""
                    className="w-8 h-8 object-contain image-pixelated"
                    onError={(e) => {
                        if (e.currentTarget.src.includes("/blocks/")) {
                            e.currentTarget.src = `/renders/items/${id}.png`;
                        } else {
                            e.currentTarget.src =
                                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                        }
                    }}
                />
            </TableCell>
            <TableCell className="whitespace-normal">
                <div className="flex flex-col">
                    <span className="font-medium">{item?.displayName}</span>
                    {item?.displayNameGerman && <span className="text-xs text-muted-foreground">{item.displayNameGerman}</span>}
                </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground whitespace-normal break-all">{id}</TableCell>
            <TableCell className="whitespace-normal">
                <div className="flex flex-wrap gap-1">
                    {categories.map((cat) => (
                        <Badge key={cat} variant="outline" className="text-[12px] px-3 py-0.5 h-auto font-normal">
                            {cat}
                        </Badge>
                    ))}
                </div>
            </TableCell>
            <TableCell className="text-right">
                {errorCount > 0 ? (
                    <Badge variant="destructive" className="text-[12px] px-3 py-0.5 h-auto font-mono tabular-nums">
                        {errorCount}
                    </Badge>
                ) : (
                    <Badge
                        variant="outline"
                        className="text-[12px] px-2 py-0.5 h-auto gap-1 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        OK
                    </Badge>
                )}
            </TableCell>
        </TableRow>
    );
}

export function ListView() {
    const { items, itemIds, getItemCategories, isLoading } = useData();
    const [search, setSearch] = useState("");
    const deferredSearch = useDeferredValue(search);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Filtering: multi-term, runs against deferred value so the input never blocks ──
    const filteredIds = useMemo(() => {
        const q = deferredSearch.trim().toLowerCase();
        if (!q) return itemIds;

        const terms = q.split(/\s+/).filter(Boolean);

        return itemIds.filter((id) => {
            const item = items[id];
            if (!item) return false;
            const cats = getItemCategories(id);
            // Build a single haystack string so we only do one pass per term
            const haystack = `${id} ${item.displayName ?? ""} ${item.displayNameGerman ?? ""} ${cats.join(" ")}`.toLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }, [itemIds, items, deferredSearch, getItemCategories]);

    // ── Reset page window whenever the filtered set changes ──
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [filteredIds]);

    // ── IntersectionObserver: extend visible window when sentinel enters viewport ──
    const loadMore = useCallback(() => {
        setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredIds.length));
    }, [filteredIds.length]);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) loadMore();
            },
            { rootMargin: "200px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore]);

    const visibleIds = filteredIds.slice(0, visibleCount);
    const isStale = search !== deferredSearch;
    const hasMore = visibleCount < filteredIds.length;

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading items…</div>;

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Items</h1>
                    <p className="text-muted-foreground">Browse and manage Minecraft items.</p>
                </div>
                <p
                    className={`text-sm tabular-nums transition-opacity ${isStale ? "opacity-40" : "opacity-100"} text-muted-foreground`}
                >
                    {isStale ? (
                        "Filtering…"
                    ) : (
                        <>
                            <span className="font-medium text-foreground">{filteredIds.length}</span>
                            {filteredIds.length !== itemIds.length && <span> of {itemIds.length}</span>} items
                        </>
                    )}
                </p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    {/* ── Search input with clear button ── */}
                    <div className="relative max-w-md">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
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
                        <Input
                            ref={inputRef}
                            placeholder="Filter by name, ID, German name or category… (space = AND)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch("");
                                    inputRef.current?.focus();
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table className="min-w-140">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead className="min-w-30">Name</TableHead>
                                    <TableHead className="min-w-35">ID</TableHead>
                                    <TableHead className="min-w-35">Categories</TableHead>
                                    <TableHead className="text-right w-20">Issues</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleIds.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No items match your search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visibleIds.map((id) => <ItemRow key={id} id={id} />)
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* ── Sentinel + footer ── */}
                    <div ref={sentinelRef} className="h-1" />

                    {(hasMore || visibleIds.length > 0) && (
                        <p className="text-center text-sm text-muted-foreground mt-3">
                            {hasMore ? (
                                <>
                                    Showing <span className="font-medium text-foreground">{visibleCount}</span> of{" "}
                                    <span className="font-medium text-foreground">{filteredIds.length}</span> items — scroll for
                                    more
                                </>
                            ) : (
                                <>
                                    All <span className="font-medium text-foreground">{filteredIds.length}</span> item
                                    {filteredIds.length !== 1 ? "s" : ""} shown
                                </>
                            )}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
