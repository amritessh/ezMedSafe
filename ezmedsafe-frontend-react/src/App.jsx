import React, { useState } from 'react';
import MedicationInput from './components/MedicationInput';
import PatientContextForm from './components/PatientContextForm';
import { Button } from './components/ui/button'; // Shadcn Button
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card'; // Shadcn Card for alerts
import { Label } from '@/components/ui/label'; // Shadcn Label
import './index.css'; // Tailwind CSS

function App() {
  const [existingMedications, setExistingMedications] = useState([]);
  const [newMedication, setNewMedication] = useState(null);
  const [patientContext, setPatientContext] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleCheckInteractions = async () => {
    if (!newMedication || !newMedication.name) {
      setError('Please enter a new medication to check.');
      return;
    }
    setLoading(true);
    setError(null);
    setAlerts([]); // Clear previous alerts

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/check-interactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': import.meta.env.VITE_API_KEY // Your API key from frontend .env
          },
          body: JSON.stringify({
            patientContext,
            existingMedications,
            newMedication
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      setAlerts(data.alerts || []); // Expecting { alerts: [...] }
    } catch (err) {
      console.error('Error checking interactions:', err);
      setError(err.message || 'An unexpected error occurred.');
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
          <PatientContextForm
            patientContext={patientContext}
            onContextChange={setPatientContext}
          />

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
              <div
                key={index}
                className='border-b border-gray-200 pb-4 last:border-b-0 last:pb-0'
              >
                <p
                  className={`font-semibold text-lg ${
                    alert.severity === 'High'
                      ? 'text-red-600'
                      : 'text-orange-500'
                  }`}
                >
                  {alert.severity} Alert: {alert.drugA} + {alert.drugB}
                </p>
                <p className='text-gray-700 mt-1'>
                  <span className='font-medium'>Explanation:</span>{' '}
                  {alert.explanation}
                </p>
                <p className='text-gray-700 mt-1'>
                  <span className='font-medium'>Implication:</span>{' '}
                  {alert.clinicalImplication}
                </p>
                <p className='text-gray-700 mt-1'>
                  <span className='font-medium'>Recommendation:</span>{' '}
                  {alert.recommendation}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default App;
