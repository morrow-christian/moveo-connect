
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";
import { useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks";

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
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboardData,
  });

  useEffect(() => {
    const clientsChannel = supabase
      .channel('public:clients')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .subscribe();

    const movesChannel = supabase
      .channel('public:moves')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'moves'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(movesChannel);
    };
  }, [queryClient]);

  if (error) {
    toast.error("Failed to load dashboard data");
  }

  return (
    <AppLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        
        <DashboardStats stats={data?.stats || { activeClients: 0, upcomingMoves: 0, completedMoves: 0 }} isLoading={isLoading} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecentActivities moves={data?.moves} isLoading={isLoading} />
          <UpcomingTasks moves={data?.moves} isLoading={isLoading} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
