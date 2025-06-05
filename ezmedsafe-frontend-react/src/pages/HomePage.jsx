// src/pages/HomePage.jsx (Key changes in the alerts display section)
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
import AlertCard from '@/components/AlertCard'; // Import AlertCard

function HomePage() {
  // ... (existing state and useEffect for fetching patient profiles) ...
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
          setPatientContext(profiles[0]);
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
      setPatientContext(createdProfile);
      setShowNewPatientModal(false);
      toast.success('Patient profile saved successfully!');
    } catch (err) {
      console.error('Error saving patient profile:', err);
      toast.error('Failed to save patient profile.');
    } finally {
      setLoading(false);
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
    <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center'>
      <h1 className='text-5xl font-extrabold text-blue-700 mb-10 tracking-tight'>
        ezMedSafe
      </h1>

      <Card className='w-full max-w-3xl mb-8'>
        <CardHeader>
          <CardTitle className='text-2xl'>Check Drug Interactions</CardTitle>
          <CardDescription>
            Enter patient context and medications to identify potential
            interactions.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Patient Profile Selection/Creation */}
          <div className='space-y-4'>
            <Label htmlFor='patient-profile-select'>
              Select Patient Profile
            </Label>
            <div className='flex space-x-2'>
              <Select
                value={selectedPatientProfileId || ''}
                onValueChange={(value) => setSelectedPatientProfileId(value)}
              >
                <SelectTrigger className='flex-grow'>
                  <SelectValue placeholder='Select existing profile' />
                </SelectTrigger>
                <SelectContent>
                  {userPatientProfiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {`Profile ${profile.ageGroup || 'N/A'} (Renal: ${
                        profile.renalStatus ? 'Yes' : 'No'
                      })`}
                    </SelectItem>
                  ))}
                  <SelectItem value='new-profile'>
                    Create New Profile
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowNewPatientModal(true)}>
                {selectedPatientProfileId === 'new-profile' ||
                userPatientProfiles.length === 0
                  ? 'Create Profile'
                  : 'Edit Current'}
              </Button>
            </div>
            {selectedPatientProfileId === 'new-profile' && (
              <p className='text-sm text-gray-500'>
                Creating a new profile for this interaction check.
              </p>
            )}
          </div>

          {/* Existing Medications Input (unchanged) */}
          <div className='space-y-4'>
            <Label>Existing Medications</Label>
            <MedicationInput
              onMedicationSelect={handleAddExistingMed}
              label='Add Existing Medication'
            />
            <div className='flex flex-wrap gap-2 mt-2'>
              {existingMedications.map((med) => (
                <span
                  key={med.name}
                  className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800'
                >
                  {med.name}
                  <button
                    onClick={() => handleRemoveExistingMed(med)}
                    className='ml-2 text-blue-800 hover:text-blue-600 focus:outline-none'
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* New Medication Input (unchanged) */}
          <div className='space-y-4'>
            <Label>New Medication to Check</Label>
            <MedicationInput
              onMedicationSelect={handleNewMedSelect}
              label='New Medication'
            />
            {newMedication && newMedication.name && (
              <p className='text-sm text-gray-500'>
                Checking for:{' '}
                <span className='font-medium text-gray-700'>
                  {newMedication.name}
                </span>
              </p>
            )}
          </div>

          <Button
            onClick={handleCheckInteractions}
            className='w-full py-3 text-lg'
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
        <Card className='w-full max-w-3xl'>
          <CardHeader>
            <CardTitle className='text-2xl text-orange-600'>
              Interaction Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {alerts.map((alert, index) => (
              // Now using AlertCard component
              <AlertCard key={index} alert={alert} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* New Patient Profile Modal */}
      <Dialog open={showNewPatientModal} onOpenChange={setShowNewPatientModal}>
        <DialogContent>
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
