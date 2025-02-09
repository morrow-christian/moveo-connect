
import { useParams } from "react-router-dom"
import { AppSidebar } from "@/components/AppSidebar"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ClientDetails() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .maybeSingle()

      if (error) {
        toast.error("Error loading client details")
        throw error
      }

      if (data) {
        setFormData({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          notes: data.notes || "",
        })
      }

      return data
    },
  })

  const updateClientMutation = useMutation({
    mutationFn: async (updatedData: typeof formData) => {
      const { error } = await supabase
        .from("clients")
        .update(updatedData)
        .eq("id", id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] })
      queryClient.invalidateQueries({ queryKey: ["clients"] })
      toast.success("Client updated successfully")
      setIsEditing(false)
    },
    onError: () => {
      toast.error("Failed to update client")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateClientMutation.mutate(formData)
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-8">
          <Skeleton className="h-8 w-1/3 mb-4" />
          <div className="grid gap-6">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </div>
        </main>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex h-screen bg-gray-100">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Client Not Found</h1>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AppSidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-gray-500">Client Details</p>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Cancel" : "Edit Client"}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="first_name" className="text-sm font-medium text-gray-500">
                    First Name
                  </label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{client.first_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="last_name" className="text-sm font-medium text-gray-500">
                    Last Name
                  </label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{client.last_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  {isEditing ? (
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{client.email || "Not provided"}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{client.phone || "Not provided"}</p>
                  )}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  {isEditing ? (
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{client.address || "Not provided"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="notes" className="text-sm font-medium text-gray-500">
                  Notes
                </label>
                {isEditing ? (
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{client.notes || "No notes available"}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
