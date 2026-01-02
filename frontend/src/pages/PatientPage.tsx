import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect } from "react";
import GlassNav from "@/components/layout/GlassNav";
import PatientDashboard from "@/components/patient/PatientDashboard";
import PatientProfile from "@/components/patient/PatientProfile";
import { Helmet } from "react-helmet";

type PatientView = "dashboard" | "profile";

const PatientPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { view } = useParams<{ view?: PatientView }>();
  const currentView = (view as PatientView) || "dashboard";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Patient Portal - MediLingo</title>
        <meta
          name="description"
          content="Manage your health records, appointments, and prescriptions"
        />
      </Helmet>

      <GlassNav />

      <main>
        {currentView === "dashboard" && <PatientDashboard />}
        {currentView === "profile" && <PatientProfile />}
      </main>
    </>
  );
};

export default PatientPage;
