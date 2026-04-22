import { useState } from 'react';

// Import Modular Feature Hooks
import { useAuth } from './features/useAuth.js';
import { useAnalysis } from './features/useAnalysis.js';
import { useFeed } from './features/useFeed.js';
import { useUserData, useUserInterests } from './features/useUserData.js';

export const useTechPulse = () => {
  // Global App State
  const [activeTab, setActiveTab] = useState('feed');
  const [dbOffline] = useState(false);

  // Initialize Feature Hooks
  const authState = useAuth();
  const analysisState = useAnalysis(authState.token, setActiveTab);
  const feedState = useFeed();
  
  // Note: UserData needs 'token' to fetch info, and 'setAuthMode' to force login if an action fails
  const userDataState = useUserData(authState.token, authState.setAuthMode);
  const userInterestsState = useUserInterests(authState.token);

  // Bundle everything together for App.jsx
  return {
    // Spread all modular hook states and functions
    ...authState,
    ...analysisState,
    ...feedState,
    ...userDataState,
    ...userInterestsState,
    isGuestHistory: userDataState.isGuestHistory,
    
    // Global State
    activeTab, 
    setActiveTab, 
    dbOffline
  };
};