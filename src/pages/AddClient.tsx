
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"

const clientFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  currentAddress: z.string().min(5, "Current address must be at least 5 characters"),
  moveToAddress: z.string().min(5, "New address must be at least 5 characters"),
  moveDate: z.string().min(1, "Move date is required"),
  notes: z.string().optional(),
})

type ClientFormValues = z.infer<typeof clientFormSchema>

const defaultValues: Partial<ClientFormValues> = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  currentAddress: "",
  moveToAddress: "",
  moveDate: "",
  notes: "",
}

export default function AddClient() {
  const navigate = useNavigate()
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
  })

  async function onSubmit(data: ClientFormValues) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("You must be logged in to add clients")
        return
      }

      const { error } = await supabase.from("clients").insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.currentAddress,
        notes: data.notes,
        user_id: user.id,
      })

      if (error) {
        toast.error("Error adding client")
        console.error("Error adding client:", error)
        return
      }

      // Create a move record for this client
      const moveStartDate = new Date(data.moveDate)
      const moveEndDate = new Date(moveStartDate)
      moveEndDate.setDate(moveEndDate.getDate() + 1) // Set end date to the next day by default

      const { error: moveError } = await supabase.from("moves").insert({
        client_id: (await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .eq("first_name", data.firstName)
          .eq("last_name", data.lastName)
          .single()).data?.id,
        user_id: user.id,
        from_address: data.currentAddress,
        to_address: data.moveToAddress,
        start_date: moveStartDate.toISOString(),
        end_date: moveEndDate.toISOString(), // Add the end_date field
        move_type: "residential",
        status: "pending",
        title: `Move for ${data.firstName} ${data.lastName}`,
      })

      if (moveError) {
        toast.error("Error creating move record")
        console.error("Error creating move:", moveError)
        return
      }

      toast.success("Client added successfully!")
      navigate("/clients")
    } catch (error) {
      console.error("Error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Add New Client</h1>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="john.doe@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="currentAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Current St, City, State, ZIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moveToAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Address</FormLabel>
                  <FormControl>
                    <Input placeholder="456 New St, City, State, ZIP" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moveDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Move Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Any additional notes..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Add any special requirements or notes about the move
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button variant="outline" type="button" onClick={() => navigate("/clients")}>
                Cancel
              </Button>
              <Button type="submit">Add Client</Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}
