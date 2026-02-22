import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiEnumSelectProps {
    label: string;
    options: string[];
    value: string[];
    onChange: (val: string[] | undefined) => void;
    triggerClassName?: string;
}

export function MultiEnumSelect({ label, options, value, onChange, triggerClassName }: MultiEnumSelectProps) {
    const [open, setOpen] = useState(false);
    const selectedValues = Array.isArray(value) ? value : [];

    const handleUnselect = (item: string) => {
        const next = selectedValues.filter((i) => i !== item);
        onChange(next.length > 0 ? next : undefined);
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
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn("w-full justify-between h-9 px-3", triggerClassName)}
                    >
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
