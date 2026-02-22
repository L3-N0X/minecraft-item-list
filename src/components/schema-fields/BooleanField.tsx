import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { validationBorderColorClass } from "../schemaValidation";
import type { ValidationEntry } from "../schemaValidation";

export interface BooleanFieldProps {
    path: (string | number)[];
    value: any;
    label: string;
    onCheckedChange: (checked: boolean) => void;
    validationEntry?: ValidationEntry;
}

export function BooleanField({ path, value, label, onCheckedChange, validationEntry }: BooleanFieldProps) {
    const borderColor = validationBorderColorClass(validationEntry);
    const id = path.join(".");

    return (
        <div className={cn("flex items-center justify-between py-2 px-3 border rounded-md bg-muted/5", borderColor)}>
            <Label htmlFor={id} className="cursor-pointer">
                {label}
            </Label>
            <Switch id={id} checked={!!value} onCheckedChange={onCheckedChange} />
        </div>
    );
}
