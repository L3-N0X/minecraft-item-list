import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface QuantitySpecFieldProps {
    label: string;
    value: number | { min: number; max: number } | undefined;
    onChange: (val: number | { min: number; max: number } | undefined) => void;
}

export function QuantitySpecField({ label, value, onChange }: QuantitySpecFieldProps) {
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
