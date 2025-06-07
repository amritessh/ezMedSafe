import { useState, useEffect } from 'react';
import MedicationInput from '@/components/MedicationInput';
import PatientContextForm from '@/components/PatientContextForm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { patientProfilesApi, interactionsApi } from '@/api/ezmedsafeApi';
import { toast } from 'sonner';
import AlertCard from '@/components/AlertCard'; // Import AlertCard

function HomePage() {
  const { userId } = useAuth();
  const [existingMedications, setExistingMedications] = useState([]);
  const [newMedication, setNewMedication] = useState(null);
  const [patientContext, setPatientContext] = useState({});
  const [selectedPatientProfileId, setSelectedPatientProfileId] =
    useState(null);
  const [userPatientProfiles, setUserPatientProfiles] = useState([]);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientProfiles = async () => {
      if (!userId) return;
      try {
        const profiles = await patientProfilesApi.getAll();
        setUserPatientProfiles(profiles);
        if (profiles.length > 0) {
          setSelectedPatientProfileId(profiles[0].id);
          // Load the full patient context if available for the selected profile
          const selectedProfileDetails = profiles.find(
            (p) => p.id === profiles[0].id
          );
          if (selectedProfileDetails) {
            setPatientContext({
              age_group: selectedProfileDetails.ageGroup,
              renal_status: selectedProfileDetails.renalStatus,
              hepatic_status: selectedProfileDetails.hepaticStatus,
              cardiac_status: selectedProfileDetails.cardiacStatus
            });
          }
        }
      } catch (err) {
        console.error('Error fetching patient profiles:', err);
        toast.error('Failed to load patient profiles.');
      }
    };
    fetchPatientProfiles();
  }, [userId]);

  const handleAddExistingMed = (med) => {
    if (
      med &&
      med.name &&
      !existingMedications.some((m) => m.name === med.name)
    ) {
      setExistingMedications([...existingMedications, med]);
    }
  };

  const handleRemoveExistingMed = (medToRemove) => {
    setExistingMedications(
      existingMedications.filter((med) => med.name !== medToRemove.name)
    );
  };

  const handleNewMedSelect = (med) => {
    setNewMedication(med);
  };

  const handleSavePatientProfile = async (newContext) => {
    try {
      setLoading(true);
      const createdProfile = await patientProfilesApi.create(newContext);
      setUserPatientProfiles((prev) => [...prev, createdProfile]);
      setSelectedPatientProfileId(createdProfile.id);
      setPatientContext({
        // Set the context for the new profile
        age_group: createdProfile.ageGroup,
        renal_status: createdProfile.renalStatus,
        hepatic_status: createdProfile.hepaticStatus,
        cardiac_status: createdProfile.cardiacStatus
      });
      setShowNewPatientModal(false);
      toast.success('Patient profile saved successfully!');
    } catch (err) {
      console.error('Error saving patient profile:', err);
      toast.error('Failed to save patient profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientProfileSelectChange = (value) => {
    setSelectedPatientProfileId(value);
    if (value === 'new-profile') {
      setPatientContext({}); // Clear context for new profile creation
      setShowNewPatientModal(true);
    } else {
      // Load context of selected existing profile
      const selectedProfileDetails = userPatientProfiles.find(
        (p) => p.id === value
      );
      if (selectedProfileDetails) {
        setPatientContext({
          age_group: selectedProfileDetails.ageGroup,
          renal_status: selectedProfileDetails.renalStatus,
          hepatic_status: selectedProfileDetails.hepaticStatus,
          cardiac_status: selectedProfileDetails.cardiacStatus
        });
      }
    }
  };

  const handleCheckInteractions = async () => {
    if (!newMedication || !newMedication.name) {
      setError('Please enter a new medication to check.');
      toast.error('Please enter a new medication to check.');
      return;
    }
    if (!selectedPatientProfileId && !patientContext.age_group) {
      // Ensure a profile is chosen or new context entered
      setError('Please select or create a patient profile.');
      toast.error('Please select or create a patient profile.');
      return;
    }

    setLoading(true);
    setError(null);
    setAlerts([]);

    try {
      let patientProfileIdToSend = null;
      if (
        selectedPatientProfileId &&
        selectedPatientProfileId !== 'new-profile'
      ) {
        patientProfileIdToSend = selectedPatientProfileId;
      }

      const data = await interactionsApi.check(
        patientContext, // Always send patientContext for potential new profile or contextual filtering
        existingMedications,
        newMedication,
        patientProfileIdToSend // ONLY send a UUID if an existing profile is truly selected
      );
      setAlerts(data.alerts || []);
      toast.success('Interaction check complete!');
    } catch (err) {
      console.error('Error checking interactions:', err);
      setError(err.message || 'An unexpected error occurred.');
      toast.error(`Error: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center'>
      <h1 className='text-5xl font-extrabold text-blue-700 mb-10 tracking-tight'>
        ezMedSafe
      </h1>

      <Card className='w-full max-w-3xl mb-8 p-6'>
        {' '}
        {/* Added p-6 for card content padding */}
        <CardHeader className='pb-4'>
          {' '}
          {/* Added pb-4 for spacing */}
          <CardTitle className='text-3xl font-bold text-gray-800'>
            Check Drug Interactions
          </CardTitle>
          <CardDescription className='text-gray-600'>
            Enter patient context and medications to identify potential
            interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-8'>
          {' '}
          {/* Increased space-y for more vertical separation */}
          {/* Patient Profile Selection/Creation */}
          <div className='space-y-4'>
            <Label
              htmlFor='patient-profile-select'
              className='text-lg font-semibold text-gray-700'
            >
              Patient Profile
            </Label>
            <div className='flex flex-col md:flex-row gap-4'>
              {' '}
              {/* Responsive flex */}
              <Select
                value={selectedPatientProfileId || ''}
                onValueChange={handlePatientProfileSelectChange}
              >
                <SelectTrigger className='flex-grow'>
                  <SelectValue placeholder='Select existing profile or create new' />
                </SelectTrigger>
                <SelectContent>
                  {userPatientProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {`Profile: ${profile.ageGroup || 'N/A'}, Renal: ${
                        profile.renalStatus ? 'Yes' : 'No'
                      }, Hepatic: ${
                        profile.hepaticStatus ? 'Yes' : 'No'
                      }, Cardiac: ${profile.cardiacStatus ? 'Yes' : 'No'}`}
                    </SelectItem>
                  ))}
                  <SelectItem value='new-profile'>
                    Create New Profile
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handlePatientProfileSelectChange('new-profile')}
                className='md:w-auto'
              >
                {selectedPatientProfileId === 'new-profile' ||
                userPatientProfiles.length === 0
                  ? 'Create New'
                  : 'Edit Selected'}
              </Button>
            </div>
            {selectedPatientProfileId === 'new-profile' && (
              <p className='text-sm text-blue-500'>
                A new profile will be created with the context entered below.
              </p>
            )}
          </div>
          {/* Existing Medications Input */}
          <div className='space-y-4'>
            <Label className='text-lg font-semibold text-gray-700'>
              Existing Medications
            </Label>
            <MedicationInput
              onMedicationSelect={handleAddExistingMed}
              label='Add Existing Medication'
            />
            <div className='flex flex-wrap gap-2 mt-2'>
              {existingMedications.length > 0 ? (
                existingMedications.map((med) => (
                  <span
                    key={med.name}
                    className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 transition-colors duration-200 hover:bg-blue-200 cursor-pointer'
                  >
                    {med.name}
                    <button
                      onClick={() => handleRemoveExistingMed(med)}
                      className='ml-2 text-blue-800 hover:text-blue-600 focus:outline-none'
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <p className='text-gray-500 text-sm'>
                  No existing medications added.
                </p>
              )}
            </div>
          </div>
          {/* New Medication Input */}
          <div className='space-y-4'>
            <Label className='text-lg font-semibold text-gray-700'>
              New Medication to Check
            </Label>
            <MedicationInput
              onMedicationSelect={handleNewMedSelect}
              label='New Medication'
            />
            {newMedication && newMedication.name ? (
              <p className='text-sm text-gray-600'>
                Checking for:{' '}
                <span className='font-bold text-gray-800'>
                  {newMedication.name}
                </span>
              </p>
            ) : (
              <p className='text-gray-500 text-sm'>
                No new medication selected.
              </p>
            )}
          </div>
          <Button
            onClick={handleCheckInteractions}
            className='w-full py-3 text-lg font-bold'
            disabled={loading}
          >
            {loading ? 'Checking Interactions...' : 'Check Interactions'}
          </Button>
          {error && (
            <p className='text-red-500 text-sm text-center mt-2'>{error}</p>
          )}
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className='w-full max-w-3xl p-6'>
          {' '}
          {/* Added p-6 for card content padding */}
          <CardHeader className='pb-4'>
            <CardTitle className='text-3xl font-bold text-orange-700'>
              Interaction Alerts
            </CardTitle>
            <CardDescription className='text-gray-600'>
              AI-powered insights based on your input.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {' '}
            {/* Increased space-y between alerts */}
            {alerts.map((alert, index) => (
              // Now using AlertCard component for consistent display
              <AlertCard key={index} alert={alert} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Patient Profile Modal */}
      <Dialog open={showNewPatientModal} onOpenChange={setShowNewPatientModal}>
        <DialogContent className='sm:max-w-[425px]'>
          {' '}
          {/* Set max-width for smaller modal */}
          <DialogHeader>
            <DialogTitle>Create/Edit Patient Profile</DialogTitle>
            <DialogDescription>
              Enter details for a new or existing patient profile.
            </DialogDescription>
          </DialogHeader>
          <PatientContextForm
            patientContext={patientContext}
            onContextChange={setPatientContext}
          />
          <DialogFooter>
            <Button
              onClick={() => setShowNewPatientModal(false)}
              variant='outline'
            >
              Cancel
            </Button>
            <Button onClick={() => handleSavePatientProfile(patientContext)}>
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HomePage;
