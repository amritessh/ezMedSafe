import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'; // Shadcn Select
import { Checkbox } from '@/components/ui/checkbox'; // Shadcn Checkbox

function PatientContextForm({ patientContext, onContextChange }) {
  const handleSelectChange = (value) => {
    onContextChange({
      ...patientContext,
      age_group: value
    });
  };

  const handleCheckboxChange = (name, checked) => {
    onContextChange({
      ...patientContext,
      [name]: checked
    });
  };

  return (
    <div className='p-6 border border-gray-200 rounded-lg shadow-sm bg-white mb-6'>
      <h3 className='text-xl font-semibold mb-4 text-gray-800'>
        Patient Context
      </h3>
      <div className='mb-4'>
        <Label htmlFor='age_group' className='mb-2 block'>
          Age Group
        </Label>
        <Select
          onValueChange={handleSelectChange}
          value={patientContext.age_group || ''}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder='Select Age Group' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='Adult'>Adult</SelectItem>
            <SelectItem value='Elderly'>Elderly</SelectItem>
            <SelectItem value='Pediatric'>Pediatric</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-3'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='renal_status'
            checked={patientContext.renal_status || false}
            onCheckedChange={(checked) =>
              handleCheckboxChange('renal_status', checked)
            }
          />
          <Label htmlFor='renal_status'>Renal Impairment</Label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='hepatic_status'
            checked={patientContext.hepatic_status || false}
            onCheckedChange={(checked) =>
              handleCheckboxChange('hepatic_status', checked)
            }
          />
          <Label htmlFor='hepatic_status'>Hepatic Impairment</Label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id='cardiac_status'
            checked={patientContext.cardiac_status || false}
            onCheckedChange={(checked) =>
              handleCheckboxChange('cardiac_status', checked)
            }
          />
          <Label htmlFor='cardiac_status'>Cardiac Disease</Label>
        </div>
      </div>
    </div>
  );
}

export default PatientContextForm;
