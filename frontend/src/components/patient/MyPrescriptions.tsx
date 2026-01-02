import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Prescription {
  id: string;
  doctorName: string;
  medications: string[];
  date: string;
  filled?: boolean;
  filePath?: string;
}

interface MyPrescriptionsProps {
  prescriptions: Prescription[];
}

const MyPrescriptions = ({ prescriptions }: MyPrescriptionsProps) => {
  if (prescriptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Prescriptions</CardTitle>
          <CardDescription>
            Prescriptions from your doctors will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-slate-500 dark:text-slate-400">No prescriptions yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Prescriptions</CardTitle>
        <CardDescription>
          View and download your prescriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Dr. {prescription.doctorName}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(prescription.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge variant={prescription.filled ? "default" : "secondary"}>
                  {prescription.filled ? "Filled" : "Pending"}
                </Badge>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Medications:
                </p>
                <ul className="space-y-1">
                  {prescription.medications.map((med, idx) => (
                    <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                      • {med}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                {prescription.filePath && (
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyPrescriptions;
