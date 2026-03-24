import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { validationBorderColorClass } from '../schemaValidation'
import type { ValidationEntry } from '../schemaValidation'
import type { SchemaPropertyValue } from '../schema-types'

export interface BooleanFieldProps {
    path: (string | number)[]
    value?: SchemaPropertyValue
    label: string
    onCheckedChange: (checked: boolean) => void
    validationEntry?: ValidationEntry
}

export function BooleanField({
    path,
    value,
    label,
    onCheckedChange,
    validationEntry,
}: BooleanFieldProps) {
    const borderColor = validationBorderColorClass(validationEntry)
    const id = path.join('.')

    const handleClick = () => {
        // If the property doesn't exist yet (undefined/null), the first click
        // only adds it as false. A second click will then switch it to true.
        if (value === undefined || value === null) {
            onCheckedChange(false)
        } else {
            onCheckedChange(!value)
        }
    }

    return (
        <div
            id={id}
            className={cn(
                'flex items-center justify-between py-2 px-3 border rounded-md bg-muted/5 cursor-pointer select-none',
                borderColor
            )}
            onClick={handleClick}
        >
            <Label className="cursor-pointer pointer-events-none">
                {label}
            </Label>
            <Switch checked={!!value} className="pointer-events-none" />
        </div>
    )
}
