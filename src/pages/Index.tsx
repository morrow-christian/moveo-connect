
import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { PlusCircle } from "lucide-react"
import { Card } from "@/components/ui/card"

const Index = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-lg text-gray-600">Welcome to Moveo, your Senior Move Manager CRM</p>
          </div>
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" asChild>
            <Link to="/add-client" className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add New Client
            </Link>
          </Button>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2">Active Moves</h3>
            <p className="text-4xl font-bold text-blue-600">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2">Upcoming Moves</h3>
            <p className="text-4xl font-bold text-blue-600">0</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-2">Total Clients</h3>
            <p className="text-4xl font-bold text-blue-600">0</p>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          <div className="text-gray-500 text-center py-8">
            No recent activity to display
          </div>
        </Card>
      </main>
    </div>
  )
}

export default Index
