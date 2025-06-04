import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MedicationInput({
  onMedicationSelect,
  initialMedication = '',
  label = 'Medication'
}) {
  const [query, setQuery] = useState(initialMedication);
  const [suggestions, setSuggestions] = useState([]);
  const [allMedications, setAllMedications] = useState([]);

  useEffect(() => {
    const fetchMedications = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/medications`,
          {
            headers: {
              'X-API-KEY': import.meta.env.VITE_API_KEY
            }
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAllMedications(data);
        setSuggestions(data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching medications:', error);
      }
    };
    fetchMedications();
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  useEffect(() => {
    if (query.length > 1) {
      const filtered = allMedications
        .filter((med) => med.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, allMedications]);

  const handleSelectSuggestion = (med) => {
    setQuery(med.name);
    setSuggestions([]);
    onMedicationSelect(med);
  };

  const handleBlur = () => {
    if (
      query &&
      !suggestions.some((s) => s.name.toLowerCase() === query.toLowerCase())
    ) {
      onMedicationSelect({ name: query });
    }
  };

  return (
    <div className='relative space-y-2'>
      <Label htmlFor={`${label}-input`}>{label}</Label>
      <Input
        id={`${label}-input`}
        type='text'
        value={query}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className='w-full'
      />
      {suggestions.length > 0 && (
        <ul className='absolute z-10 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1'>
          {suggestions.map((med) => (
            <li
              key={med.id}
              className='px-3 py-2 cursor-pointer hover:bg-gray-100'
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectSuggestion(med);
              }}
            >
              {med.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MedicationInput;
