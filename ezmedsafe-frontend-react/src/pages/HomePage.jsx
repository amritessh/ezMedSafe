import React, { useState, useEffect } from 'react';
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
import AlertCard from '@/components/AlertCard';

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
      setPatientContext({});
      setShowNewPatientModal(true);
    } else {
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
        patientContext,
        existingMedications,
        newMedication,
        patientProfileIdToSend
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
    <div className='min-h-screen flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-900'>
      {' '}
      {/* Consistent background */}
      <h1 className='text-5xl md:text-6xl font-extrabold text-blue-700 dark:text-blue-400 mb-10 tracking-tight text-center'>
        {' '}
        {/* Responsive text size */}
        ezMedSafe
      </h1>
      <Card className='w-full max-w-3xl mb-8 p-6 shadow-xl rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800'>
        {' '}
        {/* Enhanced card styling */}
        <CardHeader className='pb-6 border-b border-gray-200 dark:border-gray-700'>
          {' '}
          {/* Bottom border for header */}
          <CardTitle className='text-3xl font-bold text-gray-800 dark:text-gray-100'>
            Check Drug Interactions
          </CardTitle>
          <CardDescription className='text-gray-600 dark:text-gray-400 mt-2'>
            Enter patient context and medications to identify potential
            interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6 space-y-8'>
          {' '}
          {/* Increased top padding and vertical spacing */}
          {/* Patient Profile Selection/Creation */}
          <div className='space-y-4'>
            <Label
              htmlFor='patient-profile-select'
              className='text-lg font-semibold text-gray-700 dark:text-gray-200'
            >
              Patient Profile
            </Label>
            <div className='flex flex-col md:flex-row gap-4'>
              <Select
                value={selectedPatientProfileId || ''}
                onValueChange={handlePatientProfileSelectChange}
              >
                <SelectTrigger className='flex-grow border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white'>
                  {' '}
                  {/* Input styling */}
                  <SelectValue placeholder='Select existing profile or create new' />
                </SelectTrigger>
                <SelectContent className='dark:bg-gray-700 dark:text-white'>
                  {' '}
                  {/* Dropdown styling */}
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
                className='md:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-md transition-colors'
              >
                {selectedPatientProfileId === 'new-profile' ||
                userPatientProfiles.length === 0
                  ? 'Create New'
                  : 'Edit Selected'}
              </Button>
            </div>
            {selectedPatientProfileId === 'new-profile' && (
              <p className='text-sm text-blue-500 dark:text-blue-300 mt-2'>
                A new profile will be created with the context entered below.
              </p>
            )}
          </div>
          {/* Existing Medications Input */}
          <div className='space-y-4'>
            <Label className='text-lg font-semibold text-gray-700 dark:text-gray-200'>
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
                    className='inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 transition-colors duration-200 hover:bg-blue-200 dark:hover:bg-blue-700 cursor-pointer shadow-sm'
                  >
                    {med.name}
                    <button
                      onClick={() => handleRemoveExistingMed(med)}
                      className='ml-2 text-blue-800 dark:text-blue-100 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none'
                    >
                      &times;
                    </button>
                  </span>
                ))
              ) : (
                <p className='text-gray-500 dark:text-gray-400 text-sm'>
                  No existing medications added.
                </p>
              )}
            </div>
          </div>
          {/* New Medication Input */}
          <div className='space-y-4'>
            <Label className='text-lg font-semibold text-gray-700 dark:text-gray-200'>
              New Medication to Check
            </Label>
            <MedicationInput
              onMedicationSelect={handleNewMedSelect}
              label='New Medication'
            />
            {newMedication && newMedication.name ? (
              <p className='text-sm text-gray-600 dark:text-gray-300'>
                Checking for:{' '}
                <span className='font-bold text-gray-800 dark:text-gray-100'>
                  {newMedication.name}
                </span>
              </p>
            ) : (
              <p className='text-gray-500 dark:text-gray-400 text-sm'>
                No new medication selected.
              </p>
            )}
          </div>
          <Button
            onClick={handleCheckInteractions}
            className='w-full py-3 text-lg font-bold bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-md shadow-md transition-colors'
            disabled={loading}
          >
            {loading ? 'Checking Interactions...' : 'Check Interactions'}
          </Button>
          {error && (
            <p className='text-red-500 dark:text-red-400 text-sm text-center mt-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md'>
              {' '}
              {/* Styled error message */}
              {error}
            </p>
          )}
        </CardContent>
      </Card>
      {alerts.length > 0 && (
        <Card className='w-full max-w-3xl p-6 shadow-xl rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800'>
          {' '}
          {/* Enhanced card styling */}
          <CardHeader className='pb-4 border-b border-gray-200 dark:border-gray-700'>
            <CardTitle className='text-3xl font-bold text-orange-700 dark:text-orange-400'>
              Interaction Alerts
            </CardTitle>
            <CardDescription className='text-gray-600 dark:text-gray-400 mt-2'>
              AI-powered insights based on your input.
            </CardDescription>
          </CardHeader>
          <CardContent className='pt-6 space-y-6'>
            {alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} />
            ))}
          </CardContent>
        </Card>
      )}
      {/* New Patient Profile Modal */}
      <Dialog open={showNewPatientModal} onOpenChange={setShowNewPatientModal}>
        <DialogContent className='sm:max-w-[425px] dark:bg-gray-800 dark:text-white border-gray-700'>
          {' '}
          {/* Modal styling */}
          <DialogHeader className='border-b border-gray-200 dark:border-gray-700 pb-4'>
            <DialogTitle className='text-2xl font-bold dark:text-white'>
              Create/Edit Patient Profile
            </DialogTitle>
            <DialogDescription className='dark:text-gray-400'>
              Enter details for a new or existing patient profile.
            </DialogDescription>
          </DialogHeader>
          <PatientContextForm
            patientContext={patientContext}
            onContextChange={setPatientContext}
          />
          <DialogFooter className='border-t border-gray-200 dark:border-gray-700 pt-4'>
            <Button
              onClick={() => setShowNewPatientModal(false)}
              variant='outline'
              className='dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleSavePatientProfile(patientContext)}
              className='bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
            >
              Save Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HomePage;
