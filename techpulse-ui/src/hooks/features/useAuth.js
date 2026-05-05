import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useAuth = () => {
  const [authMode, setAuthMode] = useState(null);
  const [authReason, setAuthReason] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '' });
  
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('tp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('tp_token'));

  const triggerAuth = (mode, reason = null) => {
    setAuthMode(mode);
    setAuthReason(reason);
  };

  const authMutation = useMutation({
    mutationFn: ({ data, interestedTags, contentPreferences }) => 
      api.auth(authMode, { ...data, interestedTags, contentPreferences }),
    onSuccess: (data) => {
      if (data.success) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('tp_token', data.token);
        localStorage.setItem('tp_user', JSON.stringify(data.user)); 
        setAuthMode(null);
        setAuthReason(null);
        toast.success(`Welcome to TechPulse!`);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    },
  });

  const handleAuth = (e, interestedTags = [], contentPreferences = [], dataOverride = null) => {
    if (e) e.preventDefault();
    const finalData = dataOverride || authData;
    authMutation.mutate({ data: finalData, interestedTags, contentPreferences });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('tp_token');
    localStorage.removeItem('tp_user'); 
    toast.success('Logged out successfully');
  };

  return { 
    authMode, setAuthMode, authReason, setAuthReason, triggerAuth,
    authData, setAuthData, 
    user, token, handleAuth, handleLogout 
  };
};