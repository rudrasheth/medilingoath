import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location?: string;
  reason?: string;
  status?: "confirmed" | "pending" | "cancelled";
}

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  compact?: boolean;
}

const UpcomingAppointments = ({ appointments, compact }: UpcomingAppointmentsProps) => {
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcomingAppointments.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-slate-500 dark:text-slate-400">No upcoming appointments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(compact ? upcomingAppointments.slice(0, 3) : upcomingAppointments).map(
        (appointment) => (
          <Card key={appointment.id} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    Dr. {appointment.doctorName}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {appointment.specialty}
                  </p>
                </div>
                <Badge variant={
                  appointment.status === "confirmed"
                    ? "default"
                    : appointment.status === "pending"
                    ? "secondary"
                    : "destructive"
                }>
                  {appointment.status || "confirmed"}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {new Date(appointment.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  {appointment.time}
                </div>
                {appointment.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    {appointment.location}
                  </div>
                )}
                {appointment.reason && (
                  <div className="text-slate-700 dark:text-slate-200 mt-2">
                    Reason: {appointment.reason}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};

export default UpcomingAppointments;
