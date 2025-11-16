import { Conversation, VoiceNote } from '@/types';
import { useState } from 'react';
import VoiceRecorder from './VoiceRecorder';
import VoiceNoteCard from './VoiceNoteCard';
import { Edit2, Check, FileText, MessageSquare, Tag } from 'lucide-react';

type TabType = 'transcription' | 'summary' | 'keywords';

interface ConversationViewProps {
  conversation: Conversation;
  onUpdate: (conversation: Conversation) => void;
  apiKey: string;
}

export default function ConversationView({
  conversation,
  onUpdate,
  apiKey,
}: ConversationViewProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [activeTab, setActiveTab] = useState<TabType>('transcription');

  const handleTitleSave = () => {
    onUpdate({
      ...conversation,
      title,
      updatedAt: Date.now(),
    });
    setIsEditingTitle(false);
  };

  const handleNewNote = (note: VoiceNote) => {
    onUpdate({
      ...conversation,
      notes: [...conversation.notes, note],
      updatedAt: Date.now(),
    });
  };

  const handleDeleteNote = (noteId: string) => {
    onUpdate({
      ...conversation,
      notes: conversation.notes.filter(n => n.id !== noteId),
      updatedAt: Date.now(),
    });
  };

  const handleUpdateTranscription = (noteId: string, transcription: string) => {
    onUpdate({
      ...conversation,
      notes: conversation.notes.map(note =>
        note.id === noteId ? { ...note, transcription } : note
      ),
      updatedAt: Date.now(),
    });
  };

  // Extract keywords from all transcriptions
  const extractKeywords = () => {
    const allText = conversation.notes
      .map(note => note.transcription)
      .filter(Boolean)
      .join(' ');

    if (!allText) return [];

    // Simple keyword extraction (you could enhance this with NLP)
    const words = allText.toLowerCase().split(/\s+/);
    const wordCount: Record<string, number> = {};

    // Filter out common words and count occurrences
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'en', 'el', 'la', 'los', 'las', 'un', 'una', 'y', 'o', 'pero', 'de', 'del', 'al', 'por', 'para', 'con', 'sin', 'sobre', 'entre', 'desde', 'hasta', 'eh', 'ah', 'entonces', 'luego', 'que', 'se', 'si', 'no']);

    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3 && !commonWords.has(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });

    // Get top keywords
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  };

  const keywords = extractKeywords();

  // Generate summary
  const generateSummary = () => {
    if (conversation.notes.length === 0) {
      return 'No notes recorded yet.';
    }

    const totalDuration = conversation.notes.reduce((sum, note) => sum + (note.duration || 0), 0);
    const notesWithTranscription = conversation.notes.filter(note => note.transcription).length;

    return `${conversation.notes.length} voice note${conversation.notes.length !== 1 ? 's' : ''} recorded. ${notesWithTranscription} transcribed. Total duration: ${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s.`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') {
                    setTitle(conversation.title);
                    setIsEditingTitle(false);
                  }
                }}
              />
              <button
                onClick={handleTitleSave}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <Check className="w-5 h-5 text-green-400" />
              </button>
            </>
          ) : (
            <>
              <h2 className="flex-1 text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                {conversation.title}
              </h2>
              <button
                onClick={() => setIsEditingTitle(true)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
              >
                <Edit2 className="w-5 h-5 text-purple-300" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-black/10 overflow-x-auto">
        <div className="flex gap-1 p-2 min-w-max">
          <button
            onClick={() => setActiveTab('transcription')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
              activeTab === 'transcription'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">Transcription</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm font-medium">Summary</span>
          </button>
          <button
            onClick={() => setActiveTab('keywords')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 whitespace-nowrap ${
              activeTab === 'keywords'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">Keywords</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {activeTab === 'transcription' && (
          <div className="space-y-4">
            {conversation.notes.length === 0 ? (
              <div className="text-center text-gray-400 mt-8">
                No voice notes yet. Record your first one below!
              </div>
            ) : (
              conversation.notes.map((note) => (
                <VoiceNoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDeleteNote}
                  onUpdateTranscription={handleUpdateTranscription}
                  apiKey={apiKey}
                />
              ))
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Conversation Summary</h3>
              <p className="text-gray-300 leading-relaxed">{generateSummary()}</p>
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-purple-300 mb-4">Top Keywords</h3>
              {keywords.length === 0 ? (
                <p className="text-gray-400">No keywords extracted yet. Start recording to see keywords.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/30 rounded-full text-purple-200 text-sm font-medium backdrop-blur-xl"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Voice Recorder */}
      <div className="border-t border-white/10 backdrop-blur-xl bg-black/20">
        <VoiceRecorder onNewNote={handleNewNote} apiKey={apiKey} />
      </div>
    </div>
  );
}
