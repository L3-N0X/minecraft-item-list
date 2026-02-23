import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { validateItemData } from "@/components/schemaValidation";

export function ListView() {
    const { items, itemIds, getItemCategories, isLoading } = useData();
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    // Compute validation error counts for every item, keyed by item ID.
    const errorCounts = useMemo<Record<string, number>>(() => {
        if (isLoading) return {};
        const counts: Record<string, number> = {};
        for (const id of itemIds) {
            const map = validateItemData(items[id]);
            counts[id] = map.size;
        }
        return counts;
    }, [items, itemIds, isLoading]);

    if (isLoading) return <div className="p-8 text-center">Loading items...</div>;

    const filteredIds = itemIds.filter((id) => {
        const item = items[id];
        if (!item) return false;
        const cats = getItemCategories(id);
        const searchLower = search.toLowerCase();
        return (
            id.toLowerCase().includes(searchLower) ||
            item.displayName.toLowerCase().includes(searchLower) ||
            (item.displayNameGerman && item.displayNameGerman.toLowerCase().includes(searchLower)) ||
            cats.some((cat) => cat.toLowerCase().includes(searchLower))
        );
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Items</h1>
                    <p className="text-muted-foreground">Browse and manage Minecraft items.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <Input
                        placeholder="Search items by name, ID or category..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Categories</TableHead>
                                    <TableHead className="text-right">Issues</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredIds.slice(0, 100).map((id) => (
                                    <TableRow
                                        key={id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/edit/${id}`)}
                                    >
                                        <TableCell className="w-12">
                                            <img
                                                src={`/public/renders/${items[id]?.isBlock ? "blocks" : "items"}/${id}.png`}
                                                alt=""
                                                className="w-8 h-8 object-contain image-pixelated"
                                                onError={(e) => {
                                                    if (e.currentTarget.src.includes("/blocks/")) {
                                                        e.currentTarget.src = `/public/renders/items/${id}.png`;
                                                    } else {
                                                        e.currentTarget.src =
                                                            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{items[id]?.displayName}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {items[id]?.displayNameGerman}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {getItemCategories(id).map((cat) => (
                                                    <Badge
                                                        key={cat}
                                                        variant="outline"
                                                        className="text-[12px] px-3 py-0.5 h-auto font-normal"
                                                    >
                                                        {cat}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(errorCounts[id] ?? 0) > 0 ? (
                                                <Badge
                                                    variant="destructive"
                                                    className="text-[12px] px-3 py-0.5 h-auto font-mono tabular-nums"
                                                >
                                                    {errorCounts[id] ?? 0}
                                                </Badge>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">✓</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    {filteredIds.length > 100 && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Showing first 100 of {filteredIds.length} items. Use search to find specific items.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
