import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicalHistoryEntry {
  id: string;
  date: string;
  type: string; // visit, diagnosis, treatment, etc
  description: string;
  doctorName?: string;
  notes?: string;
}

interface MedicalHistoryProps {
  history: MedicalHistoryEntry[];
}

const MedicalHistory = ({ history }: MedicalHistoryProps) => {
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (sortedHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
          <CardDescription>
            Your past medical visits and treatments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No history yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical History</CardTitle>
        <CardDescription>
          Your past medical visits and treatments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedHistory.map((entry, idx) => (
            <div key={entry.id} className="relative">
              {idx !== sortedHistory.length - 1 && (
                <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
              )}
              <div className="relative ml-8 pb-4">
                <div className="absolute -left-6 top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                        {entry.type}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
                    {entry.description}
                  </p>
                  {entry.doctorName && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Dr. {entry.doctorName}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalHistory;
