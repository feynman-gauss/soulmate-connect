// Default profile images for male/female using DiceBear Avatars
export const DEFAULT_MALE_PHOTO = 'https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4';
export const DEFAULT_FEMALE_PHOTO = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jack';

export const getDefaultPhoto = (gender?: string): string => {
    return gender === 'female' ? DEFAULT_FEMALE_PHOTO : DEFAULT_MALE_PHOTO;
};

// Get profile photo with fallback to default based on gender
// Photos are now stored as base64 data URLs in the database, which work directly in img src
export const getProfilePhoto = (photos?: string[], gender?: string): string => {
    if (photos && photos.length > 0 && photos[0]) {
        return photos[0];
    }
    return getDefaultPhoto(gender);
};

