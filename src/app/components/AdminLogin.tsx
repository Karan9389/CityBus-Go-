import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Shield, Home, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import type { Screen, Admin } from '../App';
import { api } from '../services/api';

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      onShowNotification('Username and password are required.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.adminLogin({
        username: username.trim(),
        password,
      });

      if (response.admin) {
        onAdminLogin(response.admin);
        onShowNotification('Welcome to Admin Portal! 🛡️');
        onShowScreen('adminDashboard');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      onShowNotification(error.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
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
        <h1 className="font-semibold text-base">Admin Portal</h1>
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
            <h2 className="font-bold text-xl">Admin Access</h2>
            <p className="text-muted-foreground text-xs mt-1">
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
              <CardHeader className="pb-3">
                <CardTitle className="text-center text-sm font-semibold">Administrator Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-xs">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter admin username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      >
                        {showPassword ? (
                          <EyeOff size={16} className="text-gray-500" />
                        ) : (
                          <Eye size={16} className="text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-medium mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? "Authenticating..." : "Login to Admin Portal"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}