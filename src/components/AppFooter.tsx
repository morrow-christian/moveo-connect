
import { Link } from "react-router-dom"

export function AppFooter() {
  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Moveo. All rights reserved.
          </p>
          <nav className="flex space-x-6">
            <Link to="/clients" className="text-sm text-gray-600 hover:text-gray-900">
              Clients
            </Link>
            <Link to="/schedule" className="text-sm text-gray-600 hover:text-gray-900">
              Schedule
            </Link>
            <Link to="/settings" className="text-sm text-gray-600 hover:text-gray-900">
              Settings
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
