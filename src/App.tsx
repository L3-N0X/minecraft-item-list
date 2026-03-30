import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { DataProvider, useData } from './context/DataContext'
import { ListView } from './views/ListView'
import { EditorView } from './views/EditorView'
import { BulkEditorView } from './views/BulkEditorView'
import { HomeView } from './views/HomeView'
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

function Layout({ children }: { children: React.ReactNode }) {
    const { isStaticMode } = useData()
    const location = useLocation()

    const downloadJson = () => {
        window.location.href = '/api/items/download'
    }

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="min-h-screen text-foreground pb-20">
            <nav className="border-b bg-background/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center gap-2">
                            <img
                                src="/logo.png"
                                alt="Logo"
                                className="h-6 w-6"
                            />
                            <span className="font-bold text-xl tracking-tight">
                                MC Item List
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center gap-4">
                            <Button
                                variant={isActive('/') ? 'secondary' : 'ghost'}
                                size="sm"
                                asChild
                                className="px-3 h-9"
                            >
                                <Link
                                    to="/"
                                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <MagnifyingGlassIcon className="h-5 w-5" />
                                    Search
                                </Link>
                            </Button>
                            {!isStaticMode && (
                                <Button
                                    variant={
                                        isActive('/list')
                                            ? 'secondary'
                                            : 'ghost'
                                    }
                                    size="sm"
                                    asChild
                                    className="px-3 h-9"
                                >
                                    <Link
                                        to="/list"
                                        className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        <ListIcon className="h-5 w-5" />
                                        List
                                    </Link>
                                </Button>
                            )}
                            <Button
                                variant={
                                    isActive('/bulk') ? 'secondary' : 'ghost'
                                }
                                size="sm"
                                asChild
                                className="px-3 h-9"
                            >
                                <Link
                                    to="/bulk"
                                    className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    {isStaticMode ? (
                                        <GridFourIcon className="h-5 w-5" />
                                    ) : (
                                        <ListMagnifyingGlassIcon className="h-5 w-5" />
                                    )}
                                    {isStaticMode
                                        ? 'Custom List'
                                        : 'Bulk Editor'}
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button
                            variant="default"
                            size="sm"
                            onClick={downloadJson}
                        >
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download List
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
                <BrowserRouter>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<HomeView />} />
                            <Route path="/list" element={<ListView />} />
                            <Route path="/edit/:id" element={<EditorView />} />
                            <Route path="/bulk" element={<BulkEditorView />} />
                        </Routes>
                    </Layout>
                </BrowserRouter>
            </DataProvider>
        </ThemeProvider>
    )
}

export default App
