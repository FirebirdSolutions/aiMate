import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface DebugLog {
  id: string;
  timestamp: Date;
  action: string;
  category: string; // e.g., 'admin:general', 'settings:interface', 'plugin:weather'
  api?: string;
  payload?: any;
  response?: any;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface DebugSettings {
  showPayloads: boolean;
  showResponses: boolean;
  showTimestamps: boolean;
  logUIEvents: boolean;
  logLevels: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
  };
  categoryFilters: string[]; // Empty array means all categories enabled
  maxLogs: number;
}

interface DebugContextType {
  debugEnabled: boolean;
  setDebugEnabled: (enabled: boolean) => void;
  showcaseMode: boolean;
  setShowcaseMode: (enabled: boolean) => void;
  logs: DebugLog[];
  addLog: (log: Omit<DebugLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  debugSettings: DebugSettings;
  updateDebugSettings: (settings: Partial<DebugSettings>) => void;
}

const defaultDebugSettings: DebugSettings = {
  showPayloads: true,
  showResponses: true,
  showTimestamps: true,
  logUIEvents: true,
  logLevels: {
    info: true,
    success: true,
    warning: true,
    error: true,
  },
  categoryFilters: [], // Empty = all enabled
  maxLogs: 200,
};

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [debugEnabled, setDebugEnabled] = useState(() => {
    const saved = localStorage.getItem('debugEnabled');
    return saved === 'true';
  });
  const [showcaseMode, setShowcaseMode] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [debugSettings, setDebugSettings] = useState<DebugSettings>(() => {
    try {
      const saved = localStorage.getItem('debugSettings');
      if (saved) {
        return { ...defaultDebugSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load debug settings:', e);
    }
    return defaultDebugSettings;
  });

  const handleSetDebugEnabled = useCallback((enabled: boolean) => {
    setDebugEnabled(enabled);
    localStorage.setItem('debugEnabled', String(enabled));
    if (!enabled) {
      setLogs([]);
      setShowcaseMode(false);
    }
  }, []);

  const handleSetShowcaseMode = useCallback((enabled: boolean) => {
    setShowcaseMode(enabled);
  }, []);

  const updateDebugSettings = useCallback((settings: Partial<DebugSettings>) => {
    setDebugSettings(prev => {
      const newSettings = { ...prev, ...settings };
      localStorage.setItem('debugSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  }, []);

  const addLog = useCallback((log: Omit<DebugLog, 'id' | 'timestamp'>) => {
    // Check if debug is enabled first - read from localStorage to avoid stale closure
    const isDebugEnabled = localStorage.getItem('debugEnabled') === 'true';
    if (!isDebugEnabled) return;
    
    setLogs(prev => {
      // We need to check settings inside the callback to avoid dependency on debugSettings
      let shouldLog = true;
      
      // Get current settings from localStorage to avoid stale closure
      const savedSettings = localStorage.getItem('debugSettings');
      const currentSettings = savedSettings ? JSON.parse(savedSettings) : defaultDebugSettings;
      
      // Check if log level is enabled
      if (!currentSettings.logLevels[log.type]) {
        shouldLog = false;
      }
      
      // Check category filter (empty array = all enabled)
      if (shouldLog && currentSettings.categoryFilters.length > 0) {
        const categoryMatch = currentSettings.categoryFilters.some((filter: string) => 
          log.category.startsWith(filter)
        );
        if (!categoryMatch) {
          shouldLog = false;
        }
      }
      
      if (!shouldLog) return prev;
      
      const newLog: DebugLog = {
        ...log,
        id: Date.now().toString() + Math.random(),
        timestamp: new Date(),
      };
      
      return [newLog, ...prev].slice(0, currentSettings.maxLogs);
    });
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const value = useMemo(() => ({
    debugEnabled, 
    setDebugEnabled: handleSetDebugEnabled, 
    showcaseMode, 
    setShowcaseMode: handleSetShowcaseMode, 
    logs, 
    addLog, 
    clearLogs,
    filterCategory,
    setFilterCategory,
    debugSettings,
    updateDebugSettings,
  }), [
    debugEnabled, 
    handleSetDebugEnabled, 
    showcaseMode, 
    handleSetShowcaseMode, 
    logs, 
    addLog, 
    clearLogs,
    filterCategory,
    debugSettings,
    updateDebugSettings,
  ]);

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

// Helper function for logging UI events
export function useUIEventLogger() {
  const { addLog } = useDebug();
  
  const logUIEvent = useCallback((action: string, category: string, payload?: any) => {
    // Check if UI events are enabled from localStorage to avoid stale closure and dependency issues
    const savedSettings = localStorage.getItem('debugSettings');
    const currentSettings = savedSettings ? JSON.parse(savedSettings) : defaultDebugSettings;
    if (!currentSettings.logUIEvents) return;
    
    addLog({
      action,
      category,
      payload,
      type: 'info'
    });
  }, [addLog]);
  
  return { logUIEvent };
}