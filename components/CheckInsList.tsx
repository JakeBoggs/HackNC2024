import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CheckIn {
  id: string;
  scheduledAt: string;
  itemId: string;
  item: {
    name: string;
    todoList: {
      name: string;
    };
  };
}

interface CheckInsListProps {
  checkIns: CheckIn[];
}

export function CheckInsList({ checkIns }: CheckInsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Check-ins</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {checkIns.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming check-ins</p>
          ) : (
            checkIns.map((checkIn) => (
              <div
                key={checkIn.id}
                className="flex flex-col space-y-1 p-3 border rounded-lg"
              >
                <div className="text-sm font-medium">{checkIn.item.name}</div>
                <div className="text-xs text-gray-500">
                  List: {checkIn.item.todoList.name}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(checkIn.scheduledAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}