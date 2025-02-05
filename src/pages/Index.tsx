import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { PlusCircle } from "lucide-react"

const Index = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Welcome to Moveo, your Senior Move Manager CRM</p>
          </div>
          <Button asChild>
            <Link to="/add-client" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Client
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Active Moves</h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Upcoming Moves</h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Total Clients</h3>
            <p className="text-3xl font-bold text-primary">0</p>
          </div>
        </div>

        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-gray-500 text-center py-8">
            No recent activity to display
          </div>
        </div>
      </main>
    </div>
  )
}

export default Index