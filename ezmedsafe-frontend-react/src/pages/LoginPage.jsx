import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';

function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!apiKey) {
      toast.error('API Key cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      // Assuming authentication is bypassed for MVP, this call might not be functional
      // but it demonstrates the intended flow.
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      const data = await response.json();
      login(apiKey, data.userId);
      navigate('/');
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4'>
      <Card className='w-full max-w-sm mx-auto shadow-lg rounded-xl overflow-hidden'>
        {' '}
        {/* Added mx-auto, shadow-lg, rounded-xl */}
        <CardHeader className='p-6 bg-blue-600 text-white text-center'>
          {' '}
          {/* Enhanced header styling */}
          <CardTitle className='text-3xl font-extrabold'>
            Login to ezMedSafe
          </CardTitle>
          <CardDescription className='text-blue-100 mt-2'>
            Enter your API Key to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className='p-6 space-y-6 bg-white dark:bg-gray-800'>
          {' '}
          {/* Added p-6, space-y-6 */}
          <div className='space-y-3'>
            {' '}
            {/* Increased spacing */}
            <Label
              htmlFor='apiKey'
              className='text-gray-700 dark:text-gray-200'
            >
              API Key
            </Label>
            <Input
              id='apiKey'
              type='password'
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='••••••••••••••••'
              className='focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
            />
          </div>
          <Button
            onClick={handleLogin}
            className='w-full py-2.5 text-lg font-semibold bg-blue-700 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md'
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <p className='text-sm text-center text-gray-500 dark:text-gray-400'>
            Use your `your_dev_api_key_123`
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
