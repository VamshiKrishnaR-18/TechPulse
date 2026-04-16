import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useAuth = () => {
  const [authMode, setAuthMode] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('tp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('tp_token'));

  const authMutation = useMutation({
    mutationFn: (data) => api.auth(authMode, data),
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('tp_token', data.token);
        localStorage.setItem('tp_user', JSON.stringify(data.user)); 
        setAuthMode(null);
        toast.success(`Welcome back!`);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    },
  });

  const handleAuth = (e) => {
    e.preventDefault();
    authMutation.mutate(authData);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tp_token');
    localStorage.removeItem('tp_user'); 
    toast.success('Logged out successfully');
  };

  return { 
    authMode, setAuthMode, authData, setAuthData, 
    user, token, handleAuth, handleLogout 
  };
};