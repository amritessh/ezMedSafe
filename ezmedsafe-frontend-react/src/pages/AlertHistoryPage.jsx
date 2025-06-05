import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { alertHistoryApi } from '@/api/ezmedsafeApi'; // New API import
import { toast } from 'sonner';

function AlertHistoryPage() {
  const { userId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchedAlerts = await alertHistoryApi.getHistory();
        setAlerts(fetchedAlerts);
      } catch (err) {
        console.error('Error fetching alert history:', err);
        setError(err.message || 'Failed to load alert history.');
        toast.error('Failed to load alert history.');
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [userId]); // Refetch when userId changes

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center'>
        <p className='text-lg text-gray-700'>Loading alert history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center'>
        <p className='text-lg text-red-600'>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center'>
      <h1 className='text-5xl font-extrabold text-blue-700 mb-10 tracking-tight'>
        Alert History
      </h1>
      <Card className='w-full max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-2xl'>Past Interaction Alerts</CardTitle>
          <CardDescription>
            Review your previously generated drug interaction alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          {alerts.length === 0 ? (
            <p className='text-gray-600'>
              No alerts found yet. Generate some on the Home page!
            </p>
          ) : (
            alerts.map((alertRecord) => (
              <div
                key={alertRecord.id}
                className='border-b border-gray-200 pb-4 last:border-b-0 last:pb-0'
              >
                {/* Assuming alertRecord.alertData contains the DDIAlert structure */}
                <p
                  className={`font-semibold text-lg ${
                    alertRecord.alertData.severity === 'High'
                      ? 'text-red-600'
                      : 'text-orange-500'
                  }`}
                >
                  {alertRecord.alertData.severity} Alert:{' '}
                  {alertRecord.alertData.drugA} + {alertRecord.alertData.drugB}
                </p>
                <p className='text-gray-700 text-sm'>
                  Checked on: {new Date(alertRecord.createdAt).toLocaleString()}
                </p>
                <p className='text-gray-700 text-sm'>
                  Patient: {alertRecord.patientInfo}
                </p>
                <p className='text-gray-700 text-sm'>
                  New Medication: {alertRecord.newMedicationName}
                </p>
                <p className='text-gray-700 mt-2'>
                  <span className='font-medium'>Explanation:</span>{' '}
                  {alertRecord.alertData.explanation}
                </p>
                <p className='text-gray-700 mt-1'>
                  <span className='font-medium'>Implication:</span>{' '}
                  {alertRecord.alertData.clinicalImplication}
                </p>
                <p className='text-gray-700 mt-1'>
                  <span className='font-medium'>Recommendation:</span>{' '}
                  {alertRecord.alertData.recommendation}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertHistoryPage;
