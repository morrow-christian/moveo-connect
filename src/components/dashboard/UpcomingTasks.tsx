
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Move } from "@/types";

interface UpcomingTasksProps {
  moves: Move[] | null;
  isLoading: boolean;
}

export function UpcomingTasks({ moves, isLoading }: UpcomingTasksProps) {
  return (
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
        ) : moves ? (
          moves
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
  );
}
