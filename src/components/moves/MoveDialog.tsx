
import { useState } from "react"
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
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Move } from "@/types"

interface MoveDialogProps {
  mode: "create" | "edit"
  move?: Move
  trigger?: React.ReactNode
  onComplete?: () => void
}

export function MoveDialog({ mode, move, trigger, onComplete }: MoveDialogProps) {
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
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "create") {
        const { error } = await supabase.from("moves").insert([
          {
            ...formData,
            client_id: move?.client_id,
          },
        ])
        if (error) throw error
        toast.success("Move created successfully")
      } else {
        const { error } = await supabase
          .from("moves")
          .update(formData)
          .eq("id", move?.id)
        if (error) throw error
        toast.success("Move updated successfully")
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Move" : "Edit Move"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Input
              id="move_type"
              value={formData.move_type}
              onChange={(e) =>
                setFormData({ ...formData, move_type: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
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
            />
          </div>
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
          <div className="flex justify-end gap-2">
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
      </DialogContent>
    </Dialog>
  )
}
