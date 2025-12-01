import React, { createContext, useContext, useState, ReactNode } from 'react';

export type CompressionStrategy = 'hybrid' | 'summarize' | 'drop-low-value' | 'sliding-window';

export interface ContextManagementSettings {
  enabled: boolean;
  threshold: number;  // Trigger compression at this % (default: 80)
  strategy: CompressionStrategy;
  preserveRecentMessages: number;  // Always keep last N messages (default: 5)
  showIndicator: boolean;  // Show compression indicator in UI
}

interface UserSettings {
  general?: {
    language?: string;
    notifications?: string;
    defaultModel?: string;
    systemPrompt?: string;
    userName?: string;
  };
  interface?: {
    theme?: string;
    density?: string;
    fontSize?: string;
    messageGrouping?: boolean;
    expandCodeBlocks?: boolean;
    showTimestamps?: boolean;
    syntaxHighlighting?: boolean;
    markdownSupport?: boolean;
  };
  chat?: {
    enterToSend?: boolean;
    autoPlayTTS?: boolean;
    suggestions?: boolean;
    contextWindow?: string;
  };
  voice?: {
    voiceInput?: boolean;
    voiceOutput?: boolean;
    voiceModel?: string;
    speechRate?: number;
  };
  privacy?: {
    analytics?: boolean;
    crashReports?: boolean;
    saveHistory?: boolean;
  };
  connections?: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    ollamaBaseUrl?: string;
  };
  personalisation?: {
    creativityLevel?: string;
    responseStyle?: string;
    customInstructions?: string;
    rememberContext?: boolean;
  };
  contextManagement?: ContextManagementSettings;
  account?: {
    email?: string;
    username?: string;
    allowAnalytics?: boolean;
    personalization?: boolean;
  };
  [key: string]: any;
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateGeneral: (updates: Partial<UserSettings['general']>) => void;
  updateInterface: (updates: Partial<UserSettings['interface']>) => void;
  updateConnections: (updates: Partial<UserSettings['connections']>) => void;
  updatePersonalisation: (updates: Partial<UserSettings['personalisation']>) => void;
  updateContextManagement: (updates: Partial<ContextManagementSettings>) => void;
  updateAccount: (updates: Partial<UserSettings['account']>) => void;
  resetSettings: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

const defaultSettings: UserSettings = {
  general: {
    language: 'en-gb',
    notifications: 'on',
    defaultModel: 'gpt-4',
    systemPrompt: '',
  },
  interface: {
    theme: 'system',
    density: 'comfortable',
    fontSize: 'medium',
    messageGrouping: true,
    expandCodeBlocks: false,
    showTimestamps: true,
    syntaxHighlighting: true,
    markdownSupport: true,
  },
  chat: {
    enterToSend: true,
    autoPlayTTS: false,
    suggestions: true,
    contextWindow: '4k',
  },
  voice: {
    voiceInput: false,
    voiceOutput: false,
    voiceModel: 'alloy',
    speechRate: 1.0,
  },
  privacy: {
    analytics: true,
    crashReports: true,
    saveHistory: true,
  },
  connections: {
    openaiApiKey: '',
    anthropicApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  },
  personalisation: {
    creativityLevel: 'balanced',
    responseStyle: 'balanced',
    customInstructions: '',
    rememberContext: true,
  },
  contextManagement: {
    enabled: true,
    threshold: 80,
    strategy: 'hybrid',
    preserveRecentMessages: 5,
    showIndicator: true,
  },
  account: {
    email: '',
    username: '',
    allowAnalytics: true,
    personalization: true,
  },
};

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  const updateGeneral = (updates: Partial<UserSettings['general']>) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, ...updates },
    }));
  };

  const updateInterface = (updates: Partial<UserSettings['interface']>) => {
    setSettings((prev) => ({
      ...prev,
      interface: { ...prev.interface, ...updates },
    }));
  };

  const updateConnections = (updates: Partial<UserSettings['connections']>) => {
    setSettings((prev) => ({
      ...prev,
      connections: { ...prev.connections, ...updates },
    }));
  };

  const updatePersonalisation = (updates: Partial<UserSettings['personalisation']>) => {
    setSettings((prev) => ({
      ...prev,
      personalisation: { ...prev.personalisation, ...updates },
    }));
  };

  const updateContextManagement = (updates: Partial<ContextManagementSettings>) => {
    setSettings((prev) => ({
      ...prev,
      contextManagement: { ...prev.contextManagement, ...updates } as ContextManagementSettings,
    }));
  };

  const updateAccount = (updates: Partial<UserSettings['account']>) => {
    setSettings((prev) => ({
      ...prev,
      account: { ...prev.account, ...updates },
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        updateGeneral,
        updateInterface,
        updateConnections,
        updatePersonalisation,
        updateContextManagement,
        updateAccount,
        resetSettings,
      }}
    >
      {children}
    </UserSettingsContext.Provider>
  );
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
}