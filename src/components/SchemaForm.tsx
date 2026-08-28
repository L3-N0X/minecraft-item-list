import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { resolveSchema, isQuantitySpec, getLabel } from './schemaUtils'
import {
    validateItemData,
    validationRingClass,
    getItemSchema,
} from './schemaValidation'
import { useData } from '../context/DataContext'
import type { ValidationEntry, ValidationMap } from './schemaValidation'
import {
    EnumSelect,
    MultiEnumSelect,
    QuantitySpecField,
    StringField,
    NumberField,
    BooleanField,
    ArrayField,
    ObjectField,
} from './schema-fields'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type {
    JsonSchemaProperty,
    SchemaPropertyValue,
    ItemData,
} from './schema-types'

interface SchemaFormProps {
    data: ItemData
    onChange: (newData: ItemData) => void
}

// ---------------------------------------------------------------------------
// SchemaForm
// ---------------------------------------------------------------------------

export function SchemaForm({ data, onChange }: SchemaFormProps) {
    const { schema: activeSchema, structureToChest } = useData()

    const currentItemSchema = useMemo(
        () => getItemSchema(activeSchema),
        [activeSchema]
    )
    const itemProperties = currentItemSchema.properties || {}

    const [pendingIsBlock, setPendingIsBlock] = useState<boolean | null>(null)

    // -----------------------------------------------------------------------
    // Data mutation
    // -----------------------------------------------------------------------

    const handleFieldChange = (
        path: (string | number)[],
        value?: SchemaPropertyValue
    ) => {
        const newData = JSON.parse(JSON.stringify(data)) as ItemData
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let current: any = newData
        for (let i = 0; i < path.length - 1; i++) {
            const segment = path[i] as string | number
            const nextSegment = path[i + 1]
            if (current[segment] === undefined || current[segment] === null) {
                current[segment] = typeof nextSegment === 'number' ? [] : {}
            }
            current = current[segment]
        }

        const lastKey = path[path.length - 1] as string
        if (value === undefined || value === null || value === '') {
            if (Array.isArray(current)) {
                current.splice(Number(lastKey), 1)
            } else {
                delete current[lastKey]
            }
        } else {
            current[lastKey] = value
        }

        if (path.length === 1 && path[0] === 'isBlock') {
            if (value === true) {
                delete newData.item
            } else {
                delete newData.block
            }
        }

        onChange(newData)
    }

    /**
     * Called when the isBlock switch is toggled. If the section that would be
     * deleted already has data, show a confirmation dialog first. Otherwise
     * apply the change immediately.
     */
    const handleIsBlockChange = (checked: boolean) => {
        const sectionToDelete = checked ? 'item' : 'block'
        const sectionData = data?.[sectionToDelete]
        const hasExistingData =
            sectionData &&
            typeof sectionData === 'object' &&
            !Array.isArray(sectionData) &&
            Object.keys(sectionData).length > 0

        if (hasExistingData) {
            setPendingIsBlock(checked)
        } else {
            handleFieldChange(['isBlock'], checked)
        }
    }

    const confirmIsBlockChange = () => {
        if (pendingIsBlock !== null) {
            handleFieldChange(['isBlock'], pendingIsBlock)
            setPendingIsBlock(null)
        }
    }

    const cancelIsBlockChange = () => {
        setPendingIsBlock(null)
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    const validationErrors: ValidationMap = useMemo(
        () => validateItemData(data, undefined, activeSchema),
        [data, activeSchema]
    )

    /** Direct error at exactly this path. */
    const getErr = (p: (string | number)[]): ValidationEntry | undefined =>
        validationErrors.get(p.join('.'))

    /**
     * Highest-severity error at OR below this path.
     * Used for container components so they light up when any child has an issue.
     */
    const getChildErr = (
        p: (string | number)[]
    ): ValidationEntry | undefined => {
        const prefix = p.join('.')
        let result: ValidationEntry | undefined
        for (const [k, v] of validationErrors.entries()) {
            if (k === prefix || k.startsWith(prefix + '.')) {
                if (!result || v.severity === 'error') {
                    result = v
                    if (v.severity === 'error') break
                }
            }
        }
        return result
    }

    // -----------------------------------------------------------------------
    // Recursive field renderer
    // -----------------------------------------------------------------------

    const renderRecursiveFields = (
        properties: Record<string, JsonSchemaProperty> | undefined,
        currentPath: (string | number)[],
        currentData: ItemData | undefined,
        parentRequired?: string[]
    ): React.ReactNode => {
        if (!properties) return null
        return Object.entries(properties).map(([key, rawFieldSchema]) => {
            const path: (string | number)[] = [...currentPath, key]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const value = currentData ? (currentData as any)[key] : undefined
            const fieldSchema = resolveSchema(rawFieldSchema, activeSchema)
            const label = getLabel(key, fieldSchema)
            // A field is optional when the parent schema explicitly lists required
            // fields and this key is absent from that list.
            const isOptional =
                parentRequired !== undefined && !parentRequired.includes(key)

            // Enum (single-select)
            if (fieldSchema.enum) {
                let options = fieldSchema.enum as string[]

                // Custom filtering for chests based on selected structure
                // path: ['obtaining', 'generatedLoot', 'structures', structIdx, 'chests', chestIdx, 'chestName']
                if (
                    path[0] === 'obtaining' &&
                    path[1] === 'generatedLoot' &&
                    path[2] === 'structures' &&
                    path[4] === 'chests' &&
                    path[6] === 'chestName'
                ) {
                    const structIdx = path[3] as number
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const obtaining = data.obtaining as any
                    const selectedStructure = obtaining?.generatedLoot
                        ?.structures?.[structIdx]?.structure as
                        string | undefined
                    if (
                        selectedStructure &&
                        structureToChest[selectedStructure]
                    ) {
                        const allowedChests =
                            structureToChest[selectedStructure]
                        options = options.filter((opt) =>
                            allowedChests.includes(opt)
                        )
                    }
                }

                return (
                    <div key={path.join('.')}>
                        <EnumSelect
                            label={label}
                            options={options}
                            value={(value as string) || ''}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={validationRingClass(getErr(path))}
                        />
                        {getErr(path) && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${
                                    getErr(path)!.severity === 'error'
                                        ? 'text-red-400'
                                        : 'text-yellow-500/90'
                                }`}
                            >
                                {getErr(path)!.message}
                            </p>
                        )}
                    </div>
                )
            }

            // QuantitySpec (fixed integer or {min, max} range)
            if (isQuantitySpec(fieldSchema)) {
                const err = getErr(path)
                return (
                    <div key={path.join('.')}>
                        <QuantitySpecField
                            label={label}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            value={value as any}
                            onChange={(val) => handleFieldChange(path, val)}
                            validationEntry={err}
                        />
                        {err && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${
                                    err.severity === 'error'
                                        ? 'text-red-400'
                                        : 'text-yellow-500/90'
                                }`}
                            >
                                {err.message}
                            </p>
                        )}
                    </div>
                )
            }

            // Array of enums (multi-select)
            if (fieldSchema.type === 'array' && fieldSchema.items?.enum) {
                const options = [...(fieldSchema.items.enum as string[])].sort()
                const err = getErr(path)
                return (
                    <div key={path.join('.')} className="md:col-span-2">
                        <MultiEnumSelect
                            label={label}
                            options={options}
                            value={(value as string[]) || []}
                            onChange={(val) => handleFieldChange(path, val)}
                            triggerClassName={validationRingClass(err)}
                        />
                        {err && (
                            <p
                                className={`text-[11px] leading-tight mt-1 ${
                                    err.severity === 'error'
                                        ? 'text-red-400'
                                        : 'text-yellow-500/90'
                                }`}
                            >
                                {err.message}
                            </p>
                        )}
                    </div>
                )
            }

            // String
            if (fieldSchema.type === 'string') {
                return (
                    <StringField
                        key={path.join('.')}
                        path={path}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={value as any}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                    />
                )
            }

            // Number / Integer
            if (
                fieldSchema.type === 'number' ||
                fieldSchema.type === 'integer'
            ) {
                return (
                    <NumberField
                        key={path.join('.')}
                        path={path}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={value as any}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                    />
                )
            }

            // Boolean
            if (fieldSchema.type === 'boolean') {
                const isIsBlockField =
                    path.length === 1 && path[0] === 'isBlock'
                return (
                    <BooleanField
                        key={path.join('.')}
                        path={path}
                        value={value as boolean}
                        label={label}
                        onCheckedChange={
                            isIsBlockField
                                ? handleIsBlockChange
                                : (checked) => handleFieldChange(path, checked)
                        }
                        validationEntry={getErr(path)}
                    />
                )
            }

            // Array of objects
            if (
                fieldSchema.type === 'array' &&
                fieldSchema.items?.type === 'object' &&
                fieldSchema.items?.properties
            ) {
                return (
                    <ArrayField
                        key={path.join('.')}
                        path={path}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        value={value as any[]}
                        label={label}
                        fieldSchema={fieldSchema}
                        onFieldChange={handleFieldChange}
                        validationEntry={getErr(path)}
                        getChildErr={getChildErr}
                        renderChildren={renderRecursiveFields}
                    />
                )
            }

            // Object (recursive)
            if (fieldSchema.type === 'object' && fieldSchema.properties) {
                return (
                    <ObjectField
                        key={path.join('.')}
                        path={path}
                        value={value as ItemData}
                        label={label}
                        fieldSchema={fieldSchema}
                        isOptional={isOptional}
                        onFieldChange={handleFieldChange}
                        childValidationEntry={getChildErr(path)}
                        renderChildren={renderRecursiveFields}
                    />
                )
            }

            return null
        })
    }

    // -----------------------------------------------------------------------
    // Visible properties (hide the irrelevant block/item section)
    // -----------------------------------------------------------------------

    const visibleItemProperties = useMemo(() => {
        const filtered = { ...itemProperties } as Record<
            string,
            JsonSchemaProperty
        >
        if (data.isBlock === true) {
            delete filtered.item
        } else {
            delete filtered.block
        }
        return filtered
    }, [data.isBlock])

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------

    const deletedSectionLabel = pendingIsBlock === true ? 'Item' : 'Block'

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderRecursiveFields(
                    visibleItemProperties,
                    [],
                    data,
                    currentItemSchema.required as string[]
                )}
            </div>

            {/* Floating validation issue counter */}
            <div
                className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
                    validationErrors.size > 0
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-90 pointer-events-none'
                }`}
            >
                <div className="flex items-center gap-1.5 bg-red-500 text-white rounded-full pl-3 pr-4 py-2 shadow-lg shadow-red-900/40 text-sm font-semibold select-none cursor-default">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 shrink-0"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <span>
                        {validationErrors.size}{' '}
                        {validationErrors.size === 1 ? 'issue' : 'issues'}
                    </span>
                </div>
            </div>

            <Dialog
                open={pendingIsBlock !== null}
                onOpenChange={(open) => {
                    if (!open) cancelIsBlockChange()
                }}
            >
                <DialogContent showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle>
                            Discard {deletedSectionLabel} properties?
                        </DialogTitle>
                        <DialogDescription>
                            Switching this item to a{' '}
                            <strong>
                                {pendingIsBlock ? 'block' : 'non-block'}
                            </strong>{' '}
                            will permanently delete all data currently stored in
                            the <strong>{deletedSectionLabel}</strong> section.
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={cancelIsBlockChange}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmIsBlockChange}
                        >
                            Discard &amp; Switch
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
