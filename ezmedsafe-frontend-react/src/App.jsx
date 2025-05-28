import React from 'react';
import MedicationList from './components/MedicationList';

function App() {
  return (
    <div className='bg-red-500 items-center justify-center h-screen'>
      <h1 className='text-white text-4xl font-bold'>
        ezMedSafe Frontend React and Vite
      </h1>
      <MedicationList />
    </div>
  );
}

export default App;
