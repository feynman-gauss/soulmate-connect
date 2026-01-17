// Tyagi Community Family Details
export interface FamilyDetails {
  father_name?: string;
  father_occupation?: string;
  mother_name?: string;
  mother_occupation?: string;
  siblings_brothers?: number;
  siblings_sisters?: number;
  family_type?: 'joint' | 'nuclear';
  family_status?: string;
  family_values?: string;
}

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

  // Tyagi Community Specific Fields
  gotra?: string;
  sub_caste?: string;
  native_village?: string;
  date_of_birth?: string;
  manglik_status?: 'yes' | 'no' | 'partial' | 'dont_know';
  family_details?: FamilyDetails;
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
