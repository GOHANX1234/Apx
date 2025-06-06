import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit, LogOut, Link as LinkIcon, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    links: [] as string[]
  });
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { user, logout, updateProfile, token } = useAuth();

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        links: user.links || []
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!file || !token) return;

    setUploading(true);
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
        await updateProfile({ [type]: url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const addLink = () => {
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, '']
    }));
  };

  const updateLink = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? value : link)
    }));
  };

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  if (!user) return null;

  return (
    <div className="h-screen overflow-y-auto">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500">
        {user.banner && (
          <img
            src={`https://apx-nt5z.onrender.com${user.banner}`}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={uploading}
          className="absolute top-4 right-4 p-2 bg-black/20 rounded-xl text-white hover:bg-black/30 transition-colors disabled:opacity-50"
        >
          {uploading ? <Upload className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'banner');
          }}
          className="hidden"
        />
      </div>

      {/* Profile Content */}
      <div className="relative px-4 pb-8">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-800">
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
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {uploading ? <Upload className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, 'avatar');
            }}
            className="hidden"
          />
        </div>

        {/* Profile Info */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400">@{user.username}</p>
            </div>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Name */}
          {isEditing && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Name</h3>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {/* Bio */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Bio</h3>
            {isEditing ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="w-full p-3 bg-gray-700/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
            ) : (
              <p className="text-gray-300">
                {user.bio || 'No bio yet. Click edit to add one!'}
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Links</h3>
              {isEditing && (
                <button
                  onClick={addLink}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  + Add Link
                </button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                {formData.links.map((link, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => updateLink(index, e.target.value)}
                      placeholder="https://..."
                      className="flex-1 p-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                      onClick={() => removeLink(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {user.links && user.links.length > 0 ? (
                  user.links.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>{link}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-gray-400">No links added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-800/30 rounded-xl">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Messages Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-gray-400 text-sm">Active Chats</p>
            </div>
          </div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default Profile;