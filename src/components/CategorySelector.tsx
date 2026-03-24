import * as React from 'react'
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react'
import { useData } from '@/context/DataContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'

interface CategorySelectorProps {
    selectedCategories: string[]
    onChange: (categories: string[]) => void
}

export function CategorySelector({
    selectedCategories,
    onChange,
}: CategorySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')
    const { categories } = useData()
    const categoryNames = Object.keys(categories).sort()

    const handleUnselect = (category: string) => {
        onChange(selectedCategories.filter((c) => c !== category))
    }

    const handleSelect = (category: string) => {
        if (selectedCategories.includes(category)) {
            handleUnselect(category)
        } else {
            onChange([...selectedCategories, category])
        }
        setOpen(false)
    }

    const handleAddNew = () => {
        const newCategory = inputValue.trim()
        if (newCategory && !categoryNames.includes(newCategory)) {
            onChange([...selectedCategories, newCategory])
            setOpen(false)
            setInputValue('')
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
                {selectedCategories.map((category) => (
                    <Badge
                        key={category}
                        variant="secondary"
                        className="flex items-center gap-1"
                    >
                        {category}
                        <button
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUnselect(category)
                                }
                            }}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                            }}
                            onClick={() => handleUnselect(category)}
                        >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Badge>
                ))}
                {selectedCategories.length === 0 && (
                    <span className="text-sm text-muted-foreground">
                        No categories selected
                    </span>
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        Select categories...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                    <Command>
                        <CommandInput
                            placeholder="Search or create category..."
                            value={inputValue}
                            onValueChange={setInputValue}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-left"
                                    onClick={handleAddNew}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create "{inputValue}"
                                </Button>
                            </CommandEmpty>
                            {inputValue.trim() &&
                                !categoryNames.includes(inputValue.trim()) && (
                                    <>
                                        <CommandGroup>
                                            <CommandItem
                                                onSelect={handleAddNew}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Create "{inputValue.trim()}"
                                            </CommandItem>
                                        </CommandGroup>
                                        <CommandSeparator />
                                    </>
                                )}
                            <CommandGroup>
                                {categoryNames.map((category) => (
                                    <CommandItem
                                        key={category}
                                        onSelect={() => handleSelect(category)}
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4',
                                                selectedCategories.includes(
                                                    category
                                                )
                                                    ? 'opacity-100'
                                                    : 'opacity-0'
                                            )}
                                        />
                                        {category}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
