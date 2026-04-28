import React, { useState, useEffect } from 'react';
import { Monitor, AlertCircle, Loader } from 'lucide-react';
import { Tooltip } from './ui'
import { useSettingsStore } from '../store/settingsStore'

const headlessI18n = {
  en: 'Browser will not appear on screen — faster and ideal for CI/CD',
  id: 'Browser tidak akan tampil di layar — lebih cepat dan cocok untuk CI/CD',
}

/**
 * BrowserSelector - Component for selecting which browser to run tests on
 */
export default function BrowserSelector({ 
  selectedBrowser = 'chromium', 
  onBrowserChange, 
  onHeadlessChange,
  headless = false,
  disabled = false 
}) {
  const { language } = useSettingsStore()
  const [browsers, setBrowsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrowsers();
  }, []);

  const fetchBrowsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/executions/browsers');
      if (!response.ok) throw new Error('Failed to fetch browsers');
      const data = await response.json();
      setBrowsers(data.browsers || []);
    } catch (err) {
      setError(err.message);
      // Fallback to default browsers if API fails
      setBrowsers([
        { key: 'chromium', displayName: 'Chrome/Chromium', description: 'Chromium-based browser', isDefault: true },
        { key: 'firefox', displayName: 'Firefox', description: 'Mozilla Firefox browser', isDefault: false },
        { key: 'webkit', displayName: 'Safari', description: 'WebKit-based browser (Safari)', isDefault: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
        <Loader className="w-4 h-4 animate-spin text-blue-600" />
        <span className="text-sm text-slate-600">Loading browsers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          <Monitor className="w-4 h-4 inline mr-1" />
          Select Browser
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {browsers.map(browser => (
            <button
              key={browser.key}
              onClick={() => onBrowserChange && onBrowserChange(browser.key)}
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                selectedBrowser === browser.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="font-medium text-sm text-slate-900">{browser.displayName}</div>
              <div className="text-xs text-slate-600 mt-1">{browser.description}</div>
              {browser.isDefault && (
                <div className="text-xs text-blue-600 font-medium mt-2">Default</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <Tooltip text={headlessI18n[language] ?? headlessI18n.en} position="right">
        <input
          type="checkbox"
          id="headless"
          checked={headless}
          onChange={(e) => onHeadlessChange && onHeadlessChange(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded cursor-pointer"
        />
        </Tooltip>
        <label htmlFor="headless" className="flex-1 cursor-pointer">
          <div className="text-sm font-medium text-slate-900">Headless Mode</div>
          <div className="text-xs text-slate-600">Run without visible browser UI</div>
        </label>
      </div>

      <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded">
        <strong>Note:</strong> Different browsers may have different rendering behaviors. Test your scenarios across multiple browsers for better coverage.
      </div>
    </div>
  );
}
