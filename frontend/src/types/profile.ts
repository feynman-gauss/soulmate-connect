export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  location: string;
  religion: string;
  education: string;
  occupation: string;
  height: string;
  about: string;
  photos: string[];
  interests: string[];
  lookingFor: string[];
  verified: boolean;
  premium: boolean;
  lastActive: string;
}

export interface FilterPreferences {
  ageRange: [number, number];
  religion: string[];
  education: string[];
  location: string[];
  height: [number, number];
}

export interface Match {
  id: string;
  profile: UserProfile;
  matchedAt: string;
  lastMessage?: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}
