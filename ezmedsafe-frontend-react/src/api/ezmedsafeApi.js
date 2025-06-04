const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

        // Helper to get API key from localStorage
        const getApiKey = () => localStorage.getItem('ezmedsafe_api_key');

        // Generic fetch wrapper with auth header
        const apiFetch = async (endpoint, options = {}) => {
          const apiKey = getApiKey();
          const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
          };

          if (apiKey) {
            headers['X-API-Key'] = apiKey;
          }

          const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });

          // Handle API-specific errors (e.g., 401 Unauthorized from backend)
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            const error = new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            throw error;
          }

          return response.json();
        };

        // --- API Endpoints ---

        export const authApi = {
          login: (apiKey) => apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ apiKey }),
            headers: { 'X-API-Key': apiKey } // Send API key in header for auth check
          }),
        };

        export const medicationsApi = {
          getAll: () => apiFetch('/medications'),
        };

        export const interactionsApi = {
          check: (patientContext, existingMedications, newMedication) => apiFetch('/check-interactions', {
            method: 'POST',
            body: JSON.stringify({ patientContext, existingMedications, newMedication }),
          }),
        };

        export const patientProfilesApi = {
            create: (profileData) => apiFetch('/patient-profiles', {
                method: 'POST',
                body: JSON.stringify(profileData),
            }),
            getAll: () => apiFetch('/patient-profiles'),
        };

        export const alertHistoryApi = {
            getHistory: () => apiFetch('/alerts/history'),
        };