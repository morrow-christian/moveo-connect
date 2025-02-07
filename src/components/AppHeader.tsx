
import { Home, Users, Calendar, Settings } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export function AppHeader() {
  const location = useLocation()
  
  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link 
              to="/"
              className={`flex items-center space-x-2 ${isActive('/') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link 
              to="/clients"
              className={`flex items-center space-x-2 ${isActive('/clients') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Users className="h-5 w-5" />
              <span>Clients</span>
            </Link>
            <Link 
              to="/schedule"
              className={`flex items-center space-x-2 ${isActive('/schedule') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <Calendar className="h-5 w-5" />
              <span>Schedule</span>
            </Link>
          </div>
          <Link 
            to="/settings"
            className={`flex items-center space-x-2 ${isActive('/settings') ? 'text-primary' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
