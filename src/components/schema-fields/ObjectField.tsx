import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { validationBorderColorClass, validationRingClass } from "../schemaValidation";
import type { ValidationEntry } from "../schemaValidation";

export interface ObjectFieldProps {
    path: (string | number)[];
    value: any;
    label: string;
    fieldSchema: any;
    isOptional?: boolean;
    onFieldChange?: (path: (string | number)[], value: any) => void;
    childValidationEntry?: ValidationEntry;
    renderChildren: (
        properties: any,
        currentPath: (string | number)[],
        currentData: any,
        parentRequired?: string[],
    ) => React.ReactNode;
}

export function ObjectField({
    path,
    value,
    label,
    fieldSchema,
    isOptional,
    onFieldChange,
    childValidationEntry,
    renderChildren,
}: ObjectFieldProps) {
    const borderColor = validationBorderColorClass(childValidationEntry);
    const parentRequired: string[] | undefined = Array.isArray(fieldSchema.required) ? fieldSchema.required : undefined;

    // Optional object that hasn't been added yet — show a compact "Add" row
    if (isOptional && (value === undefined || value === null)) {
        const hasError = !!childValidationEntry;
        const isError = childValidationEntry?.severity === "error";
        return (
            <div className="md:col-span-2 flex items-center gap-3 py-1">
                <span
                    className={cn(
                        "text-sm font-medium",
                        hasError ? (isError ? "text-red-400" : "text-yellow-500/90") : "text-muted-foreground",
                    )}
                >
                    {label}
                </span>
                <div className={cn("h-px flex-1", hasError ? (isError ? "bg-red-500/40" : "bg-yellow-400/40") : "bg-muted")} />
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className={cn("h-7 px-2 text-xs gap-1", validationRingClass(childValidationEntry))}
                    onClick={() => onFieldChange?.(path, {})}
                >
                    <Plus className="h-3 w-3" />
                    Add
                </Button>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4 p-4 border-2 rounded-lg bg-card shadow-sm md:col-span-2", borderColor)}>
            <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">{label}</h4>
                <div className="h-px flex-1 bg-muted" />
                {childValidationEntry && (
                    <span
                        className={cn(
                            "text-xs font-normal",
                            childValidationEntry.severity === "error" ? "text-red-400" : "text-yellow-500/90",
                        )}
                    >
                        {childValidationEntry.message}
                    </span>
                )}
                {isOptional && (
                    <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title={`Remove ${label}`}
                        onClick={() => onFieldChange?.(path, undefined)}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderChildren(fieldSchema.properties, path, value, parentRequired)}
            </div>
        </div>
    );
}
