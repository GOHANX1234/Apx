import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Smile, MoreHorizontal } from 'lucide-react';
import { Message, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import EmojiPicker from 'emoji-picker-react';

interface MessageBubbleProps {
  message: Message;
  user?: User;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { user: currentUser } = useAuth();
  const { addReaction } = useSocket();
  
  const isOwn = message.senderId === currentUser?.id;
  const senderName = isOwn ? 'You' : (user?.name || user?.username || 'Unknown');

  const handleEmojiClick = (emojiData: any) => {
    addReaction(message.id, emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const groupedReactions = message.reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof message.reactions>);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}
    >
      <div className={`flex items-end space-x-2 max-w-xs md:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {!isOwn && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
            {senderName[0]?.toUpperCase()}
          </div>
        )}
        
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2 relative ${
              isOwn
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white'
                : 'bg-slate-700/50 text-slate-100 border border-slate-600/50'
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {!isOwn && (
              <div className="text-xs text-slate-400 mb-1">{senderName}</div>
            )}
            
            {message.type === 'text' && (
              <p className="text-sm">{message.content}</p>
            )}
            
            {message.type === 'image' && (
              <div className="space-y-2">
                {message.content && <p className="text-sm">{message.content}</p>}
                <img
                  src={`http://localhost:3001${message.fileUrl}`}
                  alt="Image"
                  className="rounded-lg max-w-full h-auto"
                />
              </div>
            )}
            
            <div className="text-xs opacity-70 mt-1">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              {message.isEdited && <span className="ml-1">(edited)</span>}
            </div>

            {/* Action buttons */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`absolute -top-8 ${isOwn ? 'right-0' : 'left-0'} flex space-x-1 bg-slate-800/90 rounded-lg p-1 shadow-lg border border-slate-600/50`}
              >
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 hover:bg-slate-700/50 rounded transition-colors"
                >
                  <Smile className="w-4 h-4 text-slate-400" />
                </button>
                <button className="p-1 hover:bg-slate-700/50 rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(groupedReactions).map(([emoji, reactions]) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => addReaction(message.id, emoji)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                    reactions.some(r => r.userId === currentUser?.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 border border-slate-600/50'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{reactions.length}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute top-full left-0 z-50 mt-2">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width={280}
                height={400}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;