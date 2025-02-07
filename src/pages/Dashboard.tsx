
import { Card } from "@/components/ui/card";
import { Users, Calendar, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

async function fetchDashboardData() {
  const { data: moves, error: movesError } = await supabase
    .from("moves")
    .select(`
      *,
      clients (
        first_name,
        last_name
      )
    `)
    .order("created_at", { ascending: false });

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("*");

  if (movesError || clientsError) {
    throw new Error("Failed to fetch dashboard data");
  }

  return {
    moves,
    clients,
    stats: {
      activeClients: clients?.length || 0,
      upcomingMoves: moves?.filter(m => new Date(m.start_date) > new Date()).length || 0,
      completedMoves: moves?.filter(m => m.status === "completed").length || 0,
    }
  };
}

const Dashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  if (error) {
    toast.error("Failed to load dashboard data");
  }

  const stats = [
    {
      title: "Active Clients",
      value: data?.stats.activeClients.toString() || "0",
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Upcoming Moves",
      value: data?.stats.upcomingMoves.toString() || "0",
      icon: Calendar,
      color: "text-green-500",
    },
    {
      title: "Completed Moves",
      value: data?.stats.completedMoves.toString() || "0",
      icon: CheckCircle,
      color: "text-purple-500",
    },
  ];

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  {isLoading ? (
                    <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1" />
                  ) : (
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  )}
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))
              ) : data?.moves && data.moves.length > 0 ? (
                data.moves.slice(0, 3).map((move) => (
                  <div key={move.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">
                        Move for {move.clients.first_name} {move.clients.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(move.created_at), "PPp")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No recent activities</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="h-2 w-2 rounded-full bg-gray-200" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                      <div className="h-3 w-24 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))
              ) : data?.moves ? (
                data.moves
                  .filter(move => new Date(move.start_date) > new Date())
                  .slice(0, 3)
                  .map((move) => (
                    <div key={move.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <div>
                        <p className="font-medium">
                          Move: {move.clients.first_name} {move.clients.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(move.start_date), "PPp")}
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No upcoming tasks</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
