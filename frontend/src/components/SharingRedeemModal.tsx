import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { X, Key, UserCheck } from 'lucide-react';

interface SharingRedeemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SharingRedeemModal = ({ isOpen, onClose }: SharingRedeemModalProps) => {
  const [sharingCode, setSharingCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemedProfile, setRedeemedProfile] = useState<any>(null);

  const handleRedeemCode = async () => {
    if (!sharingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sharing code",
        variant: "destructive",
      });
      return;
    }

    setIsRedeeming(true);
    try {
      const API_BASE_URL = 'https://medilingoath.vercel.app';
      const response = await fetch(`${API_BASE_URL}/api/share?action=redeem`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medilingo_token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sharingCode: sharingCode.trim().toUpperCase() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to redeem sharing code');
      }

      const data = await response.json();
      setRedeemedProfile(data.owner);
      
      toast({
        title: "Success!",
        description: data.alreadyShared 
          ? "You already have access to this profile" 
          : "Successfully redeemed sharing code!",
      });
    } catch (error) {
      console.error('Error redeeming sharing code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to redeem sharing code",
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleClose = () => {
    setSharingCode('');
    setRedeemedProfile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md bg-white shadow-xl">
        <CardHeader className="pb-2 sm:pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Key className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <span className="text-sm sm:text-base">Redeem Sharing Code</span>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
          {!redeemedProfile ? (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-2.5 sm:p-3 border border-blue-200/50">
                <h3 className="text-xs sm:text-sm font-semibold text-blue-800 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                  <span role="img" aria-label="info">ℹ️</span>
                  About Sharing Codes
                </h3>
                <ul className="text-xs text-blue-700 space-y-0.5 sm:space-y-1">
                  <li>• Enter a code shared by a female user</li>
                  <li>• Gain access to their period tracker data</li>
                  <li>• Support them during their cycle</li>
                  <li>• Codes are 8 characters long</li>
                </ul>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="sharingCode" className="text-xs sm:text-sm font-semibold text-gray-700">
                  Enter Sharing Code
                </Label>
                <Input
                  id="sharingCode"
                  value={sharingCode}
                  onChange={(e) => setSharingCode(e.target.value.toUpperCase())}
                  placeholder="Enter 8-character code"
                  maxLength={8}
                  className="text-center font-mono text-base sm:text-lg tracking-widest border-2 border-blue-200 focus:border-blue-500 h-12 sm:h-auto"
                />
              </div>

              <div className="flex gap-2 pt-1 sm:pt-2">
                <Button
                  onClick={handleRedeemCode}
                  disabled={isRedeeming || sharingCode.length !== 8}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base h-10 sm:h-auto"
                >
                  {isRedeeming ? 'Redeeming...' : 'Redeem Code'}
                </Button>
                <Button
                  onClick={handleClose}
                  variant="outline"
                  className="flex-1 text-sm sm:text-base h-10 sm:h-auto"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Access Granted!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                  You now have access to {redeemedProfile.name}'s period tracker data.
                </p>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-2.5 sm:p-3 border border-green-200/50">
                  <div className="text-xs sm:text-sm">
                    <div className="font-semibold text-green-800">{redeemedProfile.name}</div>
                    <div className="text-green-700 break-all">{redeemedProfile.email}</div>
                    <div className="text-green-600 text-xs mt-1">
                      {redeemedProfile.age} years old • {redeemedProfile.gender}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-10 sm:h-auto"
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SharingRedeemModal;