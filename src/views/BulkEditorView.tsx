import React, { useMemo, useState } from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useData } from "../context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Settings2, Tags, ArrowUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BulkEditorView() {
    const { items, itemIds, categories, getItemCategories, updateItem } = useData();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        json: false, // Hide JSON by default as it's large
    });
    const [rowSelection, setRowSelection] = useState({});

    // Bulk Action State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [targetCategory, setTargetCategory] = useState<string>("");
    const [newCategoryName, setNewCategoryName] = useState("");
    const [bulkActionType, setBulkActionType] = useState<"existing" | "new">("existing");

    const data = useMemo(() => {
        return itemIds.map((id) => ({
            id,
            ...items[id],
            categories: getItemCategories(id),
            json: JSON.stringify(items[id], null, 2),
        }));
    }, [items, itemIds, getItemCategories]);

    const columns: ColumnDef<(typeof data)[0]>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8"
                    >
                        ID
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("id")}</div>,
        },
        {
            accessorKey: "displayName",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8"
                    >
                        Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="font-medium">{row.getValue("displayName")}</div>,
        },
        {
            accessorKey: "displayNameGerman",
            header: "Name (DE)",
        },
        {
            accessorKey: "categories",
            header: "Categories",
            cell: ({ row }) => {
                const cats = row.getValue("categories") as string[];
                return (
                    <div className="flex flex-wrap gap-1">
                        {cats.map((cat) => (
                            <Badge key={cat} variant="secondary" className="text-[10px] px-1 py-0">
                                {cat}
                            </Badge>
                        ))}
                    </div>
                );
            },
            filterFn: (row, id, value) => {
                if (!value || value.length === 0) return true;
                const rowCats = row.getValue(id) as string[];
                return value.some((v: string) => rowCats.includes(v));
            }
        },
        {
            accessorKey: "isBlock",
            header: "Is Block",
            cell: ({ row }) => (row.getValue("isBlock") ? "Yes" : "No"),
        },
        {
            accessorKey: "json",
            header: "JSON Data",
            cell: ({ row }) => (
                <pre className="text-[10px] max-h-32 overflow-auto bg-muted p-2 rounded max-w-xs whitespace-pre-wrap">
                    {row.getValue("json")}
                </pre>
            ),
        },
    ];

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
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
        initialState: {
            pagination: {
                pageSize: 50,
            }
        }
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;

    const handleBulkAction = async () => {
        const categoryToAssign = bulkActionType === "new" ? newCategoryName : targetCategory;
        if (!categoryToAssign) return;

        const selectedItemIds = selectedRows.map(row => row.original.id);
        
        for (const id of selectedItemIds) {
            const currentItemCats = getItemCategories(id);
            if (!currentItemCats.includes(categoryToAssign)) {
                await updateItem(id, items[id], [...currentItemCats, categoryToAssign]);
            }
        }

        setIsBulkDialogOpen(false);
        setRowSelection({});
        setNewCategoryName("");
    };

    const toggleAllFiltered = () => {
        const filteredRows = table.getFilteredRowModel().rows;
        const allFilteredSelected = table.getFilteredSelectedRowModel().rows.length === filteredRows.length;
        
        if (allFilteredSelected) {
            setRowSelection({});
        } else {
            const newSelection = {};
            filteredRows.forEach(row => {
                // @ts-ignore
                newSelection[row.id] = true;
            });
            setRowSelection(newSelection);
        }
    };

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                    <Input
                        placeholder="Filter by name..."
                        value={(table.getColumn("displayName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("displayName")?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={toggleAllFiltered}
                        className="hidden sm:flex"
                    >
                        {table.getFilteredSelectedRowModel().rows.length === table.getFilteredRowModel().rows.length && table.getFilteredRowModel().rows.length > 0 
                            ? "Deselect All Filtered" 
                            : "Select All Filtered"}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto">
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
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="ml-2">
                    {selectedCount > 0 && (
                        <Button variant="default" size="sm" onClick={() => setIsBulkDialogOpen(true)}>
                            <Tags className="mr-2 h-4 w-4" />
                            Bulk Categorize ({selectedCount})
                        </Button>
                    )}
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef.header,
                                                      header.getContext()
                                                  )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
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
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
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
                                    <SelectItem value="existing">Add to Existing Category</SelectItem>
                                    <SelectItem value="new">Create New Category</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {bulkActionType === "existing" ? (
                            <div className="flex flex-col gap-2">
                                <Label>Select Category</Label>
                                <Select value={targetCategory} onValueChange={setTargetCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-64">
                                            {Object.keys(categories).sort().map(cat => (
                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleBulkAction}
                            disabled={(bulkActionType === "existing" && !targetCategory) || (bulkActionType === "new" && !newCategoryName)}
                        >
                            Apply to {selectedCount} items
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
