// src/pages/AlertHistoryPage.jsx (Key changes in the alerts display section)
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { alertHistoryApi } from '@/api/ezmedsafeApi';
import { toast } from 'sonner';
import AlertCard from '../components/AlertCard'; // Import AlertCard

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
  }, [userId]);

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
              // Pass the entire alertRecord to AlertCard, which will handle its structure
              <AlertCard key={alertRecord.id} alert={alertRecord} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertHistoryPage;
