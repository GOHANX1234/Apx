import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MessageCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Conversation, User } from '../types';
import { conversationStorage, userCache } from '../utils/storage';

const Chats: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const { token } = useAuth();
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    fetchConversations();
    loadCachedConversations();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (socket) {
      socket.on('receive_message', () => {
        fetchConversations();
      });

      socket.on('message_sent', () => {
        fetchConversations();
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_sent');
      };
    }
  }, [socket]);

  const loadCachedConversations = () => {
    const cached = conversationStorage.getConversations();
    if (cached.length > 0) {
      setConversations(cached);
      setLoading(false);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Add unread counts from local storage
        const conversationsWithUnread = data.map((conv: Conversation) => ({
          ...conv,
          unreadCount: conversationStorage.getUnreadCount(conv.user?.id || '')
        }));
        
        setConversations(conversationsWithUnread);
        conversationStorage.setConversations(conversationsWithUnread);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        
        // Cache users for offline viewing
        data.forEach((user: User) => {
          userCache.setUser(user.id, user);
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-md border-b border-slate-700/50 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Xgram</h1>
          </div>
          <div className="flex space-x-2">
            <Link
              to="/groups"
              className="p-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
            >
              <Users className="w-5 h-5" />
            </Link>
            <Link
              to="/search"
              className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchTerm.trim() && searchResults.length > 0 ? (
          // Search Results
          <div className="p-4">
            <h3 className="text-slate-400 text-sm font-medium mb-3">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center p-3 bg-slate-800/30 rounded-xl hover:bg-slate-700/30 transition-colors"
                >
                  <Link
                    to={`/chat/${user.id}`}
                    className="flex items-center space-x-3 flex-1"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-medium text-lg">
                        {user.avatar ? (
                          <img
                            src={`http://localhost:3001${user.avatar}`}
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.name[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      {onlineUsers.has(user.id) && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 animate-glow"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{user.name}</h3>
                      <p className="text-slate-400 text-sm">@{user.username}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No conversations yet</h3>
            <p className="text-center mb-6">Start a conversation by searching for users</p>
            <Link
              to="/search"
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-xl hover:from-emerald-600 hover:to-blue-600 transition-all shadow-glow-emerald"
            >
              Find People
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.3)' }}
              >
                <Link
                  to={`/chat/${conversation.user?.id}`}
                  onClick={() => {
                    // Clear unread count when opening chat
                    conversationStorage.clearUnreadCount(conversation.user?.id || '');
                  }}
                  className="flex items-center p-4 hover:bg-slate-700/30 transition-colors"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-medium text-lg">
                      {conversation.user?.avatar ? (
                        <img
                          src={`http://localhost:3001${conversation.user.avatar}`}
                          alt={conversation.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conversation.user?.name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>
                    {onlineUsers.has(conversation.user?.id || '') && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800 animate-glow"></div>
                    )}
                    {conversation.unreadCount && conversation.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-glow-emerald">
                        <span className="text-xs text-white font-bold px-1">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium truncate">
                        {conversation.user?.name || conversation.user?.username}
                      </h3>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className={`text-sm truncate ${conversation.unreadCount && conversation.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                      {conversation.type === 'image' ? '📷 Image' : conversation.content}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chats;