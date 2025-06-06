import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Users, Search, User } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: MessageCircle, label: 'Chats' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800/90 backdrop-blur-md border-t border-slate-700/50 md:hidden">
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center py-2 px-3 rounded-xl transition-colors"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-emerald-500/20 rounded-xl border border-emerald-500/30"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon
                className={`w-6 h-6 mb-1 transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;