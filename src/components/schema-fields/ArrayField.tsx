import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { validationBorderColorClass } from '../schemaValidation'
import type { ValidationEntry } from '../schemaValidation'
import type {
    JsonSchemaProperty,
    SchemaPropertyValue,
    ItemData,
} from '../schema-types'

export interface ArrayFieldProps {
    path: (string | number)[]
    value?: SchemaPropertyValue
    label: string
    fieldSchema: JsonSchemaProperty
    onFieldChange: (
        path: (string | number)[],
        value?: SchemaPropertyValue
    ) => void
    validationEntry?: ValidationEntry
    getChildErr: (path: (string | number)[]) => ValidationEntry | undefined
    renderChildren: (
        properties: Record<string, JsonSchemaProperty> | undefined,
        currentPath: (string | number)[],
        currentData: ItemData,
        parentRequired?: string[]
    ) => React.ReactNode
}

export function ArrayField({
    path,
    value,
    label,
    fieldSchema,
    onFieldChange,
    validationEntry,
    getChildErr,
    renderChildren,
}: ArrayFieldProps) {
    const arrayItems: SchemaPropertyValue[] = Array.isArray(value) ? value : []
    const itemFieldSchema = fieldSchema.items
    const itemParentRequired: string[] | undefined = Array.isArray(
        itemFieldSchema?.required
    )
        ? itemFieldSchema.required
        : undefined

    const handleAddItem = () => {
        onFieldChange(path, [...arrayItems, {}])
    }

    const handleRemoveItem = (index: number) => {
        const next = arrayItems.filter((_, i) => i !== index)
        onFieldChange(path, next.length > 0 ? next : undefined)
    }

    return (
        <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
                <h4 className="font-bold text-sm text-primary uppercase tracking-wider">
                    {label}
                </h4>
                <div className="h-px flex-1 bg-muted" />
                {validationEntry && (
                    <span
                        className={cn(
                            'text-xs font-normal',
                            validationEntry.severity === 'error'
                                ? 'text-red-400'
                                : 'text-yellow-500/90'
                        )}
                    >
                        {validationEntry.message}
                    </span>
                )}
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
                <p className="text-xs text-muted-foreground italic px-1">
                    No entries yet — click Add to create one.
                </p>
            )}
            <div className="space-y-3">
                {arrayItems.map((item, index) => {
                    const itemPath = [...path, index]
                    const itemErr = getChildErr(itemPath)
                    return (
                        <div
                            key={index}
                            className={cn(
                                'p-3 border-2 rounded-lg bg-card shadow-sm space-y-4',
                                validationBorderColorClass(itemErr)
                            )}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {label} #{index + 1}
                                </span>
                                {itemErr && (
                                    <span
                                        className={cn(
                                            'text-xs flex-1',
                                            itemErr.severity === 'error'
                                                ? 'text-red-400'
                                                : 'text-yellow-500/90'
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
                                {renderChildren(
                                    itemFieldSchema.properties,
                                    itemPath,
                                    (item as ItemData) ?? {},
                                    itemParentRequired
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
