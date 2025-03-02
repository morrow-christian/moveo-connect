
import { Routes, Route, Navigate } from "react-router-dom"
import Index from "@/pages/Index"
import Clients from "@/pages/Clients"
import ClientDetails from "@/pages/ClientDetails"
import AddClient from "@/pages/AddClient"
import Schedule from "@/pages/Schedule"
import Settings from "@/pages/Settings"
import Auth from "@/pages/Auth"
import Subscribe from "@/pages/Subscribe"
import NotFound from "@/pages/NotFound"
import { Subscription } from "@/types/subscription"

interface AppRoutesProps {
  session: any | null
  subscription: Subscription | null
}

export function AppRoutes({ session, subscription }: AppRoutesProps) {
  // Render a different route if the user is not subscribed
  const renderProtectedRoute = (component: React.ReactNode) => {
    if (!session) {
      return <Navigate to="/auth" replace />
    }
    
    if (!subscription) {
      return <Navigate to="/subscribe" replace />
    }
    
    return component
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? (subscription ? <Index /> : <Navigate to="/subscribe" replace />) : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/clients"
        element={renderProtectedRoute(<Clients />)}
      />
      <Route
        path="/clients/:id"
        element={renderProtectedRoute(<ClientDetails />)}
      />
      <Route
        path="/add-client"
        element={renderProtectedRoute(<AddClient />)}
      />
      <Route
        path="/schedule"
        element={renderProtectedRoute(<Schedule />)}
      />
      <Route
        path="/settings"
        element={renderProtectedRoute(<Settings />)}
      />
      <Route
        path="/subscribe"
        element={
          session ? <Subscribe /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/auth"
        element={
          !session ? <Auth /> : <Navigate to="/" replace />
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
