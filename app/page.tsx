'use client';

import { useState, useEffect } from 'react';
import { Conversation } from '@/types';
import { storageUtils } from '@/lib/storage';
import ConversationList from '@/components/ConversationList';
import ConversationView from '@/components/ConversationView';
import SettingsModal from '@/components/SettingsModal';
import { Settings, Plus, Menu, X } from 'lucide-react';

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Load conversations and settings on mount
  useEffect(() => {
    const loadedConversations = storageUtils.getConversations();
    setConversations(loadedConversations);
    
    const settings = storageUtils.getSettings();
    setApiKey(settings.geminiApiKey);
  }, []);

  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `Conversation ${conversations.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      notes: [],
    };
    
    const updatedConversations = [...conversations, newConversation];
    setConversations(updatedConversations);
    storageUtils.saveConversations(updatedConversations);
    setSelectedConversationId(newConversation.id);
  };

  const updateConversation = (updatedConversation: Conversation) => {
    const updatedConversations = conversations.map(c =>
      c.id === updatedConversation.id ? updatedConversation : c
    );
    setConversations(updatedConversations);
    storageUtils.saveConversations(updatedConversations);
  };

  const deleteConversation = (conversationId: string) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    storageUtils.deleteConversation(conversationId);
    
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  };

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <main className="flex flex-col md:flex-row h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar - Drawer on mobile, sidebar on desktop */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-80 md:w-80 lg:w-96
        border-r border-white/10 backdrop-blur-xl bg-black/20
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Echō
          </h1>
          <div className="flex gap-2">
            <button
              onClick={createNewConversation}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
              title="New Conversation"
            >
              <Plus className="w-5 h-5 text-purple-300" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-110"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-purple-300" />
            </button>
            <button
              onClick={() => setShowMobileSidebar(false)}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              title="Close Menu"
            >
              <X className="w-5 h-5 text-purple-300" />
            </button>
          </div>
        </div>

        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={(id) => {
            setSelectedConversationId(id);
            setShowMobileSidebar(false);
          }}
          onDelete={deleteConversation}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/10 backdrop-blur-xl bg-black/20 flex items-center justify-between">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
            title="Open Menu"
          >
            <Menu className="w-5 h-5 text-purple-300" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Echō
          </h1>
          <div className="flex gap-2">
            <button
              onClick={createNewConversation}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              title="New Conversation"
            >
              <Plus className="w-5 h-5 text-purple-300" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-purple-300" />
            </button>
          </div>
        </div>

        {selectedConversation ? (
          <ConversationView
            conversation={selectedConversation}
            onUpdate={updateConversation}
            apiKey={apiKey}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md">
              <div className="mb-6 relative">
                <div className="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                  <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center">
                    <Plus className="w-8 h-8 md:w-12 md:h-12 text-purple-300" />
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-6 text-base md:text-lg px-4">
                {conversations.length === 0
                  ? 'Create your first conversation to get started'
                  : 'Select a conversation or create a new one'}
              </p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full transition-all duration-300 font-medium shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 hover:scale-105"
              >
                Create New Conversation
              </button>
              {conversations.length > 0 && (
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="mt-4 md:hidden px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all duration-300 font-medium"
                >
                  View All Conversations
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onSave={(key) => {
            setApiKey(key);
            setShowSettings(false);
          }}
        />
      )}
    </main>
  );
}
