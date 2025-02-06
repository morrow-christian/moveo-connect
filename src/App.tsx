import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"
import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import Index from "@/pages/Index"
import NotFound from "@/pages/NotFound"
import AddClient from "@/pages/AddClient"
import Clients from "@/pages/Clients"
import Schedule from "@/pages/Schedule"
import Auth from "@/pages/Auth"
import { SidebarProvider } from "@/components/ui/sidebar"

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return null // or a loading spinner
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                session ? (
                  <Index />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/clients"
              element={
                session ? (
                  <Clients />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/add-client"
              element={
                session ? (
                  <AddClient />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/schedule"
              element={
                session ? (
                  <Schedule />
                ) : (
                  <Navigate to="/auth" replace />
                )
              }
            />
            <Route
              path="/auth"
              element={
                !session ? (
                  <Auth />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </div>
    </SidebarProvider>
  )
}

export default App