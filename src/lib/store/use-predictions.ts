import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MatchPrediction } from '../api/prediction-api';

interface PredictionState {
  predictions: MatchPrediction[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  updatePredictions: (data: MatchPrediction[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getPredictionById: (id: number) => MatchPrediction | undefined;
}

export const usePredictions = create<PredictionState>()(
  persist(
    (set, get) => ({
      predictions: [],
      lastUpdated: null,
      isLoading: false,
      error: null,
      
      updatePredictions: (data) => set({
        predictions: data,
        lastUpdated: new Date(),
        error: null
      }),
      
      setLoading: (loading) => set({
        isLoading: loading
      }),
      
      setError: (error) => set({
        error,
        isLoading: false
      }),
      
      getPredictionById: (id) => {
        return get().predictions.find(prediction => prediction.fixtureId === id);
      }
    }),
    {
      name: 'predictions-store',
      partialize: (state) => ({ 
        predictions: state.predictions,
        lastUpdated: state.lastUpdated 
      }),
    }
  )
);
