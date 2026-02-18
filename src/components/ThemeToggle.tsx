"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-[40px] h-9" />
  }

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[40px] px-0 justify-center border-none shadow-none focus:ring-0 [&>svg:last-child]:hidden">
        <div className="relative h-4 w-4 flex items-center justify-center">
          <Sun 
            className="h-full w-full rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" 
            weight="bold"
          />
          <Moon 
            className="absolute top-0 h-full w-full rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" 
            weight="bold"
          />
        </div>
        <span className="sr-only">Toggle theme</span>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun size={16} />
            <span>Light</span>
          </div>
        </SelectItem>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon size={16} />
            <span>Dark</span>
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Monitor size={16} />
            <span>System</span>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
