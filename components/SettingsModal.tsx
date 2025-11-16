'use client';

import { useState, useEffect } from 'react';
import { storageUtils } from '@/lib/storage';
import { X } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onSave: (apiKey: string) => void;
}

export default function SettingsModal({ onClose, onSave }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const settings = storageUtils.getSettings();
    setApiKey(settings.geminiApiKey);
  }, []);

  const handleSave = () => {
    const settings = storageUtils.getSettings();
    storageUtils.saveSettings({
      ...settings,
      geminiApiKey: apiKey,
    });
    onSave(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-purple-900 border border-white/20 backdrop-blur-xl rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-purple-500/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
          >
            <X className="w-5 h-5 text-purple-300" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <p className="mt-2 text-xs text-gray-400">
              Get your API key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline transition-colors"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 p-4 rounded-xl backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-purple-300 mb-2">
              Using Gemini 2.5 Flash
            </h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              This app uses the latest Gemini 2.5 Flash model for accurate transcription.
              Your API key is stored locally in your browser.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-300 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
