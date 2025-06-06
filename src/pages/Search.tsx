import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, MessageCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import UserProfile from '../components/UserProfile';
import { userCache } from '../utils/storage';

const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    if (searchTerm.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchTerm]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://apx-nt5z.onrender.com/api/users/search?q=${encodeURIComponent(searchTerm)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        
        // Cache users for offline viewing
        data.forEach((user: User) => {
          userCache.setUser(user.id, user);
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (user: User) => {
    setSelectedUser(user);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Find People</h1>
        
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by username or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchTerm.trim() ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Search for people</h3>
            <p className="text-center">Enter a username or name to find people to chat with</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">🤷‍♂️</div>
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-center">Try a different search term</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {users.map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-lg">
                      {user.avatar ? (
                        <img
                          src={`https://apx-nt5z.onrender.com/api/users/search?q=${user.avatar}`}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        user.name[0]?.toUpperCase()
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <p className="text-gray-400 text-sm">@{user.username}</p>
                      {user.bio && (
                        <p className="text-gray-500 text-sm mt-1 truncate">{user.bio}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewProfile(user)}
                      className="p-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <Link
                      to={`/chat/${user.id}`}
                      className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <UserProfile
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Search;