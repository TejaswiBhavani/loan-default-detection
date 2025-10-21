import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  BellIcon,
  ChartBarIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import Toast from '../components/common/Toast';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface SettingsState {
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    riskAlerts: boolean;
    dailyReports: boolean;
  };
  preferences: {
    theme: Theme;
    language: string;
    timezone: string;
    currency: string;
  };
  saving: boolean;
}

const Settings: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();
  const [state, setState] = useState<SettingsState>({
    riskThresholds: {
      low: 0.3,
      medium: 0.7,
      high: 1.0,
    },
    notifications: {
      emailEnabled: true,
      pushEnabled: false,
      riskAlerts: true,
      dailyReports: false,
    },
    preferences: {
      theme: theme,
      language: 'en',
      timezone: 'America/New_York',
      currency: 'USD',
    },
    saving: false,
  });

  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: '',
  });

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ show: true, type, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('appSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setState((prev) => ({ ...prev, saving: true }));

    try {
      // Validate risk thresholds
      if (state.riskThresholds.low >= state.riskThresholds.medium) {
        throw new Error('Low threshold must be less than medium threshold');
      }
      if (state.riskThresholds.medium >= state.riskThresholds.high) {
        throw new Error('Medium threshold must be less than high threshold');
      }

      // Save theme to context (this also persists to localStorage in ThemeContext)
      setTheme(state.preferences.theme);

      // Save other settings to localStorage
      localStorage.setItem(
        'appSettings',
        JSON.stringify({
          riskThresholds: state.riskThresholds,
          notifications: state.notifications,
          preferences: state.preferences,
        })
      );

      showToast('success', 'Settings saved successfully');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  };

  const handleResetSettings = () => {
    const defaultTheme: Theme = 'light';
    setState({
      riskThresholds: {
        low: 0.3,
        medium: 0.7,
        high: 1.0,
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: false,
        riskAlerts: true,
        dailyReports: false,
      },
      preferences: {
        theme: defaultTheme,
        language: 'en',
        timezone: 'America/New_York',
        currency: 'USD',
      },
      saving: false,
    });
    
    // Reset theme in context
    setTheme(defaultTheme);
    
    localStorage.removeItem('appSettings');
    showToast('success', 'Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      <Toast show={toast.show} type={toast.type} message={toast.message} onClose={hideToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your application preferences and configurations</p>
      </div>

      {/* Risk Thresholds */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Risk Thresholds</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Configure risk score thresholds for classification
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Low Risk Threshold (0 - {state.riskThresholds.low.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.riskThresholds.low}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  riskThresholds: { ...prev.riskThresholds, low: parseFloat(e.target.value) },
                }))
              }
              className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.0</span>
              <span className="font-medium text-green-600">
                {state.riskThresholds.low.toFixed(2)}
              </span>
              <span>1.0</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medium Risk Threshold ({state.riskThresholds.low.toFixed(2)} -{' '}
              {state.riskThresholds.medium.toFixed(2)})
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={state.riskThresholds.medium}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  riskThresholds: {
                    ...prev.riskThresholds,
                    medium: parseFloat(e.target.value),
                  },
                }))
              }
              className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.0</span>
              <span className="font-medium text-yellow-600">
                {state.riskThresholds.medium.toFixed(2)}
              </span>
              <span>1.0</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              High Risk Threshold ({state.riskThresholds.medium.toFixed(2)} - 1.0)
            </label>
            <div className="bg-gray-100 p-3 rounded-md">
              <span className="text-sm text-gray-700">
                Any score above {state.riskThresholds.medium.toFixed(2)} is classified as High Risk
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <BellIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.notifications.emailEnabled}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, emailEnabled: e.target.checked },
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">Enable email notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.notifications.pushEnabled}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, pushEnabled: e.target.checked },
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">Enable push notifications</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.notifications.riskAlerts}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, riskAlerts: e.target.checked },
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">
              Alert on high-risk predictions
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={state.notifications.dailyReports}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  notifications: { ...prev.notifications, dailyReports: e.target.checked },
                }))
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">Send daily summary reports</span>
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <CogIcon className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Preferences</h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Theme Selection</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableThemes.map((themeOption) => (
                <div
                  key={themeOption.value}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    theme === themeOption.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setTheme(themeOption.value);
                    setState((prev) => ({
                      ...prev,
                      preferences: { ...prev.preferences, theme: themeOption.value },
                    }));
                  }}
                >
                  {theme === themeOption.value && (
                    <div className="absolute top-2 right-2">
                      <CheckIcon className="w-5 h-5 text-blue-500" />
                    </div>
                  )}
                  
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900">{themeOption.label}</h3>
                  </div>
                  
                  {/* Color preview */}
                  <div className="flex space-x-2 mb-3">
                    {themeOption.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  
                  {/* Mini preview card */}
                  <div 
                    className="text-xs rounded p-2 border"
                    style={{
                      backgroundColor: themeOption.colors[0],
                      borderColor: themeOption.colors[2],
                      color: themeOption.value === 'dark' ? '#f7fafc' : '#1a202c'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>Sample Card</span>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: themeOption.colors[3] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Changes are applied immediately and saved when you click "Save Settings"
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={state.preferences.language}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, language: e.target.value },
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
            <select
              value={state.preferences.timezone}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, timezone: e.target.value },
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={state.preferences.currency}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  preferences: { ...prev.preferences, currency: e.target.value },
                }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleResetSettings}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={state.saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
        >
          {state.saving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
