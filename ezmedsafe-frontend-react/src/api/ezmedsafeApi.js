const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

            const getApiKey = () => localStorage.getItem('ezmedsafe_api_key');

            const apiFetch = async (endpoint, options = {}) => {
              const apiKey = getApiKey();
              const headers = {
                'Content-Type': 'application/json',
                ...options.headers,
              };

              // For login, API Key is sent in body, not header. Handle this exception.
              // For all other authenticated calls, it's in the header.
              if (endpoint !== '/auth/login' && apiKey) { // Do not add header for login body
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
                // If 401, you might want to trigger logout
                if (response.status === 401 && typeof window !== 'undefined') { // Check if in browser env
                    // This might be handled by a global error handler or context.
                    // For MVP, just log or throw.
                    console.error("Authentication expired or invalid. Please log in again.");
                }
                throw error;
              }

              return response.json();
            };

            // --- API Endpoints ---

            export const authApi = {
              login: (apiKey) => apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ apiKey }),
                // Headers for login are handled explicitly within the login call if needed,
                // or passed by default by apiFetch
                headers: { 'Content-Type': 'application/json' } // Explicitly set for login body
              }),
            };

            export const medicationsApi = {
              getAll: () => apiFetch('/medications'),
            };

            export const interactionsApi = {
              // check function now accepts optional patientProfileId
              check: (patientContext, existingMedications, newMedication, patientProfileId) => apiFetch('/check-interactions', {
                method: 'POST',
                body: JSON.stringify({ patientContext, existingMedications, newMedication, patientProfileId }),
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