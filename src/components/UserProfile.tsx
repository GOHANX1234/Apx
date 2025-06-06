import React from 'react';
import { motion } from 'framer-motion';
import { X, MessageCircle, Calendar, Link as LinkIcon, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { User } from '../types';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

interface UserProfileProps {
  user: User;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onClose }) => {
  const { onlineUsers } = useSocket();
  const isOnline = onlineUsers.has(user.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-2xl relative">
            {user.banner && (
              <img
                src={`https://apx-nt5z.onrender.com${user.banner}`}
                alt="Banner"
                className="w-full h-full object-cover rounded-t-2xl"
              />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white hover:bg-black/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Avatar */}
          <div className="absolute -bottom-12 left-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-800">
                {user.avatar ? (
                  <img
                    src={`https://apx-nt5z.onrender.com${user.avatar}`}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name[0]?.toUpperCase()
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-gray-800"></div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-gray-400">@{user.username}</p>
              </div>
              <Link
                to={`/chat/${user.id}`}
                onClick={onClose}
                className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span>{isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true })}`}</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
              <p className="text-gray-300">{user.bio}</p>
            </div>
          )}

          {/* Links */}
          {user.links && user.links.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Links</h3>
              <div className="space-y-2">
                {user.links.map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    <span className="truncate">{link}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-700/30 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Messages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Groups</p>
            </div>
          </div>

          {/* Action Button */}
          <Link
            to={`/chat/${user.id}`}
            onClick={onClose}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Send Message</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;