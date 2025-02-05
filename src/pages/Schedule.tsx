import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useState } from "react"

// Temporary mock data
const upcomingMoves = [
  {
    id: 1,
    clientName: "John Smith",
    date: "2024-03-15",
    type: "Move Out",
    address: "123 Main St, Anytown, USA",
  },
  {
    id: 2,
    clientName: "Sarah Johnson",
    date: "2024-03-20",
    type: "Move In",
    address: "456 Oak Ave, Somewhere, USA",
  },
]

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500">Manage moves and appointments</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMoves.map((move) => (
                  <div
                    key={move.id}
                    className="rounded-lg border p-4 hover:bg-gray-50"
                  >
                    <div className="font-medium">{move.clientName}</div>
                    <div className="text-sm text-gray-500">{move.date}</div>
                    <div className="text-sm text-gray-500">{move.type}</div>
                    <div className="text-sm text-gray-500">{move.address}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}