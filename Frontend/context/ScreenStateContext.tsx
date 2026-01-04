import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ScreenState {
  currentRoute: string | null;
  currentFamilyId: number | null;
  activeTab: 'shopping' | 'chat' | 'statistics' | null;
}

interface ScreenStateContextType {
  screenState: ScreenState;
  setScreenState: (state: Partial<ScreenState>) => void;
  clearScreenState: () => void;
}

const ScreenStateContext = createContext<ScreenStateContextType | undefined>(undefined);

export const ScreenStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [screenState, setScreenStateState] = useState<ScreenState>({
    currentRoute: null,
    currentFamilyId: null,
    activeTab: null,
  });

  const setScreenState = (state: Partial<ScreenState>) => {
    setScreenStateState((prev) => ({ ...prev, ...state }));
  };

  const clearScreenState = () => {
    setScreenStateState({
      currentRoute: null,
      currentFamilyId: null,
      activeTab: null,
    });
  };

  return (
    <ScreenStateContext.Provider value={{ screenState, setScreenState, clearScreenState }}>
      {children}
    </ScreenStateContext.Provider>
  );
};

export const useScreenState = () => {
  const context = useContext(ScreenStateContext);
  if (!context) {
    throw new Error('useScreenState must be used within ScreenStateProvider');
  }
  return context;
};

