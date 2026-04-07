import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { API_BASE_URL } from "@/lib/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { Edit2, Save } from "lucide-react";

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

interface MedicalCondition {
  id: string;
  condition: string;
  diagnosedYear?: number;
  notes?: string;
}

interface PatientProfileData {
  age?: number;
  gender?: "Male" | "Female" | "Other";
  bloodType?: string;
  allergies?: string;
  medicalConditions?: MedicalCondition[];
  medications?: string;
  emergencyContacts?: EmergencyContact[];
  notes?: string;
}

const PatientProfile = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<PatientProfileData>({
    age: user?.age,
    gender: user?.gender as "Male" | "Female",
    bloodType: "",
    allergies: "",
    medicalConditions: [],
    medications: "",
    emergencyContacts: [],
    notes: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newEmergency, setNewEmergency] = useState({
    name: "",
    relationship: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/patient/profile`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("medilingo_token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/patient/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("medilingo_token")}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile saved successfully",
        });
        setIsEditing(false);
      } else {
        throw new Error("Failed to save profile");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmergencyContact = () => {
    if (!newEmergency.name || !newEmergency.phone) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      ...newEmergency,
    };

    setProfileData({
      ...profileData,
      emergencyContacts: [...(profileData.emergencyContacts || []), contact],
    });

    setNewEmergency({
      name: "",
      relationship: "",
      phone: "",
    });
  };

  const removeEmergencyContact = (id: string) => {
    setProfileData({
      ...profileData,
      emergencyContacts: profileData.emergencyContacts?.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              Patient Profile
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {user?.name} • {user?.email}
            </p>
          </div>
          <Button
            onClick={() => {
              if (isEditing) {
                saveProfile();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={loading}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Your personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profileData.age || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          age: parseInt(e.target.value),
                        })
                      }
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      value={profileData.gender || ""}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          gender: e.target.value as "Male" | "Female",
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Input
                    id="bloodType"
                    placeholder="e.g., O+, A-, B+"
                    value={profileData.bloodType || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        bloodType: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="List any known allergies"
                    value={profileData.allergies || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        allergies: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Info Tab */}
          <TabsContent value="medical">
            <Card>
              <CardHeader>
                <CardTitle>Medical Information</CardTitle>
                <CardDescription>
                  Your medical history and conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    placeholder="List your current medications"
                    value={profileData.medications || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        medications: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Medical Conditions</Label>
                  <div className="space-y-2 mt-2">
                    {profileData.medicalConditions?.map((condition) => (
                      <div
                        key={condition.id}
                        className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg flex justify-between items-start"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {condition.condition}
                          </p>
                          {condition.diagnosedYear && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              Diagnosed: {condition.diagnosedYear}
                            </p>
                          )}
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setProfileData({
                                ...profileData,
                                medicalConditions:
                                  profileData.medicalConditions?.filter(
                                    (c) => c.id !== condition.id
                                  ),
                              });
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any other relevant medical information"
                    value={profileData.notes || ""}
                    onChange={(e) =>
                      setProfileData({
                        ...profileData,
                        notes: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Contacts Tab */}
          <TabsContent value="emergency">
            <Card>
              <CardHeader>
                <CardTitle>Emergency Contacts</CardTitle>
                <CardDescription>
                  People we should contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold">Add Emergency Contact</h3>
                    <Input
                      placeholder="Contact name"
                      value={newEmergency.name}
                      onChange={(e) =>
                        setNewEmergency({
                          ...newEmergency,
                          name: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Relationship"
                      value={newEmergency.relationship}
                      onChange={(e) =>
                        setNewEmergency({
                          ...newEmergency,
                          relationship: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Phone number"
                      value={newEmergency.phone}
                      onChange={(e) =>
                        setNewEmergency({
                          ...newEmergency,
                          phone: e.target.value,
                        })
                      }
                    />
                    <Button
                      size="sm"
                      onClick={addEmergencyContact}
                      className="w-full"
                    >
                      Add Contact
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  {profileData.emergencyContacts?.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {contact.name}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {contact.relationship}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {contact.phone}
                          </p>
                        </div>
                        {isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeEmergencyContact(contact.id)
                            }
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {!profileData.emergencyContacts?.length && (
                    <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                      No emergency contacts added yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PatientProfile;
