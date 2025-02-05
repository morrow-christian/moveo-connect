import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import Index from "@/pages/Index"
import NotFound from "@/pages/NotFound"
import AddClient from "@/pages/AddClient"
import Clients from "@/pages/Clients"
import { SidebarProvider } from "@/components/ui/sidebar"

function App() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/add-client" element={<AddClient />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </div>
    </SidebarProvider>
  )
}

export default App