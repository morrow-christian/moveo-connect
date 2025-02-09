
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Move } from "@/types";

interface RecentActivitiesProps {
  moves: Move[] | null;
  isLoading: boolean;
}

export function RecentActivities({ moves, isLoading }: RecentActivitiesProps) {
  return (
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
        ) : moves && moves.length > 0 ? (
          moves.slice(0, 3).map((move) => (
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
  );
}
