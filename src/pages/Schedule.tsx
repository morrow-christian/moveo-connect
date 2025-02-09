import { AppSidebar } from "@/components/AppSidebar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { AppLayout } from "@/components/AppLayout"

async function fetchMoves() {
  const { data, error } = await supabase
    .from("moves")
    .select(`
      *,
      clients (
        first_name,
        last_name
      )
    `)
    .order("start_date", { ascending: true })

  if (error) {
    throw error
  }

  return data
}

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  
  const { data: moves, isLoading, error } = useQuery({
    queryKey: ["moves"],
    queryFn: fetchMoves,
  })

  useEffect(() => {
    if (error) {
      toast.error("Failed to load moves")
    }
  }, [error])

  return (
    <AppLayout>
      <div className="p-8">
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
                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading moves...</p>
                ) : moves && moves.length > 0 ? (
                  moves.map((move) => (
                    <div
                      key={move.id}
                      className="rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div className="font-medium">
                        {move.clients.first_name} {move.clients.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(move.start_date), "PPP")}
                      </div>
                      <div className="text-sm text-gray-500">{move.move_type}</div>
                      <div className="text-sm text-gray-500">
                        {move.from_address}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No moves scheduled</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
