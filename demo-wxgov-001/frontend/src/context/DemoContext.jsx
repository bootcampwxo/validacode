import React, { createContext, useContext, useReducer } from 'react';

const DemoContext = createContext(null);

const initialState = {
  demoMode: import.meta.env.VITE_DEMO_MODE || 'mock',
  loading: false,
  kpiData: null,
  governanceData: null,
  agentOpsData: null,
  notifications: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_KPI_DATA': return { ...state, kpiData: action.payload };
    case 'SET_GOVERNANCE_DATA': return { ...state, governanceData: action.payload };
    case 'SET_AGENTOPS_DATA': return { ...state, agentOpsData: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    case 'CLEAR_NOTIFICATIONS': return { ...state, notifications: [] };
    case 'RESET_DEMO': return { ...initialState };
    default: return state;
  }
}

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <DemoContext.Provider value={{ state, dispatch }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemoContext must be used within DemoProvider');
  return ctx;
}
