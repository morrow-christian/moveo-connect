
import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format } from "date-fns"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Move } from "@/types"
import { MoveDialog } from "@/components/moves/MoveDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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

  return data as Move[]
}

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const queryClient = useQueryClient()
  
  const { data: moves, isLoading, error } = useQuery({
    queryKey: ["moves"],
    queryFn: fetchMoves,
  })

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("moves").delete().eq("id", id)
      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ["moves"] })
      toast.success("Move deleted successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500">Manage moves and appointments</p>
          </div>
          <MoveDialog
            mode="create"
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            }
          />
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
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                    >
                      <div>
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
                      <div className="flex gap-2">
                        <MoveDialog
                          mode="edit"
                          move={move}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Move</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this move? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(move.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
