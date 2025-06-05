import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from './ui/card';

function AlertCard({ alert }) {
  // Determine text color based on severity
  const severityTextColor =
    alert.severity === 'Critical'
      ? 'text-red-600'
      : alert.severity === 'High'
      ? 'text-orange-500'
      : alert.severity === 'Moderate'
      ? 'text-yellow-600'
      : 'text-gray-700';

  // Safely parse alertData if it's a string (e.g., from history fetch where it's JSONB)
  // For HomePage, alert.alertData might already be an object
  const alertDisplayData =
    typeof alert.alertData === 'string' ? JSON.parse(alert.alertData) : alert;

  const formattedDate = alert.createdAt
    ? new Date(alert.createdAt).toLocaleString()
    : 'N/A';

  return (
    <Card className='w-full mb-4 border border-gray-200 shadow-md transition-all duration-200 hover:shadow-lg'>
      <CardHeader className='pb-3'>
        <CardTitle className={`text-xl font-bold ${severityTextColor}`}>
          {alertDisplayData.severity} Alert: {alertDisplayData.drugA}{' '}
          {alertDisplayData.drugB && alertDisplayData.drugB !== 'N/A'
            ? `+ ${alertDisplayData.drugB}`
            : ''}
        </CardTitle>
        {alert.createdAt && (
          <CardDescription className='text-sm text-gray-500'>
            Generated on: {formattedDate}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className='space-y-3 text-left'>
        <div>
          <h3 className='font-semibold text-gray-800'>Explanation:</h3>
          <p className='text-gray-700 text-sm mt-1'>
            {alertDisplayData.explanation}
          </p>
        </div>
        <div>
          <h3 className='font-semibold text-gray-800'>Clinical Implication:</h3>
          <p className='text-gray-700 text-sm mt-1'>
            {alertDisplayData.clinicalImplication}
          </p>
        </div>
        <div>
          <h3 className='font-semibold text-gray-800'>Recommendation:</h3>
          <p className='text-gray-700 text-sm mt-1'>
            {alertDisplayData.recommendation}
          </p>
        </div>

        {alert.patientInfo && (
          <div className='border-t border-gray-100 pt-3 mt-3'>
            <h3 className='font-semibold text-gray-800'>Patient Context:</h3>
            <p className='text-gray-600 text-sm mt-1'>{alert.patientInfo}</p>
          </div>
        )}
        {alert.newMedicationName && (
          <div>
            <h3 className='font-semibold text-gray-800'>Medication Checked:</h3>
            <p className='text-gray-600 text-sm mt-1'>
              {alert.newMedicationName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AlertCard;
