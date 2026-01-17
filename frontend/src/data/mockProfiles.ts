import { UserProfile, Match } from '@/types/profile';

// Keep only one demo profile for demonstration when no real profiles exist
export const mockProfiles: UserProfile[] = [
  {
    id: 'demo-1',
    name: 'Juliet Capulet',
    age: 25,
    gender: 'female',
    location: 'Delhi NCR',
    religion: 'Hindu',
    education: 'B.Tech',
    occupation: 'Software Engineer',
    height: "5'4\"",
    about: 'This is a demo profile to show how the app works. Real profiles from registered users will appear here once you have more community members!',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    ],
    interests: ['Travel', 'Reading', 'Music', 'Yoga'],
    lookingFor: ['Kind', 'Ambitious', 'Family-oriented'],
    verified: false,
    premium: false,
    lastActive: 'Demo Profile',
    // Tyagi Community Fields (demo)
    gotra: 'Bhardwaj',
    sub_caste: 'Tyagi',
    native_village: 'Baraut',
    manglik_status: 'no',
  },
];

// Empty mock matches - real matches will come from API
export const mockMatches: Match[] = [];
