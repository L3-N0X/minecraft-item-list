import React from "react";
import { cn } from "@/lib/utils";
import { validationBorderColorClass } from "../schemaValidation";
import type { ValidationEntry } from "../schemaValidation";

export interface ObjectFieldProps {
    path: (string | number)[];
    value: any;
    label: string;
    fieldSchema: any;
    childValidationEntry?: ValidationEntry;
    renderChildren: (properties: any, currentPath: (string | number)[], currentData: any) => React.ReactNode;
}

export function ObjectField({ path, value, label, fieldSchema, childValidationEntry, renderChildren }: ObjectFieldProps) {
    const borderColor = validationBorderColorClass(childValidationEntry);

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
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderChildren(fieldSchema.properties, path, value)}</div>
        </div>
    );
}
