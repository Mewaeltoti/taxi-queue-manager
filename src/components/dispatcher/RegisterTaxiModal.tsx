import { useState } from 'react';
import { Car, User, Tag, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface RegisterTaxiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { plateNumber: string; driverName: string; taxiType: string }) => void;
}

export function RegisterTaxiModal({ open, onOpenChange, onSubmit }: RegisterTaxiModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [taxiType, setTaxiType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plateNumber || !driverName || !taxiType) {
      toast.error('Please fill in all fields');
      return;
    }

    onSubmit({ plateNumber, driverName, taxiType });
    setPlateNumber('');
    setDriverName('');
    setTaxiType('');
    onOpenChange(false);
    toast.success(`Taxi ${plateNumber} added to queue`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            Register Taxi to Queue
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="plate" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Plate Number
            </Label>
            <Input
              id="plate"
              placeholder="e.g., TX-1234"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Driver Name
            </Label>
            <Input
              id="driver"
              placeholder="e.g., John Smith"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Taxi Type
            </Label>
            <Select value={taxiType} onValueChange={setTaxiType}>
              <SelectTrigger>
                <SelectValue placeholder="Select taxi type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="suv">SUV</SelectItem>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="minibus">Minibus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Add to Queue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
