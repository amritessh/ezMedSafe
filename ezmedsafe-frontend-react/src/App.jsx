import React, { useState } from 'react';
import MedicationList from './components/MedicationList';
import { Button } from '@/components/ui/button';

function App() {
  const [loading, setLoading] = useState(false);

  const handleCheckInteractions = async () => {
    setLoading(true);
    try {
      // TODO: Implement interaction check logic
      console.log('Checking interactions...');
    } catch (error) {
      console.error('Error checking interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-red-500 items-center justify-center h-screen'>
      <h1 className='text-white text-4xl font-bold'>
        ezMedSafe Frontend React and Vite
      </h1>
      <Button
        onClick={handleCheckInteractions}
        disabled={loading}
        className='w-full'
      >
        {loading ? 'Checking Interactions...' : 'Check Interactions'}
      </Button>
      <MedicationList />
    </div>
  );
}

export default App;
