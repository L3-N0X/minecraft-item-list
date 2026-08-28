import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { MOB_SPECIAL_REQUIREMENTS } from '../detailpanel/utils'

export interface EnumSelectProps {
    label: string
    options: (string | number)[]
    value: string | number
    onChange: (val: string) => void
    triggerClassName?: string
    isOptional?: boolean
}

function formatEnumOption(option: string | number): string {
    const str = String(option ?? '')
    if (MOB_SPECIAL_REQUIREMENTS[str]) {
        return MOB_SPECIAL_REQUIREMENTS[str].label
    }
    if (str.includes('_')) {
        return str
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
    }
    if (!str) return ''
    if (!isNaN(Number(str))) return str
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export function EnumSelect({
    label,
    options,
    value,
    onChange,
    triggerClassName,
    isOptional,
}: EnumSelectProps) {
    const strValue =
        value !== undefined && value !== null && value !== ''
            ? String(value)
            : isOptional
              ? '__none__'
              : ''

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select
                value={strValue}
                onValueChange={(val) => {
                    onChange(val === '__none__' ? '' : val)
                }}
            >
                <SelectTrigger className={cn('w-full', triggerClassName)}>
                    <SelectValue placeholder={`Select ${label}...`} />
                </SelectTrigger>
                <SelectContent>
                    {isOptional && (
                        <SelectItem
                            value="__none__"
                            className="text-muted-foreground italic"
                        >
                            None (default)
                        </SelectItem>
                    )}
                    {options.map((option) => {
                        const optStr = String(option)
                        return (
                            <SelectItem key={optStr} value={optStr}>
                                {formatEnumOption(option)}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>
        </div>
    )
}
