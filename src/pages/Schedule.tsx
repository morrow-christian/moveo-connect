import { AppLayout } from "@/components/AppLayout"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Search, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { supabase } from "@/integrations/supabase/client"
import { format, isSameDay } from "date-fns"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type SortField = "date" | "name" | "type"
type SortOrder = "asc" | "desc"

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

  const moves = data as Move[]
  return moves
}

export default function Schedule() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [draggedMoveId, setDraggedMoveId] = useState<string | null>(null)
  
  const queryClient = useQueryClient()
  
  const { data: moves, isLoading } = useQuery({
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

  const handleDateChange = async (newDate: Date | undefined, moveId: string) => {
    if (!newDate || !moveId) return

    try {
      const { error } = await supabase
        .from("moves")
        .update({ start_date: newDate.toISOString() })
        .eq("id", moveId)

      if (error) throw error
      queryClient.invalidateQueries({ queryKey: ["moves"] })
      toast.success("Move date updated successfully")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const moveDates = useMemo(() => {
    return moves?.map(move => new Date(move.start_date)) || []
  }, [moves])

  const movesForSelectedDate = useMemo(() => {
    if (!date || !moves) return []
    return moves.filter(move => isSameDay(new Date(move.start_date), date))
  }, [date, moves])

  const filteredAndSortedMoves = moves
    ?.filter((move) => {
      const matchesSearch =
        searchQuery === "" ||
        move.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.move_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.clients.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        move.clients.last_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || move.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let compareResult = 0
      
      switch (sortField) {
        case "date":
          compareResult = new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          break
        case "name":
          compareResult = (a.clients.first_name + a.clients.last_name)
            .localeCompare(b.clients.first_name + b.clients.last_name)
          break
        case "type":
          compareResult = a.move_type.localeCompare(b.move_type)
          break
      }

      return sortOrder === "asc" ? compareResult : -compareResult
    })

  const groupedMoves = useMemo(() => {
    if (!filteredAndSortedMoves) return []
    
    const mainMoves = filteredAndSortedMoves.filter(move => !move.is_subtask)
    return mainMoves.map(mainMove => ({
      ...mainMove,
      subtasks: filteredAndSortedMoves.filter(move => move.parent_move_id === mainMove.id)
    }))
  }, [filteredAndSortedMoves])

  return (
    <AppLayout>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-sm text-gray-500">Manage moves and appointments</p>
          </div>
          <MoveDialog
            mode="create"
            trigger={
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            }
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border mx-auto"
                    modifiers={{
                      booked: moveDates,
                    }}
                    modifiersStyles={{
                      booked: {
                        fontWeight: "bold",
                        backgroundColor: "rgb(59 130 246 / 0.1)",
                        color: "rgb(59 130 246)",
                      }
                    }}
                    onDayClick={(day) => setDate(day)}
                  />
                  {movesForSelectedDate.length > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="absolute top-0 right-0 p-4">
                          <div className="bg-blue-100 text-blue-700 rounded-full px-2 py-1 text-xs font-medium">
                            {movesForSelectedDate.length} moves
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-medium">
                            Moves on {date && format(date, "PPP")}
                          </h4>
                          {movesForSelectedDate.map((move) => (
                            <div
                              key={move.id}
                              className="text-sm p-2 border rounded hover:bg-gray-50"
                            >
                              <div className="font-medium">
                                {move.clients.first_name} {move.clients.last_name}
                              </div>
                              <div className="text-gray-500">{move.move_type}</div>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Selected Date Overview</h3>
              {movesForSelectedDate.length > 0 ? (
                <div className="space-y-2">
                  {movesForSelectedDate.map((move) => (
                    <div key={move.id} className="text-sm bg-white p-3 rounded-md shadow-sm">
                      <div className="font-medium">{move.title}</div>
                      <div className="text-gray-500">
                        {move.clients.first_name} {move.clients.last_name}
                      </div>
                      {move.is_subtask && (
                        <div className="text-xs text-blue-600 mt-1">
                          Sub-task
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No moves scheduled for this date</p>
              )}
            </div>
          </div>

          <Card className="h-fit">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Upcoming Moves</CardTitle>
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search moves..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={sortField}
                    onValueChange={(value) => setSortField(value as SortField)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="name">Client Name</SelectItem>
                      <SelectItem value="type">Move Type</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => setSortOrder(value as SortOrder)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Sort order" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {isLoading ? (
                  <p className="text-sm text-gray-500">Loading moves...</p>
                ) : groupedMoves && groupedMoves.length > 0 ? (
                  groupedMoves.map((move) => (
                    <div key={move.id} className="space-y-2">
                      <div
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-move"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("moveId", move.id)
                          setDraggedMoveId(move.id)
                        }}
                        onDragEnd={() => setDraggedMoveId(null)}
                      >
                        <div>
                          <div className="font-medium">
                            {move.clients.first_name} {move.clients.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(move.start_date), "PPP")}
                          </div>
                          <div className="text-sm text-gray-500">{move.move_type}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {move.from_address}
                          </div>
                          <div className="mt-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                              ${move.status === 'completed' ? 'bg-green-100 text-green-700' :
                                move.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-yellow-100 text-yellow-700'
                              }`}>
                              {move.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <MoveDialog
                            mode="create"
                            parentMoveId={move.id}
                            trigger={
                              <Button variant="outline" size="sm" className="h-8">
                                <Plus className="h-4 w-4 mr-1" />
                                Sub-task
                              </Button>
                            }
                          />
                          <MoveDialog
                            mode="edit"
                            move={move}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Move</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this move? This will also delete all related sub-tasks.
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
                      {move.subtasks && move.subtasks.length > 0 && (
                        <div className="pl-4 space-y-2">
                          {move.subtasks.map((subtask) => (
                            <div
                              key={subtask.id}
                              className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 bg-gray-50/50"
                            >
                              <div className="flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                <div>
                                  <div className="font-medium">{subtask.title}</div>
                                  <div className="text-sm text-gray-500">
                                    {format(new Date(subtask.start_date), "PPP")}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <MoveDialog
                                  mode="edit"
                                  move={subtask}
                                  trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Sub-task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this sub-task?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(subtask.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No moves found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
