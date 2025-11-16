import { Conversation } from '@/types';
import { audioUtils } from '@/lib/audio';
import { Trash2 } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onDelete,
}: ConversationListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          No conversations yet
        </div>
      ) : (
        <div className="p-3 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`
                p-4 rounded-xl cursor-pointer transition-all duration-300 group relative overflow-hidden
                ${
                  selectedId === conversation.id
                    ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                }
              `}
              onClick={() => onSelect(conversation.id)}
            >
              {/* Gradient overlay for selected */}
              {selectedId === conversation.id && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 backdrop-blur-sm" />
              )}

              <div className="relative flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate mb-1">
                    {conversation.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {audioUtils.formatTimestamp(conversation.updatedAt)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-200">
                      {conversation.notes.length} note{conversation.notes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this conversation?')) {
                      onDelete(conversation.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-300"
                  title="Delete conversation"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
