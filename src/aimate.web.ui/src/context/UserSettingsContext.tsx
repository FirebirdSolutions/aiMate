import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

// General Settings
interface GeneralSettings {
  language: string;
  notifications: string;
  systemPrompt: string;
}

// Interface Settings (chat display options - theme is handled by ThemeProvider)
interface InterfaceSettings {
  showTimestamps: boolean;
  syntaxHighlighting: boolean;
  markdownSupport: boolean;
}

// Connection Settings
interface ConnectionSettings {
  openaiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
}

// Personalisation Settings
interface PersonalisationSettings {
  creativityLevel: string;
  responseStyle: string;
  customInstructions: string;
  rememberContext: boolean;
}

// Account Settings
interface AccountSettings {
  email: string;
  username: string;
  allowAnalytics: boolean;
  personalization: boolean;
}

// Combined User Settings
interface UserSettings {
  general: GeneralSettings;
  interface: InterfaceSettings;
  connections: ConnectionSettings;
  personalisation: PersonalisationSettings;
  account: AccountSettings;
}

// Default values
const defaultSettings: UserSettings = {
  general: {
    language: 'en-gb',
    notifications: 'off',
    systemPrompt: `[Culture]
Location: New Zealand/Aotearoa (Land of the Long White Cloud)
Population: Kiwis/New Zealanders
Style: Laid back and friendly, less formal
Currency: NZD
Language: New Zealand English (Colour vs Color, Homogenise vs Homogenize)`,
  },
  interface: {
    showTimestamps: true,
    syntaxHighlighting: true,
    markdownSupport: true,
  },
  connections: {
    openaiApiKey: '',
    anthropicApiKey: '',
    ollamaBaseUrl: '',
  },
  personalisation: {
    creativityLevel: 'balanced',
    responseStyle: 'balanced',
    customInstructions: '',
    rememberContext: true,
  },
  account: {
    email: 'rich@example.com',
    username: 'rich',
    allowAnalytics: true,
    personalization: true,
  },
};

const STORAGE_KEY = 'aimate-user-settings';

interface UserSettingsContextType {
  settings: UserSettings;
  updateGeneral: (updates: Partial<GeneralSettings>) => void;
  updateInterface: (updates: Partial<InterfaceSettings>) => void;
  updateConnections: (updates: Partial<ConnectionSettings>) => void;
  updatePersonalisation: (updates: Partial<PersonalisationSettings>) => void;
  updateAccount: (updates: Partial<AccountSettings>) => void;
  resetSettings: () => void;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle any new fields
        return {
          ...defaultSettings,
          ...parsed,
          general: { ...defaultSettings.general, ...parsed.general },
          interface: { ...defaultSettings.interface, ...parsed.interface },
          connections: { ...defaultSettings.connections, ...parsed.connections },
          personalisation: { ...defaultSettings.personalisation, ...parsed.personalisation },
          account: { ...defaultSettings.account, ...parsed.account },
        };
      }
    } catch (e) {
      console.error('Failed to load user settings:', e);
    }
    return defaultSettings;
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save user settings:', e);
    }
  }, [settings]);

  const updateGeneral = useCallback((updates: Partial<GeneralSettings>) => {
    setSettings(prev => ({
      ...prev,
      general: { ...prev.general, ...updates },
    }));
  }, []);

  const updateInterface = useCallback((updates: Partial<InterfaceSettings>) => {
    setSettings(prev => ({
      ...prev,
      interface: { ...prev.interface, ...updates },
    }));
  }, []);

  const updateConnections = useCallback((updates: Partial<ConnectionSettings>) => {
    setSettings(prev => ({
      ...prev,
      connections: { ...prev.connections, ...updates },
    }));
  }, []);

  const updatePersonalisation = useCallback((updates: Partial<PersonalisationSettings>) => {
    setSettings(prev => ({
      ...prev,
      personalisation: { ...prev.personalisation, ...updates },
    }));
  }, []);

  const updateAccount = useCallback((updates: Partial<AccountSettings>) => {
    setSettings(prev => ({
      ...prev,
      account: { ...prev.account, ...updates },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <UserSettingsContext.Provider
      value={{
        settings,
        updateGeneral,
        updateInterface,
        updateConnections,
        updatePersonalisation,
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

// Export types for use in components
export type {
  UserSettings,
  GeneralSettings,
  InterfaceSettings,
  ConnectionSettings,
  PersonalisationSettings,
  AccountSettings,
};
