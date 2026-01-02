import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, FileText, Heart, Clock, User, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpcomingAppointments from "./UpcomingAppointments";
import MedicalHistory from "./MedicalHistory";
import MyPrescriptions from "./MyPrescriptions";
import HealthRecords from "./HealthRecords";
import BookAppointmentPatient from "./BookAppointmentPatient";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [user?.id]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patient/data`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("medilingo_token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatientData(data);
      } else if (response.status === 404) {
        // Patient profile doesn't exist yet, initialize empty data
        setPatientData({
          appointments: [],
          prescriptions: [],
          medicalHistory: [],
          healthRecords: [],
          emergencyContacts: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch patient data:", error);
      toast({
        title: "Error",
        description: "Failed to load patient data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAppointmentCount = () => {
    if (!patientData?.appointments) return 0;
    return patientData.appointments.filter(
      (apt: any) => new Date(apt.date) > new Date()
    ).length;
  };

  const getPendingPrescriptions = () => {
    if (!patientData?.prescriptions) return 0;
    return patientData.prescriptions.filter((p: any) => !p.filled).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome, {user?.name}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your health and medical appointments
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {getUpcomingAppointmentCount()}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Upcoming
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {patientData?.prescriptions?.length || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {getPendingPrescriptions()} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Health Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {patientData?.healthRecords?.length || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                On file
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Medical History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {patientData?.medicalHistory?.length || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Records
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="health">Health Records</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Upcoming Appointments</span>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => setActiveTab("appointments")}
                    >
                      <Plus className="w-4 h-4" />
                      Book
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Your next scheduled appointments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UpcomingAppointments
                    appointments={patientData?.appointments || []}
                    compact
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>Access important features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab("appointments")}
                  >
                    <Calendar className="w-4 h-4" />
                    Book Appointment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab("prescriptions")}
                  >
                    <FileText className="w-4 h-4" />
                    View Prescriptions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setActiveTab("health")}
                  >
                    <Heart className="w-4 h-4" />
                    Health Records
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <User className="w-4 h-4" />
                    View Profile
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="appointments">
            <div className="space-y-4">
              <div className="flex justify-end">
                <BookAppointmentPatient
                  onSuccess={() => {
                    fetchPatientData();
                    toast({
                      title: "Success",
                      description: "Appointment booked successfully",
                    });
                  }}
                />
              </div>
              <UpcomingAppointments appointments={patientData?.appointments || []} />
            </div>
          </TabsContent>

          <TabsContent value="prescriptions">
            <MyPrescriptions prescriptions={patientData?.prescriptions || []} />
          </TabsContent>

          <TabsContent value="health">
            <HealthRecords records={patientData?.healthRecords || []} />
          </TabsContent>

          <TabsContent value="history">
            <MedicalHistory history={patientData?.medicalHistory || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientDashboard;
