
import { BrowserRouter as Router } from "react-router-dom"
import { Toaster } from "sonner"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthProvider } from "@/components/AuthProvider"
import { AppRoutes } from "@/components/AppRoutes"

function App() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AuthProvider>
          {(session, loading) => {
            if (loading) {
              return null // or a loading spinner
            }

            return (
              <Router>
                <AppRoutes session={session} />
                <Toaster />
              </Router>
            )
          }}
        </AuthProvider>
      </div>
    </SidebarProvider>
  )
}

export default App
