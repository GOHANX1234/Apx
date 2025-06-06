export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  bio: string;
  avatar: string;
  banner: string;
  links: string[];
  createdAt: string;
  isOnline: boolean;
  lastSeen: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  reactions: Reaction[];
  replies: Reply[];
  isEdited: boolean;
}

export interface Reaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface Reply {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  members: string[];
  createdBy: string;
  createdAt: string;
  lastActivity: string;
}

export interface Conversation {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: string;
  createdAt: string;
  user: User;
  unreadCount?: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}