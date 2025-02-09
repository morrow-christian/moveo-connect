
import { Users, Calendar, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardStatsProps {
  stats: {
    activeClients: number;
    upcomingMoves: number;
    completedMoves: number;
  };
  isLoading: boolean;
}

export function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const statItems = [
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Upcoming Moves",
      value: stats.upcomingMoves.toString(),
      icon: Calendar,
      color: "text-green-500",
    },
    {
      title: "Completed Moves",
      value: stats.completedMoves.toString(),
      icon: CheckCircle,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {statItems.map((stat) => (
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
  );
}
