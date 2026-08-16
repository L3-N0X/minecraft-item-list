import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import { ListView } from './views/ListView'
import { EditorView } from './views/EditorView'
import { BulkEditorView } from './views/BulkEditorView'
import { HomeView } from './views/HomeView'
import { ImpressumView } from './views/ImpressumView'
import { Button } from '@/components/ui/button'
import { ThemeProvider } from './components/theme-provider'
import { ThemeToggle } from './components/ThemeToggle'
import { Link } from 'react-router-dom'
import './index.css'
import {
    DownloadIcon,
    GridFourIcon,
    ListIcon,
    ListMagnifyingGlassIcon,
    MagnifyingGlassIcon,
} from '@phosphor-icons/react'
import { cn, getAssetPath } from './lib/utils'
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

import { VersionSelect } from './components/VersionSelect'

function Layout({ children }: { children: React.ReactNode }) {
    const { isStaticMode, activeVersion } = useData()
    const location = useLocation()

    const downloadJson = () => {
        if (isStaticMode) {
            window.location.href = getAssetPath(
                `/data/versions/${activeVersion}/items.json`
            )
        } else {
            window.location.href = `/api/items/download?version=${activeVersion}`
        }
    }

    const isActive = (path: string) => location.pathname === path

    const navLinks = [
        {
            to: '/',
            label: 'Search',
            icon: MagnifyingGlassIcon,
            show: true,
        },
        {
            to: '/list',
            label: 'List',
            icon: ListIcon,
            show: !isStaticMode,
        },
        {
            to: '/bulk',
            label: isStaticMode ? 'Custom List' : 'Bulk Editor',
            icon: isStaticMode ? ListMagnifyingGlassIcon : GridFourIcon,
            show: true,
        },
    ]

    return (
        <div className="min-h-screen text-foreground pb-20">
            <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                        <ListIcon className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-72">
                                    <SheetHeader className="mb-6">
                                        <SheetTitle className="flex items-center gap-2">
                                            <img
                                                src={getAssetPath(
                                                    '/items/green_terracotta.png'
                                                )}
                                                alt="Logo"
                                                className="h-6 w-6"
                                            />
                                            Minecraft Item List
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-4 p-4">
                                        <VersionSelect className="w-full" />
                                        <div className="flex flex-col gap-2">
                                            {navLinks
                                                .filter((link) => link.show)
                                                .map((link) => (
                                                    <SheetClose
                                                        asChild
                                                        key={link.to}
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                            className={cn(
                                                                'justify-start h-11 px-4',
                                                                isActive(link.to) &&
                                                                    'bg-primary/10 text-primary hover:bg-primary/20'
                                                            )}
                                                        >
                                                            <Link
                                                                to={link.to}
                                                                className="flex items-center gap-3"
                                                            >
                                                                <link.icon className="h-5 w-5" />
                                                                {link.label}
                                                            </Link>
                                                        </Button>
                                                    </SheetClose>
                                                ))}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <Link to="/" className="flex items-center gap-2.5">
                            <img
                                src={getAssetPath(
                                    '/items/green_terracotta.png'
                                )}
                                alt="Logo"
                                className="h-7 w-7 mt-0.5"
                            />
                            <p className="font-black text-xl md:text-2xl tracking-tight">
                                <span className="hidden sm:inline">
                                    Minecraft Item List
                                </span>
                                <span className="sm:hidden">MC List</span>
                            </p>
                        </Link>
                        <div className="hidden md:flex items-center gap-4">
                            {navLinks
                                .filter((link) => link.show)
                                .map((link) => (
                                    <Button
                                        key={link.to}
                                        variant="ghost"
                                        size="sm"
                                        asChild
                                        className={cn(
                                            'px-3 h-9',
                                            isActive(link.to) &&
                                                'bg-primary/6 text-primary hover:bg-primary/20'
                                        )}
                                    >
                                        <Link
                                            to={link.to}
                                            className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                                        >
                                            <link.icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    </Button>
                                ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <VersionSelect className="hidden sm:flex" />
                        <ThemeToggle />
                        <Button
                            variant="default"
                            size="sm"
                            onClick={downloadJson}
                            className="h-8 md:h-9 px-2 md:px-4"
                        >
                            <DownloadIcon className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">
                                Download List
                            </span>
                        </Button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-4 md:p-2">{children}</main>
        </div>
    )
}

export function App() {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <DataProvider>
                <BrowserRouter basename={import.meta.env.BASE_URL}>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<HomeView />} />
                            <Route path="/list" element={<ListView />} />
                            <Route path="/edit/:id" element={<EditorView />} />
                            <Route path="/bulk" element={<BulkEditorView />} />
                            <Route
                                path="/impressum"
                                element={<ImpressumView />}
                            />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </DataProvider>
        </ThemeProvider>
    )
}

export default App
