import { Conversation, AppSettings } from '@/types';

const CONVERSATIONS_KEY = 'voice_notes_conversations';
const SETTINGS_KEY = 'voice_notes_settings';

export const storageUtils = {
  // Conversations
  getConversations: (): Conversation[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(CONVERSATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading conversations:', error);
      return [];
    }
  },

  saveConversations: (conversations: Conversation[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  },

  addConversation: (conversation: Conversation): void => {
    const conversations = storageUtils.getConversations();
    conversations.push(conversation);
    storageUtils.saveConversations(conversations);
  },

  updateConversation: (updatedConversation: Conversation): void => {
    const conversations = storageUtils.getConversations();
    const index = conversations.findIndex(c => c.id === updatedConversation.id);
    if (index !== -1) {
      conversations[index] = updatedConversation;
      storageUtils.saveConversations(conversations);
    }
  },

  deleteConversation: (conversationId: string): void => {
    const conversations = storageUtils.getConversations();
    const filtered = conversations.filter(c => c.id !== conversationId);
    storageUtils.saveConversations(filtered);
  },

  // Settings
  getSettings: (): AppSettings => {
    if (typeof window === 'undefined') {
      return { geminiApiKey: '', darkMode: true };
    }
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : { geminiApiKey: '', darkMode: true };
    } catch (error) {
      console.error('Error reading settings:', error);
      return { geminiApiKey: '', darkMode: true };
    }
  },

  saveSettings: (settings: AppSettings): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  },
};
