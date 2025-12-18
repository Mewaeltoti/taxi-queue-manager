import { useState } from 'react';
import { Car, User, Tag } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext'; // <— updated

interface RegisterTaxiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { plateNumber: string; driverName: string; taxiType: string }) => void;
}
function validateTaxiForm(
  plateNumber: string,
  driverName: string,
  taxiType: string,
  t: (key: string) => string
) {
  if (!plateNumber || !driverName || !taxiType) {
    return t('fillAllFields');
  }

  if (plateNumber.length < 3) {
    return t('invalidPlate');
  }

  return null;
}

export function RegisterTaxiModal({ open, onOpenChange, onSubmit }: RegisterTaxiModalProps) {
  const [plateNumber, setPlateNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [taxiType, setTaxiType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage(); // <— get translations from context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validateTaxiForm(
      plateNumber,
      driverName,
      taxiType,
      t
    );

    if (error) {
      toast.error(error);
      return;
    }

    try {
      setIsSubmitting(true);

      await onSubmit({ plateNumber, driverName, taxiType });

      setPlateNumber('');
      setDriverName('');
      setTaxiType('');
      onOpenChange(false);

      toast.success(`${t('taxi')} ${plateNumber} ${t('addedToQueue')}`);
    } catch (err) {
      toast.error(t('failedToRegisterTaxi'));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-accent" />
            {t('registerTaxi')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="plate" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {t('plateNumber')}
            </Label>
            <Input
              id="plate"
              placeholder={t('platePlaceholder')}
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('driverName')}
            </Label>
            <Input
              id="driver"
              placeholder={t('driverPlaceholder')}
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t('taixType')}
            </Label>
            <Input
              id="type"
              placeholder={t('typePlaceholder')}
              value={taxiType}
              onChange={(e) => setTaxiType(e.target.value)}
            />
          </div>

         
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isSubmitting ? t('saving') : t('addToQueue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
