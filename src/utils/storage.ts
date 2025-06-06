// Local storage utilities for chat persistence
export const STORAGE_KEYS = {
  CONVERSATIONS: 'xgram_conversations',
  MESSAGES: 'xgram_messages',
  UNREAD_COUNTS: 'xgram_unread_counts',
  USER_CACHE: 'xgram_user_cache',
  GROUPS: 'xgram_groups',
  GROUP_MESSAGES: 'xgram_group_messages'
};

export const storage = {
  // Get data from localStorage
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  // Set data to localStorage
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  // Remove data from localStorage
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  // Clear all app data
  clear: () => {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

// Conversation storage utilities
export const conversationStorage = {
  getConversations: () => storage.get(STORAGE_KEYS.CONVERSATIONS) || [],
  setConversations: (conversations: any[]) => storage.set(STORAGE_KEYS.CONVERSATIONS, conversations),
  
  getMessages: (conversationId: string) => {
    const allMessages = storage.get(STORAGE_KEYS.MESSAGES) || {};
    return allMessages[conversationId] || [];
  },
  
  setMessages: (conversationId: string, messages: any[]) => {
    const allMessages = storage.get(STORAGE_KEYS.MESSAGES) || {};
    allMessages[conversationId] = messages;
    storage.set(STORAGE_KEYS.MESSAGES, allMessages);
  },
  
  addMessage: (conversationId: string, message: any) => {
    const messages = conversationStorage.getMessages(conversationId);
    messages.push(message);
    conversationStorage.setMessages(conversationId, messages);
  },
  
  getUnreadCount: (conversationId: string) => {
    const unreadCounts = storage.get(STORAGE_KEYS.UNREAD_COUNTS) || {};
    return unreadCounts[conversationId] || 0;
  },
  
  setUnreadCount: (conversationId: string, count: number) => {
    const unreadCounts = storage.get(STORAGE_KEYS.UNREAD_COUNTS) || {};
    unreadCounts[conversationId] = count;
    storage.set(STORAGE_KEYS.UNREAD_COUNTS, unreadCounts);
  },
  
  incrementUnreadCount: (conversationId: string) => {
    const currentCount = conversationStorage.getUnreadCount(conversationId);
    conversationStorage.setUnreadCount(conversationId, currentCount + 1);
  },
  
  clearUnreadCount: (conversationId: string) => {
    conversationStorage.setUnreadCount(conversationId, 0);
  }
};

// User cache utilities
export const userCache = {
  getUser: (userId: string) => {
    const cache = storage.get(STORAGE_KEYS.USER_CACHE) || {};
    return cache[userId] || null;
  },
  
  setUser: (userId: string, user: any) => {
    const cache = storage.get(STORAGE_KEYS.USER_CACHE) || {};
    cache[userId] = user;
    storage.set(STORAGE_KEYS.USER_CACHE, cache);
  },
  
  getUsers: () => storage.get(STORAGE_KEYS.USER_CACHE) || {},
  setUsers: (users: any) => storage.set(STORAGE_KEYS.USER_CACHE, users)
};

// Group storage utilities
export const groupStorage = {
  getGroups: () => storage.get(STORAGE_KEYS.GROUPS) || [],
  setGroups: (groups: any[]) => storage.set(STORAGE_KEYS.GROUPS, groups),
  
  getGroupMessages: (groupId: string) => {
    const allMessages = storage.get(STORAGE_KEYS.GROUP_MESSAGES) || {};
    return allMessages[groupId] || [];
  },
  
  setGroupMessages: (groupId: string, messages: any[]) => {
    const allMessages = storage.get(STORAGE_KEYS.GROUP_MESSAGES) || {};
    allMessages[groupId] = messages;
    storage.set(STORAGE_KEYS.GROUP_MESSAGES, allMessages);
  },
  
  addGroupMessage: (groupId: string, message: any) => {
    const messages = groupStorage.getGroupMessages(groupId);
    messages.push(message);
    groupStorage.setGroupMessages(groupId, messages);
  }
};