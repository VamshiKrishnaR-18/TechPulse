import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '../../services/apiService.js';

export const useAnalysis = (token, setActiveTab) => {
  const queryClient = useQueryClient();
  const [tech, setTech] = useState('');
  const [tech2, setTech2] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [result2, setResult2] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [isVersus, setIsVersus] = useState(false);

  // Autocomplete Data
  const { data: cachedNamesData } = useQuery({
    queryKey: ['cachedTechNames'],
    queryFn: () => api.fetchCachedTechNames(),
    select: (data) => data.techNames || [],
  });
  const cachedTechNames = cachedNamesData || [];

  const analyzeTech = async (targetTech, setResultFn, setStreamFn) => {
    try {
      const response = await fetch(api.getStreamUrl(targetTech));
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.status === 'streaming') { 
              accumulatedText += data.chunk; 
              setStreamFn(accumulatedText); 
            }
            if (data.done) { 
              setResultFn(data);
              setStreamFn(''); 
              if (token) {
                api.saveAnalysis(targetTech, token).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['history'] });
                });
              }
              toast.success(`Analysis for ${targetTech} complete`);
              return data; 
            }
          }
        }
      }
    } catch (err) { 
      toast.error(`Analysis failed: ${err.message}`);
      throw err; 
    }
  };

  const handleAnalyze = async () => {
    if (!tech) return;
    setLoading(true); setError(null); setResult(null); setResult2(null); setStreamingText('');
    try {
      if (isVersus && tech2) {
        await Promise.all([
          analyzeTech(tech, setResult, setStreamingText),
          analyzeTech(tech2, setResult2, setStreamingText)
        ]);
      } else {
        await analyzeTech(tech, setResult, setStreamingText);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const startQuickAnalyze = (t) => {
    setTech(t); setIsVersus(false); setActiveTab('analysis');
    setTimeout(() => handleAnalyze(), 100);
  };

  const resetAnalysis = () => { 
    setResult(null); setResult2(null); setTech(''); setTech2(''); setIsVersus(false); 
  };

  return {
    tech, setTech, tech2, setTech2, loading, result, result2, streamingText,
    error, setError, isVersus, setIsVersus, handleAnalyze, startQuickAnalyze, resetAnalysis,
    cachedTechNames
  };
};