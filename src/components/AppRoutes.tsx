
import { Routes, Route, Navigate } from "react-router-dom"
import Index from "@/pages/Index"
import Clients from "@/pages/Clients"
import ClientDetails from "@/pages/ClientDetails"
import AddClient from "@/pages/AddClient"
import Schedule from "@/pages/Schedule"
import Settings from "@/pages/Settings"
import Auth from "@/pages/Auth"
import NotFound from "@/pages/NotFound"

interface AppRoutesProps {
  session: any | null
}

export function AppRoutes({ session }: AppRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          session ? <Index /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/clients"
        element={
          session ? <Clients /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/clients/:id"
        element={
          session ? <ClientDetails /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/add-client"
        element={
          session ? <AddClient /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/schedule"
        element={
          session ? <Schedule /> : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/settings"
        element={
          session ? <Settings /> : <Navigate to="/auth" replace />
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
