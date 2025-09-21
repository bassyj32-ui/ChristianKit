// Default images for new users
// Using free stock photos from Unsplash with proper attribution

export interface DefaultImage {
  id: string;
  url: string;
  alt: string;
  attribution: string;
}

// Default Profile Pictures - Praying Hands Theme
export const DEFAULT_PROFILE_IMAGES: DefaultImage[] = [
  {
    id: 'praying-hands-1',
    url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=400&fit=crop&crop=face',
    alt: 'Praying hands silhouette',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-2',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    alt: 'Hands in prayer',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-3',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=face',
    alt: 'Praying hands close-up',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-4',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=face',
    alt: 'Hands folded in prayer',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-5',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    alt: 'Praying hands in light',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-6',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=face',
    alt: 'Hands in prayer gesture',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-7',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=face',
    alt: 'Praying hands silhouette',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-8',
    url: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=400&fit=crop&crop=face',
    alt: 'Hands folded in prayer',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-9',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    alt: 'Praying hands close-up',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'praying-hands-10',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop&crop=face',
    alt: 'Hands in prayer gesture',
    attribution: 'Photo by Ben White on Unsplash'
  }
];

// Default Banner Images - Nature Theme
export const DEFAULT_BANNER_IMAGES: DefaultImage[] = [
  {
    id: 'nature-1',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Mountain landscape at sunset',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-2',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Peaceful lake with mountains',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-3',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Forest path in golden light',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-4',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Ocean waves at sunrise',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-5',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Mountain peak with clouds',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-6',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Field of flowers at dawn',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-7',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Waterfall in forest',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-8',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Desert dunes at sunset',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-9',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Snow-capped mountains',
    attribution: 'Photo by Ben White on Unsplash'
  },
  {
    id: 'nature-10',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
    alt: 'Garden with blooming flowers',
    attribution: 'Photo by Ben White on Unsplash'
  }
];

// Function to get a random default profile image
export const getRandomDefaultProfileImage = (): DefaultImage => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_IMAGES.length);
  return DEFAULT_PROFILE_IMAGES[randomIndex];
};

// Function to get a random default banner image
export const getRandomDefaultBannerImage = (): DefaultImage => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_BANNER_IMAGES.length);
  return DEFAULT_BANNER_IMAGES[randomIndex];
};

// Function to get a consistent default image based on user ID
export const getConsistentDefaultProfileImage = (userId: string): DefaultImage => {
  // Use user ID to generate a consistent index
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % DEFAULT_PROFILE_IMAGES.length;
  return DEFAULT_PROFILE_IMAGES[index];
};

// Function to get a consistent default banner image based on user ID
export const getConsistentDefaultBannerImage = (userId: string): DefaultImage => {
  // Use user ID to generate a consistent index
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % DEFAULT_BANNER_IMAGES.length;
  return DEFAULT_BANNER_IMAGES[index];
};

// Function to check if an image URL is a default image
export const isDefaultImage = (url: string): boolean => {
  return DEFAULT_PROFILE_IMAGES.some(img => img.url === url) || 
         DEFAULT_BANNER_IMAGES.some(img => img.url === url);
};

// Function to get image attribution
export const getImageAttribution = (url: string): string | null => {
  const profileImg = DEFAULT_PROFILE_IMAGES.find(img => img.url === url);
  if (profileImg) return profileImg.attribution;
  
  const bannerImg = DEFAULT_BANNER_IMAGES.find(img => img.url === url);
  if (bannerImg) return bannerImg.attribution;
  
  return null;
};