import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Message, User } from '../types';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';
import { conversationStorage, userCache } from '../utils/storage';

const ChatRoom: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();
  const { socket, onlineUsers, typingUsers } = useSocket();

  useEffect(() => {
    if (userId && token) {
      loadCachedData();
      fetchMessages();
      fetchUserDetails();
      // Clear unread count when entering chat
      conversationStorage.clearUnreadCount(userId);
    }
  }, [userId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', (message: Message) => {
        if (message.senderId === userId || message.receiverId === userId) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('message_sent', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('message_updated', (message: Message) => {
        setMessages(prev => prev.map(m => m.id === message.id ? message : m));
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_sent');
        socket.off('message_updated');
      };
    }
  }, [socket, userId]);

  const loadCachedData = () => {
    if (userId) {
      // Load cached messages
      const cachedMessages = conversationStorage.getMessages(userId);
      if (cachedMessages.length > 0) {
        setMessages(cachedMessages);
        setLoading(false);
      }

      // Load cached user data
      const cachedUser = userCache.getUser(userId);
      if (cachedUser) {
        setOtherUser(cachedUser);
      }
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`https://apx-nt5z.onrender.com/api/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Cache messages
        if (userId) {
          conversationStorage.setMessages(userId, data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const response = await fetch('https://apx-nt5z.onrender.com/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const users = await response.json();
        const user = users.find((u: User) => u.id === userId);
        if (user) {
          setOtherUser(user);
          // Cache user data
          userCache.setUser(user.id, user);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const isOnline = otherUser ? onlineUsers.has(otherUser.id) : false;
  const isTyping = otherUser ? typingUsers.has(otherUser.id) : false;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 p-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/"
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-medium">
                {otherUser?.avatar ? (
                  <img
                    src={`https://apx-nt5z.onrender.com${otherUser.avatar}`}
                    alt={otherUser.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  otherUser?.name?.[0]?.toUpperCase() || '?'
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-800 animate-glow"></div>
              )}
            </div>
            
            <div className="flex-1">
              <h2 className="text-white font-medium">
                {otherUser?.name || otherUser?.username || 'Unknown User'}
              </h2>
              <p className="text-xs text-slate-400">
                {isTyping ? 'typing...' : isOnline ? 'online' : 'offline'}
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <Phone className="w-5 h-5 text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <Video className="w-5 h-5 text-slate-400" />
            </button>
            <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2 text-white">Start the conversation</h3>
            <p className="text-center">Send a message to begin chatting with {otherUser?.name || 'this user'}</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              user={otherUser}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {userId && <ChatInput receiverId={userId} />}
    </div>
  );
};

export default ChatRoom;