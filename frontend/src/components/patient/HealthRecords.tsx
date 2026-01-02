import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthRecord {
  id: string;
  type: string; // bloodwork, xray, test, etc
  date: string;
  description?: string;
  results?: string;
  filePath?: string;
}

interface HealthRecordsProps {
  records: HealthRecord[];
}

const HealthRecords = ({ records }: HealthRecordsProps) => {
  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Records</CardTitle>
          <CardDescription>
            Your medical records and test results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Heart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No health records yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Records</CardTitle>
        <CardDescription>
          Your medical records and test results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white capitalize">
                    {record.type}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {record.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {record.description}
                </p>
              )}

              {record.results && (
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded mb-3 text-sm text-slate-700 dark:text-slate-300">
                  <strong>Results:</strong> {record.results}
                </div>
              )}

              {record.filePath && (
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-4 h-4" />
                  Download Record
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthRecords;
