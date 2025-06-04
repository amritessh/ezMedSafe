import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth'; // Our custom hook
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
import { toast } from 'sonner'; // If you added shadcn toast

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
      login(apiKey, data.userId); // Store API key and userId
      navigate('/'); // Navigate to home page on success
      toast.success('Logged in successfully!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>
            Login to ezMedSafe
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your API Key to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='apiKey'>API Key</Label>
            <Input
              id='apiKey'
              type='password' // Use password type for API keys
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder='••••••••••••••••'
            />
          </div>
          <Button onClick={handleLogin} className='w-full' disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <p className='text-sm text-center text-gray-500'>
            Use your `your_dev_api_key_123`
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;
