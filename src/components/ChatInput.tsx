import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Smile, Mic } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';

interface ChatInputProps {
  receiverId: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ receiverId }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, setTyping } = useSocket();
  const { user, token } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSend = () => {
    if (message.trim() && user) {
      sendMessage({
        senderId: user.id,
        receiverId,
        content: message,
        type: 'text',
      });
      setMessage('');
      handleTypingStop();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      handleTypingStart();
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      setTyping(receiverId, true);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(handleTypingStop, 2000);
  };

  const handleTypingStop = () => {
    if (isTyping) {
      setIsTyping(false);
      setTyping(receiverId, false);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !token) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('https://apx-nt5z.onrender.com/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        sendMessage({
          senderId: user.id,
          receiverId,
          content: '',
          type: file.type.startsWith('image/') ? 'image' : 'file',
          fileUrl: url,
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="relative">
      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 z-50 mb-2">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            width={280}
            height={400}
          />
        </div>
      )}
      
      <div className="flex items-end space-x-2 p-4 bg-slate-800/50 backdrop-blur-md border-t border-slate-700/50">
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-700/50"
          >
            <Smile className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full bg-slate-700/50 text-white rounded-2xl px-4 py-2 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-slate-600/50 max-h-32"
            rows={1}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!message.trim()}
          className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-emerald"
        >
          <Send className="w-5 h-5" />
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,audio/*,.pdf,.doc,.docx"
        />
      </div>
    </div>
  );
};

export default ChatInput;