import React, { useState, useEffect } from 'react';

function MedicationList() {
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/medications`,
          {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY
            }
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setMedications(data);
        console.log('Medications from Supabase:', data);
      } catch (error) {
        console.error('Error fetching medications:', error);
      }
    };
    fetchMedications();
  }, []);
  return (
    <div>
      <h2>Medication List (Check console)</h2>
    </div>
  );
}

export default MedicationList;
