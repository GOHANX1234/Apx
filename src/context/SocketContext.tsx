import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { Message } from '../types';
import { conversationStorage, groupStorage } from '../utils/storage';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  typingUsers: Map<string, boolean>;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'reactions' | 'replies' | 'isEdited'>) => void;
  addReaction: (messageId: string, emoji: string) => void;
  setTyping: (receiverId: string, isTyping: boolean, groupId?: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, boolean>>(new Map());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:3001');
      setSocket(newSocket);

      newSocket.emit('join', user.id);

      newSocket.on('user_online', (userId: string) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      newSocket.on('user_offline', (userId: string) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      newSocket.on('user_typing', ({ userId, isTyping }) => {
        setTypingUsers(prev => {
          const newMap = new Map(prev);
          if (isTyping) {
            newMap.set(userId, true);
          } else {
            newMap.delete(userId);
          }
          return newMap;
        });
      });

      newSocket.on('receive_message', (message: Message) => {
        // Store message in local storage
        if (message.groupId) {
          groupStorage.addGroupMessage(message.groupId, message);
        } else {
          const conversationId = message.senderId === user.id ? message.receiverId! : message.senderId;
          conversationStorage.addMessage(conversationId, message);
          
          // Increment unread count if message is from another user
          if (message.senderId !== user.id) {
            conversationStorage.incrementUnreadCount(conversationId);
          }
        }
      });

      newSocket.on('message_sent', (message: Message) => {
        // Store sent message in local storage
        if (message.groupId) {
          groupStorage.addGroupMessage(message.groupId, message);
        } else {
          conversationStorage.addMessage(message.receiverId!, message);
        }
      });

      newSocket.on('message_updated', (message: Message) => {
        // Update message in local storage
        if (message.groupId) {
          const messages = groupStorage.getGroupMessages(message.groupId);
          const updatedMessages = messages.map((m: Message) => m.id === message.id ? message : m);
          groupStorage.setGroupMessages(message.groupId, updatedMessages);
        } else {
          const conversationId = message.senderId === user.id ? message.receiverId! : message.senderId;
          const messages = conversationStorage.getMessages(conversationId);
          const updatedMessages = messages.map((m: Message) => m.id === message.id ? message : m);
          conversationStorage.setMessages(conversationId, updatedMessages);
        }
      });

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = (message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'reactions' | 'replies' | 'isEdited'>) => {
    if (socket) {
      socket.emit('send_message', message);
    }
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (socket && user) {
      socket.emit('message_reaction', {
        messageId,
        userId: user.id,
        emoji
      });
    }
  };

  const setTyping = (receiverId: string, isTyping: boolean, groupId?: string) => {
    if (socket && user) {
      socket.emit('typing', {
        senderId: user.id,
        receiverId,
        groupId,
        isTyping
      });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      typingUsers,
      sendMessage,
      addReaction,
      setTyping
    }}>
      {children}
    </SocketContext.Provider>
  );
};