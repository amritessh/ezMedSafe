import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card'; // Added CardDescription
import AlertCard from '@/components/AlertCard'; // Import AlertCard if you plan to reuse it here
import { useEffect, useState } from 'react'; // Import useEffect and useState
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { alertHistoryApi } from '@/api/ezmedsafeApi'; // Import alertHistoryApi
import { toast } from 'sonner'; // Import toast

function AlertHistoryPage() {
  const { userId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlertHistory = async () => {
      if (!userId) {
        // Ensure userId is available
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const history = await alertHistoryApi.getHistory(); // Fetch from API
        setAlerts(history);
        toast.success('Alert history loaded!');
      } catch (err) {
        console.error('Error fetching alert history:', err);
        setError(err.message || 'Failed to load alert history.');
        toast.error(
          `Error loading history: ${
            err.message || 'An unexpected error occurred.'
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAlertHistory();
  }, [userId]); // Re-fetch when userId changes

  return (
    <div className='min-h-screen flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-900'>
      {' '}
      {/* Consistent background */}
      <h1 className='text-5xl md:text-6xl font-extrabold text-blue-700 dark:text-blue-400 mb-10 tracking-tight text-center'>
        Alert History
      </h1>
      <Card className='w-full max-w-3xl p-6 shadow-xl rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800'>
        {' '}
        {/* Enhanced card styling */}
        <CardHeader className='pb-4 border-b border-gray-200 dark:border-gray-700'>
          <CardTitle className='text-3xl font-bold text-gray-800 dark:text-gray-100'>
            Past Interaction Alerts
          </CardTitle>
          <CardDescription className='text-gray-600 dark:text-gray-400 mt-2'>
            Review previously generated drug interaction alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6 space-y-6'>
          {loading ? (
            <p className='text-center text-gray-500 dark:text-gray-400'>
              Loading alerts...
            </p>
          ) : error ? (
            <p className='text-red-500 dark:text-red-400 text-center'>
              {error}
            </p>
          ) : alerts.length > 0 ? (
            alerts.map((alert, index) => (
              <AlertCard
                key={alert.id || index}
                alert={alert.alertData || alert}
              /> // Assuming alertData contains the full alert or it's directly the alert
            ))
          ) : (
            <p className='text-gray-500 dark:text-gray-400'>
              No alerts found yet. Generate some on the Home page!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertHistoryPage;
