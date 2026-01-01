import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Heart, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMenstrualCycle } from '@/contexts/MenstrualCycleContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';

const PeriodTrackerPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { settings, status, updateSettings } = useMenstrualCycle();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    cycleLength: settings.cycleLength,
    periodDuration: settings.periodDuration,
    lastPeriodStart: settings.lastPeriodStart || '',
  });

  useEffect(() => {
    setFormData({
      cycleLength: settings.cycleLength,
      periodDuration: settings.periodDuration,
      lastPeriodStart: settings.lastPeriodStart || '',
    });
  }, [settings]);

  const handleSave = () => {
    if (formData.cycleLength < 20 || formData.cycleLength > 40) {
      toast({
        title: 'Invalid cycle length',
        description: 'Cycle length should be between 20-40 days',
        variant: 'destructive',
      });
      return;
    }

    if (formData.periodDuration < 2 || formData.periodDuration > 10) {
      toast({
        title: 'Invalid period length',
        description: 'Period length should be between 2-10 days',
        variant: 'destructive',
      });
      return;
    }

    updateSettings({
      cycleLength: formData.cycleLength,
      periodDuration: formData.periodDuration,
      lastPeriodStart: formData.lastPeriodStart,
    });

    setIsEditing(false);
    toast({
      title: '✅ Cycle updated',
      description: 'Your menstrual cycle information has been saved',
    });
  };

  const daysUntilPeriod = status.daysUntil !== null ? Math.max(0, status.daysUntil) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-pink-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Period Tracker</h1>
              <p className="text-xs text-gray-500">Monitor your menstrual cycle</p>
            </div>
          </div>
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'destructive' : 'default'}
            size="sm"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Next Period */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-pink-600 font-semibold mb-1">Next Period</p>
                  <p className="text-3xl font-bold text-pink-700">{daysUntilPeriod}</p>
                  <p className="text-xs text-pink-600 mt-1">days away</p>
                  {status.nextPeriodStart && (
                    <p className="text-xs text-gray-600 mt-2">
                      {status.nextPeriodStart.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-lg bg-pink-200/50 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ovulation */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-purple-600 font-semibold mb-1">Ovulation (Approx)</p>
                  <p className="text-3xl font-bold text-purple-700">{Math.max(0, Math.floor(settings.cycleLength / 2) - (status.daysUntil !== null ? status.daysUntil : 0))}</p>
                  <p className="text-xs text-purple-600 mt-1">days away (approx)</p>
                  <p className="text-xs text-gray-500 mt-2">Typically around cycle midpoint</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-200/50 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-teal-600 font-semibold mb-1">Status</p>
                  <p className="text-lg font-bold text-teal-700">{status.countdownLabel}</p>
                  {status.isDelayed && (
                    <p className="text-xs text-red-600 mt-2">Period is delayed</p>
                  )}
                  {!status.isDelayed && status.daysUntil !== null && status.daysUntil <= 7 && (
                    <p className="text-xs text-amber-600 mt-2">Period coming soon</p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-lg bg-teal-200/50 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cycle Details */}
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-amber-600 font-semibold mb-1">Cycle Stats</p>
                  <div className="space-y-2 mt-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Cycle:</span> {settings.cycleLength} days
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Period:</span> {settings.periodDuration} days
                    </p>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-200/50 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Edit Settings */}
        {isEditing && (
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Update Cycle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cycle-length" className="text-sm font-semibold">
                    Cycle Length (days)
                  </Label>
                  <Input
                    id="cycle-length"
                    type="number"
                    min="20"
                    max="40"
                    value={formData.cycleLength}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cycleLength: parseInt(e.target.value) || 28,
                      })
                    }
                    className="border-2 border-blue-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-600">Usually 21-35 days (average 28)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period-length" className="text-sm font-semibold">
                    Period Length (days)
                  </Label>
                  <Input
                    id="period-length"
                    type="number"
                    min="2"
                    max="10"
                    value={formData.periodDuration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        periodDuration: parseInt(e.target.value) || 5,
                      })
                    }
                    className="border-2 border-blue-300 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-600">Usually 3-7 days (average 5)</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-period" className="text-sm font-semibold">
                  Last Period Started
                </Label>
                <Input
                  id="last-period"
                  type="date"
                  value={formData.lastPeriodStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lastPeriodStart: e.target.value,
                    })
                  }
                  className="border-2 border-blue-300 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Menstrual Phase</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-700">
              <p>
                <strong>Days 1-5:</strong> Menstruation, shedding of uterine lining
              </p>
              <p className="text-xs text-gray-600 mt-1">
                💡 Tip: Stay hydrated, eat iron-rich foods, gentle exercise
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Follicular Phase</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-700">
              <p>
                <strong>Days 1-13:</strong> Rising estrogen, follicle development
              </p>
              <p className="text-xs text-gray-600 mt-1">
                💡 Tip: Increased energy, good time for workouts and planning
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Ovulation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-700">
              <p>
                <strong>Days 14-15:</strong> Egg release, peak fertility window
              </p>
              <p className="text-xs text-gray-600 mt-1">
                💡 Tip: Most fertile days, peak energy and mood
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Luteal Phase</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-700">
              <p>
                <strong>Days 15-28:</strong> Progesterone rises, preparing for menstruation
              </p>
              <p className="text-xs text-gray-600 mt-1">
                💡 Tip: Focus on nutrition, rest, and stress management
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips & Resources */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg">Health Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-lg">💧</span>
              <p>
                <strong>Stay Hydrated:</strong> Drink 8-10 glasses of water daily, especially
                during menstruation
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">🥗</span>
              <p>
                <strong>Balanced Diet:</strong> Include iron, calcium, and B vitamins
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">😴</span>
              <p>
                <strong>Sleep:</strong> Aim for 7-9 hours, adjust based on cycle phase
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-lg">🏃</span>
              <p>
                <strong>Exercise:</strong> Adjust intensity based on energy levels and phase
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
          <p className="font-semibold mb-2">📋 Disclaimer</p>
          <p>
            This period tracker provides estimates based on typical cycle patterns. Individual cycles
            vary. If you experience irregular periods or have concerns, consult a healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PeriodTrackerPage;
