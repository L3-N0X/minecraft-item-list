import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { DataProvider, useData } from "./context/DataContext"
import { ListView } from "./views/ListView"
import { EditorView } from "./views/EditorView"
import { Button } from "@/components/ui/button"
import { Download, Copy } from "lucide-react"
import { ThemeProvider } from "./components/theme-provider"
import { ThemeToggle } from "./components/ThemeToggle"
import "./index.css"

function Layout({ children }: { children: React.ReactNode }) {
  const { items } = useData()
  
  const downloadJson = () => {
    window.location.href = "/api/items/download"
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(items, null, 2))
    alert("Full items.json copied to clipboard!")
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = "/"}>
            <span className="font-bold text-xl tracking-tight">MC Item List</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="default" size="sm" onClick={downloadJson}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>

      <footer className="fixed bottom-0 w-full border-t bg-background/80 backdrop-blur-sm p-3 text-center text-xs text-muted-foreground">
        <p>Changes are automatically saved to the server.</p>
      </footer>
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
              <Route path="/" element={<ListView />} />
              <Route path="/edit/:id" element={<EditorView />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </DataProvider>
    </ThemeProvider>
  )
}

export default App
