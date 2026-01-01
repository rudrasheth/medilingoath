import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import GlassNav from "@/components/layout/GlassNav";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Mail, User, Cake, Edit2, Save, X, Eye, EyeOff, ArrowLeft, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SharingRedeemModal from "@/components/SharingRedeemModal";

interface UserProfile {
  name: string;
  email: string;
  age: string;
  gender?: 'Male' | 'Female';
}

const ProfilePage = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, checkAuthStatus, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);

  // Sharing Code state (female users only)
  const [sharingCode, setSharingCode] = useState<string | null>(null);
  const [showSharingCode, setShowSharingCode] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: "",
    gender: undefined,
  });

  const [editedProfile, setEditedProfile] = useState<UserProfile>({
    name: "",
    email: "",
    age: "",
    gender: undefined,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch latest profile from backend (MongoDB) and sync UI
  useEffect(() => {
    const refreshProfile = async () => {
      if (!isAuthenticated || !user?.id) return;
      
      // Check if we have proper authentication
      if (!checkAuthStatus()) {
        toast({
          title: "Authentication Required",
          description: "Please log in again to access your profile.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }
      
      try {
        setIsLoadingProfile(true);
        const API_BASE_URL = 'https://medilingoath.vercel.app';
        const token = localStorage.getItem('medilingo_token');
        
        console.log('🔑 Token check:', token ? 'Present' : 'Missing');
        
        if (!token) {
          console.error('❌ No token found - forcing logout');
          logout();
          navigate('/');
          return;
        }
        
        // Get user profile
        const resp = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 Profile response status:', resp.status);
        
        if (resp.status === 401) {
          console.error('❌ Token expired or invalid - forcing logout');
          logout();
          navigate('/');
          return;
        }
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error('❌ Profile fetch error:', errorText);
          throw new Error("Failed to fetch profile");
        }
        const data = await resp.json();
        const u = data?.user || user;
        setProfile({
          name: u?.name || "",
          email: u?.email || "",
          age: u?.age ? String(u.age) : "",
          gender: u?.gender || undefined,
        });
        setEditedProfile({
          name: u?.name || "",
          email: u?.email || "",
          age: u?.age ? String(u.age) : "",
          gender: u?.gender || undefined,
        });
        
        // Load sharing code only for female users
        if (u?.gender === 'Female') {
          console.log('👩 Female user detected, loading sharing code...');
          try {
            // First try to get existing sharing code
            const codeResp = await fetch(`${API_BASE_URL}/api/share?action=code`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('📡 Code response status:', codeResp.status);
            
            if (codeResp.ok) {
              const codeData = await codeResp.json();
              console.log('📋 Code data:', codeData);
              
              if (codeData?.sharingCode) {
                setSharingCode(codeData.sharingCode);
              } else {
                console.log('🔄 No existing code, will generate on demand');
              }
            } else {
              const errorText = await codeResp.text();
              console.error('❌ Code fetch error:', errorText);
            }
          } catch (e) {
            console.error('💥 Error with sharing code:', e);
          }
        } else {
          console.log('👤 User gender:', u?.gender, '- not female, skipping sharing code');
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    refreshProfile();
  }, [isAuthenticated, user?.id, user?.gender, checkAuthStatus, logout, navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProfile(profile);
  };

  const handleSaveProfile = async () => {
    if (!editedProfile.name.trim()) {
      toast({
        title: "Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!editedProfile.age || parseInt(editedProfile.age) < 1) {
      toast({
        title: "Error",
        description: "Please enter a valid age.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const API_BASE_URL = 'https://medilingoath.vercel.app';
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('medilingo_token') || ''}`,
        },
        body: JSON.stringify({
          name: editedProfile.name,
          age: parseInt(editedProfile.age),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      const u = data?.user || editedProfile;
      setProfile({
        name: u?.name || editedProfile.name,
        email: u?.email || profile.email,
        age: u?.age ? String(u.age) : editedProfile.age,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const API_BASE_URL = 'https://medilingoath.vercel.app';
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          'Authorization': `Bearer ${localStorage.getItem('medilingo_token') || ''}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to change password");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setChangePasswordMode(false);
      toast({
        title: "Success",
        description: "Password changed successfully!",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateSharingCode = async () => {
    try {
      const API_BASE_URL = 'https://medilingoath.vercel.app';
      const token = localStorage.getItem('medilingo_token');
      
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      console.log('👤 User:', user);
      
      const response = await fetch(`${API_BASE_URL}/api/share?action=generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      
      setSharingCode(data.sharingCode);
      
      toast({
        title: "Success",
        description: data.existing ? "Sharing code retrieved!" : "New sharing code generated!",
      });
    } catch (error) {
      console.error('💥 Error generating sharing code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate sharing code. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <GlassNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Not Authenticated</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Please login to view your profile.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if user has valid token
  const token = localStorage.getItem('medilingo_token');
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <GlassNav />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Session Expired</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">Your session has expired. Please log in again to access your profile.</p>
              <Button 
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>User Profile - MediLingo</title>
        <meta name="description" content="Manage your MediLingo profile" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
        <GlassNav />

        <div className="flex-1 flex items-center justify-center px-2 py-4 sm:px-4 sm:py-6">
          <div className="w-full max-w-sm sm:max-w-md">
            
            <div className="space-y-2 sm:space-y-3">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl shadow-lg p-3 sm:p-4 text-white relative overflow-hidden">
              {/* Back Button - Top Left */}
              <button
                onClick={() => navigate("/")}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex items-center gap-1 sm:gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-all duration-200 text-white text-xs sm:text-sm font-medium"
                title="Go back"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-teal-400 rounded-full opacity-20 -mr-8 -mt-8 sm:-mr-12 sm:-mt-12"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-20 sm:h-20 bg-teal-400 rounded-full opacity-20 -ml-6 -mb-6 sm:-ml-10 sm:-mb-10"></div>
              
              <div className="relative z-10 text-center pt-6 sm:pt-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 backdrop-blur-sm mx-auto mb-2">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold">{profile.name || "User Profile"}</h1>
                <p className="text-teal-100 text-xs mt-0.5">Manage your information</p>
              </div>
            </div>

            {/* Personal Information Card */}
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-b border-teal-100 px-3 sm:px-5 py-2 sm:py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-100 flex items-center justify-center">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-600" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">Personal Info</h2>
                  </div>
                  {!isEditing && !changePasswordMode && (
                    <Button
                      onClick={handleEditClick}
                      className="gap-0.5 sm:gap-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs h-7 sm:h-8 px-2 sm:px-2.5"
                    >
                      <Edit2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="pt-3 sm:pt-4 pb-2 sm:pb-3">
                {!isEditing ? (
                  // View Mode
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Full Name */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-lg p-3 border border-teal-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <User className="w-2.5 h-2.5 text-teal-600" />
                          Full Name
                        </Label>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {profile.name || "Not provided"}
                        </p>
                      </div>

                      {/* Age */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Cake className="w-2.5 h-2.5 text-blue-600" />
                          Age
                        </Label>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {profile.age || "Not provided"} {profile.age ? "y" : ""}
                        </p>
                      </div>

                      {/* Gender */}
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 rounded-lg p-3 border border-pink-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <User className="w-2.5 h-2.5 text-pink-600" />
                          Gender
                        </Label>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {profile.gender || "Not specified"}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-3 border border-purple-200/50">
                        <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Mail className="w-2.5 h-2.5 text-purple-600" />
                          Email
                        </Label>
                        <p className="text-xs font-bold text-gray-900 mt-0.5 break-all">
                          {profile.email}
                        </p>
                      </div>
                    </div>

                    {/* Account Actions */}
                    <div className="pt-2 border-t border-gray-200 space-y-2">
                      <Button
                        onClick={() => setChangePasswordMode(true)}
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-yellow-400 text-yellow-800 font-bold py-2 bg-gradient-to-r from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 shadow-sm transition-all duration-200 text-sm"
                      >
                        <span role="img" aria-label="password">🔒</span> Change Password
                      </Button>

                      {/* Redeem Sharing Code - Only for Male Users */}
                      {profile.gender === 'Male' && (
                        <Button
                          onClick={() => setShowRedeemModal(true)}
                          variant="outline"
                          className="w-full flex items-center justify-center gap-2 rounded-full border-2 border-blue-400 text-blue-800 font-bold py-2 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 shadow-sm transition-all duration-200 text-sm"
                        >
                          <Key className="w-4 h-4" />
                          Redeem Sharing Code
                        </Button>
                      )}
                    </div>

                    {/* Period Tracker - Only for Female Users */}
                    {profile.gender === 'Female' && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-gradient-to-br from-pink-50 to-rose-100/50 rounded-lg p-4 border border-pink-200/50">
                          <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <span role="img" aria-label="calendar">🗓️</span>
                            Period Tracker
                          </h3>
                          <Button
                            onClick={() => navigate('/period-tracker')}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium py-2 rounded-lg text-sm"
                          >
                            Track Your Cycle
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-2.5">
                    {/* Name Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        value={editedProfile.name}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            name: e.target.value,
                          })
                        }
                        placeholder="Enter full name"
                        className="border-2 border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 rounded-lg h-9 text-xs"
                      />
                    </div>

                    {/* Age Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="age" className="text-xs font-semibold text-gray-700">
                        Age
                      </Label>
                      <Input
                        id="age"
                        type="number"
                        value={editedProfile.age}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            age: e.target.value,
                          })
                        }
                        placeholder="Enter age"
                        min="1"
                        max="150"
                        className="border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg h-9 text-xs"
                      />
                    </div>

                    {/* Email Display (Read-only) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedProfile.email}
                        disabled
                        className="bg-gray-100 border-2 border-gray-300 cursor-not-allowed rounded-lg h-9 text-xs text-gray-600"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1.5 pt-2 border-t border-gray-200">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-0.5 rounded-lg h-9 flex-1 text-xs font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="gap-0.5 rounded-lg h-9 flex-1 border border-gray-300 text-xs font-semibold"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Change Password Section */}
                {changePasswordMode && (
                  <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔐</span>
                      <h3 className="text-base font-bold text-gray-900">Change Password</h3>
                    </div>

                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          className="border-2 border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              newPassword: e.target.value,
                            })
                          }
                          placeholder="Enter new password"
                          className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm new password"
                          className="border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 rounded-lg h-10 pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <Button
                        onClick={handleChangePassword}
                        disabled={isSaving}
                        className="bg-red-600 hover:bg-red-700 text-white gap-1 rounded-lg h-10 flex-1 text-sm font-semibold"
                      >
                        <Save className="w-3 h-3" />
                        {isSaving ? "Updating..." : "Update"}
                      </Button>
                      <Button
                        onClick={() => {
                          setChangePasswordMode(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        variant="outline"
                        className="gap-1 rounded-lg h-10 flex-1 border-2 border-gray-300 text-sm font-semibold"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sharing Code Section - Visible only for Female users */}
            {user?.gender === 'Female' && (
              <Card className="border-0 shadow-lg rounded-xl overflow-hidden mt-4">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-100 px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center">
                        <span className="text-rose-600 text-xs font-bold">🔗</span>
                      </div>
                      <h2 className="text-base font-bold text-gray-900">Period Tracker Sharing</h2>
                    </div>
                  </div>
                </div>
                <CardContent className="pt-4 pb-3 space-y-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                    <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                      <span role="img" aria-label="info">ℹ️</span>
                      How Sharing Works
                    </h3>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Share your period tracker with trusted partners</li>
                      <li>• They can view your cycle data and provide support</li>
                      <li>• Code expires after 1 year for security</li>
                      <li>• You can regenerate the code anytime</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span role="img" aria-label="key">🔑</span>
                      Your Sharing Code
                    </Label>
                    
                    {sharingCode ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 px-4 py-3 rounded-lg border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 text-center">
                            <div className="text-lg font-mono font-bold tracking-widest text-rose-800">
                              {showSharingCode ? sharingCode : '••••••••'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSharingCode(!showSharingCode)}
                            className="h-9 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            {showSharingCode ? (
                              <>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3 mr-1" />
                                Show
                              </>
                            )}
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 text-xs border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => {
                              if (sharingCode) {
                                navigator.clipboard.writeText(sharingCode);
                                toast({ 
                                  title: '📋 Copied!', 
                                  description: 'Sharing code copied to clipboard' 
                                });
                              }
                            }}
                          >
                            📋 Copy
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleRegenerateSharingCode}
                            className="h-9 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                          >
                            🔄 New
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-4xl mb-3">🔐</div>
                        <p className="text-sm text-gray-600 mb-4">No sharing code generated yet</p>
                        <Button
                          onClick={handleRegenerateSharingCode}
                          className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium py-2 px-6 rounded-lg text-sm"
                        >
                          Generate Sharing Code
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-yellow-100/50 rounded-lg p-3 border border-amber-200/50">
                    <h4 className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1">
                      <span role="img" aria-label="warning">⚠️</span>
                      Security Notice
                    </h4>
                    <p className="text-xs text-amber-700">
                      Only share this code with people you trust completely. They will have full access to your period tracking data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Sharing Redeem Modal */}
      <SharingRedeemModal 
        isOpen={showRedeemModal} 
        onClose={() => setShowRedeemModal(false)} 
      />
    </>
  );
};

export default ProfilePage;
