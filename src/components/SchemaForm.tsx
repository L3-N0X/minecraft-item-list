import React, { useMemo, useState } from "react";
import Ajv from "ajv";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import schema from "../data/schema.json";

function resolveRef(ref: string): any {
    if (ref.startsWith("#/")) {
        const parts = ref.slice(2).split("/");
        let current: any = schema;
        for (const part of parts) {
            current = current[part];
            if (current === undefined) return undefined;
        }
        return current;
    }
    return undefined;
}

function isQuantitySpec(fieldSchema: any): boolean {
    if (!Array.isArray(fieldSchema?.oneOf) || fieldSchema.oneOf.length !== 2) return false;
    const hasInteger = fieldSchema.oneOf.some((o: any) => o.type === "integer" && !o.properties);
    const hasRange = fieldSchema.oneOf.some(
        (o: any) => o.type === "object" && o.properties?.min?.type === "integer" && o.properties?.max?.type === "integer",
    );
    return hasInteger && hasRange;
}

function resolveSchema(fieldSchema: any): any {
    if (fieldSchema?.$ref) {
        return resolveRef(fieldSchema.$ref) ?? fieldSchema;
    }
    if (fieldSchema?.items?.$ref) {
        return {
            ...fieldSchema,
            items: resolveRef(fieldSchema.items.$ref) ?? fieldSchema.items,
        };
    }
    return fieldSchema;
}

// ---------------------------------------------------------------------------
// Validation engine (AJV)
// ---------------------------------------------------------------------------

type ValidationSeverity = "warning" | "error";
interface ValidationEntry {
    severity: ValidationSeverity;
    message: string;
}
type ValidationMap = Map<string, ValidationEntry>;

const ajv = new Ajv({ allErrors: true, strict: false });
// Merge root `definitions` into the item sub-schema so that $ref entries like
// "#/definitions/stackSizeEnum" can be resolved (# refers to the compiled schema root).
const itemSchema = {
    definitions: (schema as any).definitions,
    ...(schema.properties as any).items.additionalProperties,
};
const validateAjv = ajv.compile(itemSchema);

/** Converts an AJV instancePath like "/foo/bar/0" to dot-notation "foo.bar.0" */
function instancePathToDot(instancePath: string): string {
    return instancePath.replace(/^\//, "").replace(/\//g, ".");
}

function validateItemData(data: any): ValidationMap {
    const errors: ValidationMap = new Map();
    validateAjv(data ?? {});
    for (const err of validateAjv.errors ?? []) {
        let path: string;
        if (err.keyword === "required") {
            const parent = instancePathToDot(err.instancePath);
            const missing = (err.params as any).missingProperty as string;
            path = parent ? `${parent}.${missing}` : missing;
        } else {
            path = instancePathToDot(err.instancePath) || "__root__";
        }
        // Only keep the first error per path
        if (!errors.has(path)) {
            errors.set(path, { severity: "error", message: err.message ?? "Invalid value" });
        }
    }
    return errors;
}

// ---------------------------------------------------------------------------

interface SchemaFormProps {
    data: any;
    onChange: (newData: any) => void;
}

function getLabel(key: string, fieldSchema: any) {
    return (
        fieldSchema.title ||
        key
            .split(/(?=[A-Z])|_/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
    );
}

interface EnumSelectProps {
    label: string;
    options: string[];
    value: string;
    onChange: (val: string) => void;
    triggerClassName?: string;
}

function EnumSelect({ label, options, value, onChange, triggerClassName }: EnumSelectProps) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value || ""} onValueChange={onChange}>
                <SelectTrigger className={cn("w-full", triggerClassName)}>
                    <SelectValue placeholder={`Select ${label}...`} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

interface MultiEnumSelectProps {
    label: string;
    options: string[];
    value: string[];
    onChange: (val: string[]) => void;
    triggerClassName?: string;
}

function MultiEnumSelect({ label, options, value, onChange, triggerClassName }: MultiEnumSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedValues = Array.isArray(value) ? value : [];

    const handleUnselect = (item: string) => {
        onChange(selectedValues.filter((i) => i !== item));
    };

    const handleSelect = (item: string) => {
        if (selectedValues.includes(item)) {
            handleUnselect(item);
        } else {
            onChange([...selectedValues, item]);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-1 mb-2">
                {selectedValues.map((item) => (
                    <Badge key={item} variant="secondary" className="flex items-center gap-1 py-0.5">
                        {item}
                        <button
                            className="ml-1 rounded-full outline-none hover:bg-muted p-0.5"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUnselect(item);
                            }}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                {selectedValues.length === 0 && <span className="text-xs text-muted-foreground italic">None selected</span>}
            </div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between h-9 px-3", triggerClassName)}
                    >
                        <span className="text-muted-foreground font-normal">Add {label.toLowerCase()}...</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                    <Command>
                        <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem key={option} onSelect={() => handleSelect(option)}>
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedValues.includes(option) ? "opacity-100" : "opacity-0",
                                            )}
                                        />
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

interface QuantitySpecFieldProps {
    label: string;
    value: number | { min: number; max: number } | undefined;
    onChange: (val: number | { min: number; max: number } | undefined) => void;
}

function QuantitySpecField({ label, value, onChange }: QuantitySpecFieldProps) {
    const isRange = value !== null && typeof value === "object";

    const switchToFixed = () => {
        const fixedVal = isRange ? (value as { min: number; max: number }).min : 1;
        onChange(fixedVal);
    };

    const switchToRange = () => {
        const base = typeof value === "number" ? value : 1;
        onChange({ min: base, max: base });
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <div className="flex rounded-md border overflow-hidden text-xs h-6">
                    <button
                        type="button"
                        className={cn(
                            "px-2 transition-colors",
                            !isRange ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                        )}
                        onClick={switchToFixed}
                    >
                        Fixed
                    </button>
                    <button
                        type="button"
                        className={cn(
                            "px-2 border-l transition-colors",
                            isRange ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground",
                        )}
                        onClick={switchToRange}
                    >
                        Range
                    </button>
                </div>
            </div>
            {!isRange ? (
                <Input
                    type="number"
                    value={typeof value === "number" ? value : ""}
                    onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                            onChange(undefined);
                        } else {
                            const v = parseInt(raw);
                            if (!isNaN(v)) onChange(v);
                        }
                    }}
                />
            ) : (
                <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Min</Label>
                        <Input
                            type="number"
                            value={(value as { min: number; max: number }).min ?? ""}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (!isNaN(v)) onChange({ ...(value as { min: number; max: number }), min: v });
                            }}
                        />
                    </div>
                    <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">Max</Label>
                        <Input
                            type="number"
                            value={(value as { min: number; max: number }).max ?? ""}
                            onChange={(e) => {
                                const v = parseInt(e.target.value);
                                if (!isNaN(v)) onChange({ ...(value as { min: number; max: number }), max: v });
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export function SchemaForm({ data, onChange }: SchemaFormProps) {
    const itemProperties = itemSchema.properties || {};

    const [pendingIsBlock, setPendingIsBlock] = useState<boolean | null>(null);

    const handleFieldChange = (path: (string | number)[], value: any) => {
        const newData = JSON.parse(JSON.stringify(data));
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i] as string | number;
            const nextSegment = path[i + 1];
            if (current[segment] === undefined || current[segment] === null) {
                current[segment] = typeof nextSegment === "number" ? [] : {};
            }
            current = current[segment];
        }
        current[path[path.length - 1] as string | number] = value;

        // When isBlock is toggled, remove the now-irrelevant sub-object so stale
        // data doesn't cause phantom validation errors.
        if (path.length === 1 && path[0] === "isBlock") {
            if (value === true) {
                delete newData.item;
            } else {
                delete newData.block;
            }
        }

        onChange(newData);
    };

    /**
     * Called when the isBlock switch is toggled. If the section that would be
     * deleted already has data, show a confirmation dialog first. Otherwise
     * apply the change immediately.
     */
    const handleIsBlockChange = (checked: boolean) => {
        const sectionToDelete = checked ? "item" : "block";
        const hasExistingData = data?.[sectionToDelete] && Object.keys(data[sectionToDelete]).length > 0;
        if (hasExistingData) {
            setPendingIsBlock(checked);
        } else {
            handleFieldChange(["isBlock"], checked);
        }
    };

    const confirmIsBlockChange = () => {
        if (pendingIsBlock !== null) {
            handleFieldChange(["isBlock"], pendingIsBlock);
            setPendingIsBlock(null);
        }
    };

    const cancelIsBlockChange = () => {
        setPendingIsBlock(null);
    };

    const validationErrors = useMemo(() => validateItemData(data), [data]);

    /** Direct error at exactly this path */
    const getErr = (p: (string | number)[]): ValidationEntry | undefined => validationErrors.get(p.join("."));

    /**
     * Highest-severity error at OR below this path.
     * Used for section containers so they light up when any child has an issue.
     */
    const getChildErr = (p: (string | number)[]): ValidationEntry | undefined => {
        const prefix = p.join(".");
        let result: ValidationEntry | undefined;
        for (const [k, v] of validationErrors.entries()) {
            if (k === prefix || k.startsWith(prefix + ".")) {
                if (!result || v.severity === "error") {
                    result = v;
                    if (v.severity === "error") break;
                }
            }
        }
        return result;
    };

    /** ring class for leaf fields (no existing border) */
    const vRing = (p: (string | number)[]): string => {
        const e = getErr(p);
        if (!e) return "";
        return e.severity === "error" ? "ring-2 ring-red-500/70" : "ring-2 ring-yellow-400/70";
    };

    /** border-color class for section containers that already have border-2 */
    const vBorderColor = (p: (string | number)[], useChildScan = false): string => {
        const e = useChildScan ? getChildErr(p) : getErr(p);
        if (!e) return "border-muted";
        return e.severity === "error" ? "border-red-500/70" : "border-yellow-400/70";
    };

    /** Small message text rendered below a leaf field */
    const vMsg = (p: (string | number)[]): React.ReactNode => {
        const e = getErr(p);
        if (!e) return null;
        return (
            <p className={cn("text-[11px] leading-tight mt-1", e.severity === "error" ? "text-red-400" : "text-yellow-500/90")}>
                {e.message}
            </p>
        );
    };

    /** Inline message for section headers */
    const vMsgInline = (p: (string | number)[], useChildScan = false): React.ReactNode => {
        const e = useChildScan ? getChildErr(p) : getErr(p);
        if (!e) return null;
        return (
            <span className={cn("text-xs font-normal", e.severity === "error" ? "text-red-400" : "text-yellow-500/90")}>
                {e.message}
            </span>
        );
    };

    const renderRecursiveFields = (properties: any, currentPath: (string | number)[], currentData: any) => {
        return Object.entries(properties).map(([key, rawFieldSchema]: [string, any]) => {
            const path: (string | number)[] = [...currentPath, key];
            const value = currentData ? currentData[key] : undefined;
            const fieldSchema = resolveSchema(rawFieldSchema);
            const label = getLabel(key, fieldSchema);

            // Handle Enum (Single)
            if (fieldSchema.enum) {
                return (
                    <div key={path.join(".")}>
                        <EnumSelect
                            label={label}
                            options={fieldSchema.enum}
                            value={value}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={vRing(path)}
                        />
                        {vMsg(path)}
                    </div>
                );
            }

            // Handle QuantitySpec (fixed integer or {min, max} range)
            if (isQuantitySpec(fieldSchema)) {
                return (
                    <div key={path.join(".")} className={cn("rounded-md", vRing(path))}>
                        <QuantitySpecField label={label} value={value} onChange={(val) => handleFieldChange(path, val)} />
                        {vMsg(path)}
                    </div>
                );
            }

            // Handle Array of Enums (Multi-select)
            if (fieldSchema.type === "array" && fieldSchema.items?.enum) {
                const options = [...(fieldSchema.items.enum || [])].sort();
                return (
                    <div key={path.join(".")} className="md:col-span-2">
                        <MultiEnumSelect
                            label={label}
                            options={options}
                            value={value}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={vRing(path)}
                        />
                        {vMsg(path)}
                    </div>
                );
            }

            // Handle String
            if (fieldSchema.type === "string") {
                if (key.toLowerCase().includes("description") || fieldSchema.format === "textarea") {
                    return (
                        <div key={path.join(".")} className={cn("space-y-2 md:col-span-2 rounded-md", vRing(path))}>
                            <Label htmlFor={path.join(".")}>{label}</Label>
                            <Textarea
                                id={path.join(".")}
                                value={value ?? ""}
                                onChange={(e) => handleFieldChange(path, e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                            {vMsg(path)}
                        </div>
                    );
                }
                return (
                    <div key={path.join(".")} className={cn("space-y-2 rounded-md", vRing(path))}>
                        <Label htmlFor={path.join(".")}>{label}</Label>
                        <Input
                            id={path.join(".")}
                            value={value ?? ""}
                            onChange={(e) => handleFieldChange(path, e.target.value)}
                        />
                        {vMsg(path)}
                    </div>
                );
            }

            // Handle Number/Integer
            if (fieldSchema.type === "number" || fieldSchema.type === "integer") {
                const min = fieldSchema.minimum;
                const max = fieldSchema.maximum;
                return (
                    <div key={path.join(".")} className={cn("space-y-2 rounded-md", vRing(path))}>
                        <div className="flex justify-between">
                            <Label htmlFor={path.join(".")}>{label}</Label>
                            {(min !== undefined || max !== undefined) && (
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                    {min !== undefined ? `Min: ${min}` : ""} {max !== undefined ? `Max: ${max}` : ""}
                                </span>
                            )}
                        </div>
                        <Input
                            id={path.join(".")}
                            type="number"
                            min={min}
                            max={max}
                            value={value ?? ""}
                            onChange={(e) => {
                                const rawVal = e.target.value;
                                if (rawVal === "") {
                                    handleFieldChange(path, undefined);
                                    return;
                                }
                                let val = fieldSchema.type === "integer" ? parseInt(rawVal) : parseFloat(rawVal);
                                if (!isNaN(val)) {
                                    if (min !== undefined && val < min) val = min;
                                    if (max !== undefined && val > max) val = max;
                                    handleFieldChange(path, val);
                                }
                            }}
                        />
                        {vMsg(path)}
                    </div>
                );
            }

            // Handle Boolean
            if (fieldSchema.type === "boolean") {
                const isIsBlockField = path.length === 1 && path[0] === "isBlock";
                return (
                    <div
                        key={path.join(".")}
                        className={cn(
                            "flex items-center justify-between py-2 px-3 border rounded-md bg-muted/5",
                            vBorderColor(path),
                        )}
                    >
                        <Label htmlFor={path.join(".")} className="cursor-pointer">
                            {label}
                        </Label>
                        <Switch
                            id={path.join(".")}
                            checked={!!value}
                            onCheckedChange={isIsBlockField ? handleIsBlockChange : (checked) => handleFieldChange(path, checked)}
                        />
                    </div>
                );
            }

            // Handle Array of Objects
            if (fieldSchema.type === "array" && fieldSchema.items?.type === "object" && fieldSchema.items?.properties) {
                const arrayItems: any[] = Array.isArray(value) ? value : [];
                const itemSchema = fieldSchema.items;

                const handleAddItem = () => {
                    handleFieldChange(path, [...arrayItems, {}]);
                };

                const handleRemoveItem = (index: number) => {
                    handleFieldChange(
                        path,
                        arrayItems.filter((_, i) => i !== index),
                    );
                };

                return (
                    <div key={path.join(".")} className="space-y-3 md:col-span-2">
                        <div className="flex items-center gap-3">
                            <h4 className="font-bold text-sm text-primary uppercase tracking-wider">{label}</h4>
                            <div className="h-px flex-1 bg-muted" />
                            {vMsgInline(path)}
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs gap-1"
                                onClick={handleAddItem}
                            >
                                <Plus className="h-3 w-3" />
                                Add
                            </Button>
                        </div>
                        {arrayItems.length === 0 && (
                            <p className="text-xs text-muted-foreground italic px-1">No entries yet — click Add to create one.</p>
                        )}
                        <div className="space-y-3">
                            {arrayItems.map((item: any, index: number) => {
                                const itemPath = [...path, index];
                                const itemErr = getChildErr(itemPath);
                                return (
                                    <div
                                        key={index}
                                        className={cn(
                                            "p-3 border-2 rounded-lg bg-card shadow-sm space-y-4",
                                            itemErr
                                                ? itemErr.severity === "error"
                                                    ? "border-red-500/70"
                                                    : "border-yellow-400/70"
                                                : "border-muted",
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                {label} #{index + 1}
                                            </span>
                                            {itemErr && (
                                                <span
                                                    className={cn(
                                                        "text-xs flex-1",
                                                        itemErr.severity === "error" ? "text-red-400" : "text-yellow-500/90",
                                                    )}
                                                >
                                                    {itemErr.message}
                                                </span>
                                            )}
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveItem(index)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {renderRecursiveFields(itemSchema.properties, itemPath, item)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            }

            // Handle Object (Recursive)
            if (fieldSchema.type === "object" && fieldSchema.properties) {
                return (
                    <div
                        key={path.join(".")}
                        className={cn(
                            "space-y-4 p-4 border-2 rounded-lg bg-card shadow-sm md:col-span-2",
                            vBorderColor(path, /* useChildScan */ true),
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-primary uppercase tracking-wider">{label}</h4>
                            <div className="h-px flex-1 bg-muted" />
                            {vMsgInline(path, /* useChildScan */ true)}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderRecursiveFields(fieldSchema.properties, path, value)}
                        </div>
                    </div>
                );
            }

            // Fallback for complex types not handled explicitly
            if (fieldSchema.type === "array" || fieldSchema.type === "object") {
                return (
                    <div key={path.join(".")} className={cn("space-y-2 md:col-span-2 rounded-md", vRing(path))}>
                        <Label htmlFor={path.join(".")}>{label} (JSON)</Label>
                        <Textarea
                            id={path.join(".")}
                            className="font-mono text-xs h-24 bg-muted/20"
                            value={value ? JSON.stringify(value, null, 2) : ""}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleFieldChange(path, parsed);
                                } catch {
                                    // Ignore invalid JSON while typing
                                }
                            }}
                        />
                        {vMsg(path)}
                    </div>
                );
            }

            return null;
        });
    };

    // Only show the relevant conditional section based on isBlock.
    // isBlock === true  → show "block", hide "item"
    // isBlock === false → show "item",  hide "block"
    const visibleItemProperties = useMemo(() => {
        const filtered = { ...itemProperties } as Record<string, any>;
        if (data.isBlock === true) {
            delete filtered.item;
        } else {
            delete filtered.block;
        }
        return filtered;
    }, [data.isBlock]);

    const deletedSectionLabel = pendingIsBlock === true ? "Item" : "Block";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderRecursiveFields(visibleItemProperties, [], data)}</div>

            <Dialog
                open={pendingIsBlock !== null}
                onOpenChange={(open) => {
                    if (!open) cancelIsBlockChange();
                }}
            >
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>Discard {deletedSectionLabel} properties?</DialogTitle>
                        <DialogDescription>
                            Switching this item to a <strong>{pendingIsBlock ? "block" : "non-block"}</strong> will permanently
                            delete all data currently stored in the <strong>{deletedSectionLabel}</strong> section. This cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelIsBlockChange}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmIsBlockChange}>
                            Discard &amp; Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
