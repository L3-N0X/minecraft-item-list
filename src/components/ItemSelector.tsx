import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useData } from "@/context/DataContext"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ItemSelectorProps {
  items: string[]
  onSelect: (item: string) => void
  selectedItem?: string
}

export function ItemSelector({ items: itemIds, onSelect, selectedItem }: ItemSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const { items } = useData()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-mono"
        >
          {selectedItem
            ? selectedItem
            : "Select item..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search item..." />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {itemIds.map((id) => (
                <CommandItem
                  key={id}
                  value={id + " " + (items[id]?.displayName || "")}
                  onSelect={() => {
                    onSelect(id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedItem === id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{items[id]?.displayName}</span>
                    <span className="text-xs text-muted-foreground font-mono">{id}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
