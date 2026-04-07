import { useState } from "react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";

interface BookAppointmentPatientProps {
  onSuccess?: () => void;
}

const BookAppointmentPatient = ({ onSuccess }: BookAppointmentPatientProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorName: "",
    specialty: "",
    date: "",
    time: "",
    location: "",
    reason: "",
  });

  const specialties = [
    "General Practice",
    "Cardiology",
    "Neurology",
    "Orthopedics",
    "Dermatology",
    "Pediatrics",
    "Psychiatry",
    "Surgery",
    "ENT",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/patient/appointments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("medilingo_token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to book appointment");
      }

      toast({
        title: "Success",
        description: "Appointment booked successfully",
      });

      setFormData({
        doctorName: "",
        specialty: "",
        date: "",
        time: "",
        location: "",
        reason: "",
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Book Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book an Appointment</DialogTitle>
          <DialogDescription>
            Schedule a consultation with a doctor
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="doctorName">Doctor Name</Label>
            <Input
              id="doctorName"
              placeholder="e.g., Dr. John Smith"
              value={formData.doctorName}
              onChange={(e) =>
                setFormData({ ...formData, doctorName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Select
              value={formData.specialty}
              onValueChange={(value) =>
                setFormData({ ...formData, specialty: value })
              }
            >
              <SelectTrigger id="specialty">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location/Hospital</Label>
            <Input
              id="location"
              placeholder="Hospital or clinic name"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="reason">Reason for Visit</Label>
            <Textarea
              id="reason"
              placeholder="Describe your symptoms or reason for consultation"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookAppointmentPatient;
