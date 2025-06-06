import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Hash, Users, Trash2, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { Group } from '../types';
import CreateGroupModal from '../components/CreateGroupModal';
import { groupStorage } from '../utils/storage';

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchGroups();
    loadCachedGroups();
  }, []);

  const loadCachedGroups = () => {
    const cached = groupStorage.getGroups();
    if (cached.length > 0) {
      setGroups(cached);
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        groupStorage.setGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (name: string, members: string[]) => {
    try {
      const response = await fetch('http://localhost:3001/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, members }),
      });

      if (response.ok) {
        const newGroup = await response.json();
        setGroups(prev => [newGroup, ...prev]);
        groupStorage.setGroups([newGroup, ...groups]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const updatedGroups = groups.filter(g => g.id !== groupId);
        setGroups(updatedGroups);
        groupStorage.setGroups(updatedGroups);
      }
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-md border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Groups</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">No groups yet</h3>
            <p className="text-center mb-6">Groups are perfect for chatting with multiple people at once</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Group</span>
            </motion.button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Link
                    to={`/group/${group.id}`}
                    className="flex items-center space-x-3 flex-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium text-lg">
                      {group.avatar ? (
                        <img
                          src={`http://localhost:3001${group.avatar}`}
                          alt={group.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <Hash className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-medium truncate">{group.name}</h3>
                        {group.createdBy === user?.id && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{group.members.length} members</span>
                        </div>
                        <span>
                          Created {formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {group.createdBy === user?.id && (
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGroupModal
            onClose={() => setShowCreateModal(false)}
            onCreateGroup={handleCreateGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;