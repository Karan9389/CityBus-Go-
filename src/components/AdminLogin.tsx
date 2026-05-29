import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Shield, Home, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Admin } from '../App';

interface AdminLoginProps {
  onShowScreen: (screen: Screen) => void;
  onGoBack: () => void;
  onAdminLogin: (admin: Admin) => void;
  onShowNotification: (message: string) => void;
  onGoHome: () => void;
}

export default function AdminLogin({ onShowScreen, onGoBack, onAdminLogin, onShowNotification, onGoHome }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Demo admin credentials - in production, this would be properly secured
    const validAdmins = [
      { username: 'admin', password: 'admin123' },
      { username: 'citybus_admin', password: 'citybus2024' }
    ];

    setTimeout(() => {
      const validAdmin = validAdmins.find(admin => 
        admin.username === username && admin.password === password
      );

      if (validAdmin) {
        onAdminLogin(validAdmin);
        onShowNotification('Welcome to Admin Portal! 🛡️');
        onShowScreen('adminDashboard');
      } else {
        onShowNotification('Invalid admin credentials. Please try again.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="font-semibold">Admin Portal</h1>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onGoHome}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Home size={20} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Admin Icon */}
          <motion.div 
            className="text-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="bg-red-100 rounded-full p-6 w-fit mx-auto mb-4">
              <Shield size={32} className="text-red-600" />
            </div>
            <h2>Admin Access</h2>
            <p className="text-muted-foreground text-sm">
              Secure login for administrators
            </p>
          </motion.div>

          {/* Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter admin username"
                      required
                      className="bg-input-background"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter admin password"
                        required
                        className="bg-input-background pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      <>
                        <Shield className="mr-2" size={18} />
                        Sign In as Admin
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Demo Credentials */}
          <motion.div 
            className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-xs text-amber-800 mb-2 font-medium">Demo Credentials:</p>
            <p className="text-xs text-amber-700">Username: admin</p>
            <p className="text-xs text-amber-700">Password: admin123</p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}