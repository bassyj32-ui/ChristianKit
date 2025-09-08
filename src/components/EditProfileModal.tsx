import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onProfileUpdated?: () => void;
}

interface ProfileData {
  display_name: string;
  bio: string;
  location: string;
  favorite_verse: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
  onProfileUpdated
}) => {
  const [profileData, setProfileData] = useState<ProfileData>({
    display_name: '',
    bio: '',
    location: '',
    favorite_verse: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfile();
    }
  }, [isOpen, userId]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio, location, favorite_verse')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setProfileData({
        display_name: data?.display_name || '',
        bio: data?.bio || '',
        location: data?.location || '',
        favorite_verse: data?.favorite_verse || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          display_name: profileData.display_name.trim(),
          bio: profileData.bio.trim(),
          location: profileData.location.trim(),
          favorite_verse: profileData.favorite_verse.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      onProfileUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-2xl max-w-md w-full border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) => handleInputChange('display_name', e.target.value)}
                  placeholder="Your display name"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  maxLength={50}
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell others about your faith journey..."
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-slate-400 mt-1">
                  {profileData.bio.length}/200 characters
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="City, Country"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300"
                  maxLength={100}
                />
              </div>

              {/* Favorite Verse */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Favorite Bible Verse
                </label>
                <textarea
                  value={profileData.favorite_verse}
                  onChange={(e) => handleInputChange('favorite_verse', e.target.value)}
                  placeholder="Share your favorite Bible verse..."
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all duration-300 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="text-xs text-slate-400 mt-1">
                  {profileData.favorite_verse.length}/500 characters
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-400 hover:text-white transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-6 py-2 rounded-lg font-semibold hover:from-amber-500 hover:to-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;

