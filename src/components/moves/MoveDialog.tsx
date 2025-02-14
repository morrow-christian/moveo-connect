
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Move } from "@/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { differenceInDays } from "date-fns"

interface Client {
  id: string
  first_name: string
  last_name: string
}

const moveTemplates = [
  { type: "Local Move", duration: 1 },
  { type: "Long Distance Move", duration: 3 },
  { type: "Office Move", duration: 2 },
  { type: "Storage Move", duration: 1 },
  { type: "Apartment Move", duration: 1 },
]

interface MoveDialogProps {
  mode: "create" | "edit"
  move?: Move
  parentMoveId?: string
  trigger?: React.ReactNode
  onComplete?: () => void
}

export function MoveDialog({ mode, move, parentMoveId, trigger, onComplete }: MoveDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState({
    title: move?.title || "",
    start_date: move?.start_date ? new Date(move.start_date).toISOString().split('T')[0] : "",
    end_date: move?.end_date ? new Date(move.end_date).toISOString().split('T')[0] : "",
    move_type: move?.move_type || "",
    from_address: move?.from_address || "",
    to_address: move?.to_address || "",
    description: move?.description || "",
    status: move?.status || "pending",
    is_subtask: parentMoveId ? true : false,
    parent_move_id: parentMoveId || null,
    client_id: move?.client_id || ""
  })

  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name")
      if (error) throw error
      return data as Client[]
    },
    enabled: !parentMoveId && mode === "create" // Only fetch clients for new main moves
  })

  const handleTemplateSelection = (templateType: string) => {
    const template = moveTemplates.find(t => t.type === templateType)
    if (template && formData.start_date) {
      const startDate = new Date(formData.start_date)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + template.duration)
      
      setFormData(prev => ({
        ...prev,
        move_type: templateType,
        end_date: endDate.toISOString().split('T')[0]
      }))
    }
  }

  const validateDates = () => {
    if (!formData.start_date || !formData.end_date) return true
    const startDate = new Date(formData.start_date)
    const endDate = new Date(formData.end_date)
    return startDate <= endDate
  }

  const handleStartDateChange = (date: string) => {
    setFormData(prev => {
      const newData = { ...prev, start_date: date }
      if (prev.move_type) {
        const template = moveTemplates.find(t => t.type === prev.move_type)
        if (template) {
          const startDate = new Date(date)
          const endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + template.duration)
          newData.end_date = endDate.toISOString().split('T')[0]
        }
      }
      return newData
    })
  }

  const calculateDuration = () => {
    if (formData.start_date && formData.end_date) {
      const days = differenceInDays(
        new Date(formData.end_date),
        new Date(formData.start_date)
      )
      return days + 1
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateDates()) {
      toast.error("End date must be after start date")
      return
    }
    
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      if (mode === "create") {
        let client_id = formData.client_id || move?.client_id
        
        if (parentMoveId && !client_id) {
          const { data: parentMove, error: parentError } = await supabase
            .from("moves")
            .select("client_id")
            .eq("id", parentMoveId)
            .single()
            
          if (parentError) throw parentError
          client_id = parentMove.client_id
        }

        if (!client_id && !parentMoveId) {
          throw new Error("Please select a client")
        }

        const { error } = await supabase.from("moves").insert({
          ...formData,
          client_id: client_id,
          user_id: user.id,
          status: formData.status,
          is_subtask: Boolean(parentMoveId),
          parent_move_id: parentMoveId || null
        })
        
        if (error) throw error
        toast.success(parentMoveId ? "Sub-task created successfully" : "Move created successfully")
      } else {
        const { error } = await supabase
          .from("moves")
          .update(formData)
          .eq("id", move?.id)
        if (error) throw error
        toast.success(move?.is_subtask ? "Sub-task updated successfully" : "Move updated successfully")
      }

      queryClient.invalidateQueries({ queryKey: ["moves"] })
      setOpen(false)
      onComplete?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" 
              ? (parentMoveId ? "Create New Sub-task" : "Create New Move")
              : (move?.is_subtask ? "Edit Sub-task" : "Edit Move")}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!parentMoveId && mode === "create" && (
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="move_type">Move Type</Label>
                <Select
                  value={formData.move_type}
                  onValueChange={handleTemplateSelection}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select move type" />
                  </SelectTrigger>
                  <SelectContent>
                    {moveTemplates.map((template) => (
                      <SelectItem key={template.type} value={template.type}>
                        {template.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  required
                  min={formData.start_date}
                />
              </div>
            </div>

            {calculateDuration() && (
              <div className="text-sm text-gray-500">
                Duration: {calculateDuration()} day(s)
              </div>
            )}

            {!formData.is_subtask && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="from_address">From Address</Label>
                  <Input
                    id="from_address"
                    value={formData.from_address}
                    onChange={(e) =>
                      setFormData({ ...formData, from_address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to_address">To Address</Label>
                  <Input
                    id="to_address"
                    value={formData.to_address}
                    onChange={(e) =>
                      setFormData({ ...formData, to_address: e.target.value })
                    }
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : mode === "create" ? "Create" : "Update"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
