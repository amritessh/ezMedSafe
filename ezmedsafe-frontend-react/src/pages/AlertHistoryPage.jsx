import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function AlertHistoryPage() {
  return (
    <div className='min-h-screen bg-gray-50 p-6 flex flex-col items-center'>
      <h1 className='text-5xl font-extrabold text-blue-700 mb-10 tracking-tight'>
        Alert History
      </h1>
      <Card className='w-full max-w-3xl'>
        <CardHeader>
          <CardTitle className='text-2xl'>Past Interaction Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-gray-600'>
            No alerts found yet. This page will display your interaction
            history.
          </p>
          {/* Alerts will be fetched and displayed here in Day 5 */}
        </CardContent>
      </Card>
    </div>
  );
}

export default AlertHistoryPage;
