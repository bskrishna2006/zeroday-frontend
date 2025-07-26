import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';

export const AuthDebugger: React.FC = () => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('Test User');
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBackendConnection = async () => {
    setLoading(true);
    setResults('Testing backend connection...\n');
    
    const urls = [
      'https://campuses-connect-backend.onrender.com',
      'https://campuses-connect-backend.onrender.com/api',
      'https://campuses-connect-backend.onrender.com/api/auth/verify',
      'https://campuses-connect-backend.onrender.com/health',
      'https://campuses-connect-backend.onrender.com/status'
    ];
    
    for (const url of urls) {
      try {
        setResults(prev => prev + `Testing: ${url}\n`);
        const response = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        setResults(prev => prev + `✅ ${url} - Status: ${response.status}\n`);
        if (response.status === 401) {
          setResults(prev => prev + `🎉 Found working API endpoint!\n\n`);
          break;
        }
      } catch (error: any) {
        setResults(prev => prev + `❌ ${url} - Error: ${error.message}\n`);
      }
    }
    
    setLoading(false);
  };

  const testLogin = async () => {
    setLoading(true);
    setResults(prev => prev + 'Testing login...\n');
    
    try {
      const response = await authAPI.login(email, password);
      setResults(prev => prev + `✅ Login successful\n`);
      setResults(prev => prev + `Response: ${JSON.stringify(response.data, null, 2)}\n\n`);
    } catch (error: any) {
      setResults(prev => prev + `❌ Login failed\n`);
      setResults(prev => prev + `Status: ${error.response?.status}\n`);
      setResults(prev => prev + `Error: ${error.response?.data?.message || error.message}\n\n`);
    }
    
    setLoading(false);
  };

  const testSignup = async () => {
    setLoading(true);
    setResults(prev => prev + 'Testing signup...\n');
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('name', name);
      formData.append('role', 'student');
      
      const response = await authAPI.signup(formData);
      setResults(prev => prev + `✅ Signup successful\n`);
      setResults(prev => prev + `Response: ${JSON.stringify(response.data, null, 2)}\n\n`);
    } catch (error: any) {
      setResults(prev => prev + `❌ Signup failed\n`);
      setResults(prev => prev + `Status: ${error.response?.status}\n`);
      setResults(prev => prev + `Error: ${error.response?.data?.message || error.message}\n\n`);
    }
    
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Authentication Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button onClick={testBackendConnection} disabled={loading}>
            Test Backend
          </Button>
          <Button onClick={testLogin} disabled={loading}>
            Test Login
          </Button>
          <Button onClick={testSignup} disabled={loading}>
            Test Signup
          </Button>
          <Button onClick={() => setResults('')} variant="outline">
            Clear
          </Button>
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Results:</h3>
          <pre className="text-sm whitespace-pre-wrap">{results || 'No tests run yet...'}</pre>
        </div>
        
        <div className="text-sm text-gray-600">
          <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
          <p><strong>API Base URL:</strong> {import.meta.env.VITE_API_BASE_URL || 'https://campuses-connect-backend.onrender.com/api'}</p>
        </div>
      </CardContent>
    </Card>
  );
};