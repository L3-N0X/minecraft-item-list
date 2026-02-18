import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
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
}

function EnumSelect({ label, options, value, onChange }: EnumSelectProps) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value || ""} onValueChange={onChange}>
                <SelectTrigger className="w-full">
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
}

function MultiEnumSelect({ label, options, value, onChange }: MultiEnumSelectProps) {
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
                    <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-9 px-3">
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

export function SchemaForm({ data, onChange }: SchemaFormProps) {
    const itemProperties = (schema.additionalProperties as any).properties || {};

    const handleFieldChange = (path: string[], value: any) => {
        const newData = JSON.parse(JSON.stringify(data));
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        onChange(newData);
    };

    const renderRecursiveFields = (properties: any, currentPath: string[], currentData: any) => {
        return Object.entries(properties).map(([key, rawFieldSchema]: [string, any]) => {
            const path = [...currentPath, key];
            const value = currentData ? currentData[key] : undefined;
            const fieldSchema = resolveSchema(rawFieldSchema);
            const label = getLabel(key, fieldSchema);

            // Handle Enum (Single)
            if (fieldSchema.enum) {
                return (
                    <EnumSelect
                        key={path.join(".")}
                        label={label}
                        options={fieldSchema.enum}
                        value={value}
                        onChange={(val) => handleFieldChange(path, val)}
                    />
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
                        />
                    </div>
                );
            }

            // Handle String
            if (fieldSchema.type === "string") {
                if (key.toLowerCase().includes("description") || fieldSchema.format === "textarea") {
                    return (
                        <div key={path.join(".")} className="space-y-2 md:col-span-2">
                            <Label htmlFor={path.join(".")}>{label}</Label>
                            <Textarea
                                id={path.join(".")}
                                value={value ?? ""}
                                onChange={(e) => handleFieldChange(path, e.target.value)}
                                rows={3}
                                className="resize-none"
                            />
                        </div>
                    );
                }
                return (
                    <div key={path.join(".")} className="space-y-2">
                        <Label htmlFor={path.join(".")}>{label}</Label>
                        <Input
                            id={path.join(".")}
                            value={value ?? ""}
                            onChange={(e) => handleFieldChange(path, e.target.value)}
                        />
                    </div>
                );
            }

            // Handle Number/Integer
            if (fieldSchema.type === "number" || fieldSchema.type === "integer") {
                const min = fieldSchema.minimum;
                const max = fieldSchema.maximum;
                return (
                    <div key={path.join(".")} className="space-y-2">
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
                    </div>
                );
            }

            // Handle Boolean
            if (fieldSchema.type === "boolean") {
                return (
                    <div
                        key={path.join(".")}
                        className="flex items-center justify-between py-2 px-3 border rounded-md bg-muted/5"
                    >
                        <Label htmlFor={path.join(".")} className="cursor-pointer">
                            {label}
                        </Label>
                        <Switch
                            id={path.join(".")}
                            checked={!!value}
                            onCheckedChange={(checked) => handleFieldChange(path, checked)}
                        />
                    </div>
                );
            }

            // Handle Object (Recursive)
            if (fieldSchema.type === "object" && fieldSchema.properties) {
                return (
                    <div
                        key={path.join(".")}
                        className="space-y-4 p-4 border-2 border-muted rounded-lg bg-card shadow-sm md:col-span-2"
                    >
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-primary uppercase tracking-wider">{label}</h4>
                            <div className="h-px flex-1 bg-muted" />
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
                    <div key={path.join(".")} className="space-y-2 md:col-span-2">
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
                    </div>
                );
            }

            return null;
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{renderRecursiveFields(itemProperties, [], data)}</div>
        </div>
    );
}
