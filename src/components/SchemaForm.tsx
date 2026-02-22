import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { resolveSchema, isQuantitySpec, getLabel } from "./schemaUtils";
import { validateItemData, validationRingClass, itemSchema } from "./schemaValidation";
import type { ValidationEntry, ValidationMap } from "./schemaValidation";
import {
    EnumSelect,
    MultiEnumSelect,
    QuantitySpecField,
    StringField,
    NumberField,
    BooleanField,
    ArrayField,
    ObjectField,
} from "./schema-fields";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SchemaFormProps {
    data: any;
    onChange: (newData: any) => void;
}

// ---------------------------------------------------------------------------
// SchemaForm
// ---------------------------------------------------------------------------

export function SchemaForm({ data, onChange }: SchemaFormProps) {
    const itemProperties = itemSchema.properties || {};

    const [pendingIsBlock, setPendingIsBlock] = useState<boolean | null>(null);

    // -----------------------------------------------------------------------
    // Data mutation
    // -----------------------------------------------------------------------

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

        const lastKey = path[path.length - 1] as string | number;
        if (value === undefined || value === null || value === "") {
            delete current[lastKey];
        } else {
            current[lastKey] = value;
        }

        // When isBlock is toggled, remove the now-irrelevant sub-object so
        // stale data doesn't cause phantom validation errors.
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

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    const validationErrors: ValidationMap = useMemo(() => validateItemData(data), [data]);

    /** Direct error at exactly this path. */
    const getErr = (p: (string | number)[]): ValidationEntry | undefined => validationErrors.get(p.join("."));

    /**
     * Highest-severity error at OR below this path.
     * Used for container components so they light up when any child has an issue.
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

    // -----------------------------------------------------------------------
    // Recursive field renderer
    // -----------------------------------------------------------------------

    const renderRecursiveFields = (
        properties: any,
        currentPath: (string | number)[],
        currentData: any,
        parentRequired?: string[],
    ): React.ReactNode => {
        return Object.entries(properties).map(([key, rawFieldSchema]: [string, any]) => {
            const path: (string | number)[] = [...currentPath, key];
            const value = currentData ? currentData[key] : undefined;
            const fieldSchema = resolveSchema(rawFieldSchema);
            const label = getLabel(key, fieldSchema);
            // A field is optional when the parent schema explicitly lists required
            // fields and this key is absent from that list.
            const isOptional = parentRequired !== undefined && !parentRequired.includes(key);

            // Enum (single-select)
            if (fieldSchema.enum) {
                return (
                    <div key={path.join(".")}>
                        <EnumSelect
                            label={label}
                            options={fieldSchema.enum}
                            value={value}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={validationRingClass(getErr(path))}
                        />
                        {getErr(path) && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${getErr(path)!.severity === "error" ? "text-red-400" : "text-yellow-500/90"}`}
                            >
                                {getErr(path)!.message}
                            </p>
                        )}
                    </div>
                );
            }

            // QuantitySpec (fixed integer or {min, max} range)
            if (isQuantitySpec(fieldSchema)) {
                const err = getErr(path);
                return (
                    <div key={path.join(".")}>
                        <QuantitySpecField
                            label={label}
                            value={value}
                            onChange={(val) => handleFieldChange(path, val)}
                            validationEntry={err}
                        />
                        {err && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${err.severity === "error" ? "text-red-400" : "text-yellow-500/90"}`}
                            >
                                {err.message}
                            </p>
                        )}
                    </div>
                );
            }

            // Array of enums (multi-select)
            if (fieldSchema.type === "array" && fieldSchema.items?.enum) {
                const options = [...(fieldSchema.items.enum || [])].sort();
                const err = getErr(path);
                return (
                    <div key={path.join(".")} className="md:col-span-2">
                        <MultiEnumSelect
                            label={label}
                            options={options}
                            value={value}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={validationRingClass(err)}
                        />
                        {err && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${err.severity === "error" ? "text-red-400" : "text-yellow-500/90"}`}
                            >
                                {err.message}
                            </p>
                        )}
                    </div>
                );
            }

            // String
            if (fieldSchema.type === "string") {
                return (
                    <StringField
                        key={path.join(".")}
                        path={path}
                        value={value}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                    />
                );
            }

            // Number / Integer
            if (fieldSchema.type === "number" || fieldSchema.type === "integer") {
                return (
                    <NumberField
                        key={path.join(".")}
                        path={path}
                        value={value}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                    />
                );
            }

            // Boolean
            if (fieldSchema.type === "boolean") {
                const isIsBlockField = path.length === 1 && path[0] === "isBlock";
                return (
                    <BooleanField
                        key={path.join(".")}
                        path={path}
                        value={value}
                        label={label}
                        onCheckedChange={isIsBlockField ? handleIsBlockChange : (checked) => handleFieldChange(path, checked)}
                        validationEntry={getErr(path)}
                    />
                );
            }

            // Array of objects
            if (fieldSchema.type === "array" && fieldSchema.items?.type === "object" && fieldSchema.items?.properties) {
                return (
                    <ArrayField
                        key={path.join(".")}
                        path={path}
                        value={value}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                        getChildErr={getChildErr}
                        renderChildren={renderRecursiveFields}
                    />
                );
            }

            // Object (recursive)
            if (fieldSchema.type === "object" && fieldSchema.properties) {
                return (
                    <ObjectField
                        key={path.join(".")}
                        path={path}
                        value={value}
                        label={label}
                        fieldSchema={fieldSchema}
                        isOptional={isOptional}
                        onFieldChange={handleFieldChange}
                        childValidationEntry={getChildErr(path)}
                        renderChildren={renderRecursiveFields}
                    />
                );
            }

            return null;
        });
    };

    // -----------------------------------------------------------------------
    // Visible properties (hide the irrelevant block/item section)
    // -----------------------------------------------------------------------

    const visibleItemProperties = useMemo(() => {
        const filtered = { ...itemProperties } as Record<string, any>;
        if (data.isBlock === true) {
            delete filtered.item;
        } else {
            delete filtered.block;
        }
        return filtered;
    }, [data.isBlock]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const deletedSectionLabel = pendingIsBlock === true ? "Item" : "Block";

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderRecursiveFields(visibleItemProperties, [], data, itemSchema.required as string[])}
            </div>

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
