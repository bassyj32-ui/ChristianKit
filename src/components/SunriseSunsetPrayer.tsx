import React, { useState, useEffect } from 'react';
import { sunriseSunsetService, PrayerTime, LocationData, SunriseSunsetData } from '../services/sunriseSunsetService';

export const SunriseSunsetPrayer: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunsetData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Load initial data
    loadPrayerData();

    return () => clearInterval(timer);
  }, []);

  const loadPrayerData = async () => {
    setIsLoading(true);
    try {
      // Get user location
      const userLocation = await sunriseSunsetService.getUserLocation();
      setLocation(userLocation);

      if (userLocation) {
        // Get sunrise/sunset data for today
        const today = new Date();
        const sunriseData = await sunriseSunsetService.getSunriseSunset(today, userLocation);
        setSunriseSunset(sunriseData);

        if (sunriseData) {
          // Calculate prayer times
          const times = sunriseSunsetService.calculatePrayerTimes(sunriseData);
          setPrayerTimes(times);

          // Get next prayer time
          const next = sunriseSunsetService.getNextPrayerTime(times);
          setNextPrayer(next);
        }
      } else {
        setShowLocationPrompt(true);
      }
    } catch (error) {
      console.error('Error loading prayer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableLocation = async () => {
    setIsLoading(true);
    try {
      const userLocation = await sunriseSunsetService.getUserLocation();
      
      if (userLocation) {
        setLocation(userLocation);
        setShowLocationPrompt(false);
        
        // Save location to database
        await sunriseSunsetService.saveUserLocation(userLocation);
        
        // Reload prayer data
        await loadPrayerData();
        
        // Show success message
        alert('🎉 Location enabled! Your prayer times are now synced with local sunrise and sunset.');
      } else {
        alert('❌ Unable to get your location. Please check your browser settings and try again.');
      }
    } catch (error) {
      console.error('Error enabling location:', error);
      alert('❌ Error enabling location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntil = (prayerTime: PrayerTime) => {
    const [prayerHour, prayerMinute] = prayerTime.time.split(':').map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(prayerHour, prayerMinute, 0, 0);
    
    const now = new Date();
    let diff = prayerDate.getTime() - now.getTime();
    
    // If prayer time has passed today, it's for tomorrow
    if (diff < 0) {
      prayerDate.setDate(prayerDate.getDate() + 1);
      diff = prayerDate.getTime() - now.getTime();
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const isPrayerTimeNow = (prayerTime: PrayerTime) => {
    return sunriseSunsetService.isPrayerTime(prayerTime, 15);
  };

  const getPrayerIcon = (prayerTime: PrayerTime) => {
    const icons: Record<string, string> = {
      'morning': '🌅',
      'sunrise': '☀️',
      'midmorning': '🌤️',
      'noon': '🌞',
      'midafternoon': '⛅',
      'sunset': '🌇',
      'evening': '🌆',
      'compline': '🌙'
    };
    return icons[prayerTime.type] || '🙏';
  };

  const getPrayerColor = (prayerTime: PrayerTime) => {
    if (isPrayerTimeNow(prayerTime)) {
      return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
    }
    
    if (prayerTime.type === 'sunrise') {
      return 'bg-gradient-to-r from-blue-400 to-purple-500 text-white';
    } else if (prayerTime.type === 'sunset') {
      return 'bg-gradient-to-r from-orange-400 to-red-500 text-white';
    } else {
      return 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading prayer times...</p>
        </div>
      </div>
    );
  }

  if (showLocationPrompt) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">🌍</span>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Enable Location-Based Prayer Times
        </h2>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Connect with ancient prayer traditions by syncing your prayer times with local sunrise and sunset. 
          Your location helps us calculate authentic prayer times based on your local daylight.
        </p>
        
        <button
          onClick={handleEnableLocation}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isLoading ? 'Enabling...' : '🌍 Enable Location'}
        </button>
        
        <p className="text-sm text-gray-500 mt-4">
          We only use your location to calculate prayer times. Your privacy is protected.
        </p>
      </div>
    );
  }

  if (!location || !sunriseSunset) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">Unable to load prayer times. Please check your location settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with current time and next prayer */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Ancient Prayer Times</h1>
            <p className="text-blue-100">
              {location.city && `${location.city}, `}{location.country}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </div>
            <div className="text-blue-100 text-sm">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {nextPrayer && (
          <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Next Prayer</p>
                <p className="text-xl font-semibold">{nextPrayer.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono">{formatTime(nextPrayer.time)}</div>
                <div className="text-blue-100 text-sm">
                  in {getTimeUntil(nextPrayer)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sunrise/Sunset Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🌅</span>
            <div>
              <h3 className="text-lg font-semibold">Sunrise</h3>
              <p className="text-yellow-100">Dawn of a new day</p>
            </div>
          </div>
          <div className="text-3xl font-mono">{formatTime(sunriseSunset.sunrise)}</div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white">
          <div className="flex items-center mb-3">
            <span className="text-3xl mr-3">🌇</span>
            <div>
              <h3 className="text-lg font-semibold">Sunset</h3>
              <p className="text-orange-100">End of day's journey</p>
            </div>
          </div>
          <div className="text-3xl font-mono">{formatTime(sunriseSunset.sunset)}</div>
        </div>
      </div>

      {/* Prayer Times Grid */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Daily Prayer Schedule</h2>
          <p className="text-gray-600 text-sm">
            Based on ancient Christian traditions, synced with your local daylight
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-4">
            {prayerTimes.map((prayerTime) => (
              <div
                key={prayerTime.name}
                className={`${getPrayerColor(prayerTime)} rounded-xl p-4 transition-all duration-200 ${
                  isPrayerTimeNow(prayerTime) ? 'ring-4 ring-yellow-300 shadow-lg' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getPrayerIcon(prayerTime)}</span>
                    <div>
                      <h3 className="font-semibold">{prayerTime.name}</h3>
                      <p className="text-sm opacity-80">
                        {sunriseSunsetService.getPrayerTimeDescription(prayerTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-mono font-semibold">
                      {formatTime(prayerTime.time)}
                    </div>
                    <div className="text-sm opacity-80">
                      {isPrayerTimeNow(prayerTime) ? (
                        <span className="text-yellow-200 font-semibold">Now!</span>
                      ) : (
                        `in ${getTimeUntil(prayerTime)}`
                      )}
                    </div>
                  </div>
                </div>

                {isPrayerTimeNow(prayerTime) && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <button className="bg-white/20 hover:bg-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                      🙏 Start Prayer Now
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ancient Traditions Info */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-100 rounded-2xl p-6">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">⛪</span>
          <h3 className="text-xl font-semibold text-amber-800">Ancient Prayer Traditions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-amber-700">
          <div>
            <p className="mb-2">
              <strong>Lauds (Morning Prayer):</strong> Ancient tradition of morning praise and thanksgiving, 
              greeting the new day with gratitude.
            </p>
            <p className="mb-2">
              <strong>Terce (Third Hour):</strong> Mid-morning prayer seeking God's guidance for the day ahead.
            </p>
            <p className="mb-2">
              <strong>Sext (Sixth Hour):</strong> Noon prayer, the sixth hour of the day, for midday devotion.
            </p>
          </div>
          
          <div>
            <p className="mb-2">
              <strong>None (Ninth Hour):</strong> Mid-afternoon prayer for reflection and renewal.
            </p>
            <p className="mb-2">
              <strong>Vespers (Evening Prayer):</strong> Ancient tradition of evening praise and thanksgiving.
            </p>
            <p className="mb-2">
              <strong>Compline (Night Prayer):</strong> Final prayer of the day, seeking peace and rest.
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-amber-200/50 rounded-lg">
          <p className="text-amber-800 text-sm">
            <strong>Biblical Reference:</strong> "Evening, morning and noon I cry out in distress, and he hears my voice." - Psalm 55:17
          </p>
        </div>
      </div>

      {/* Location Settings */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Location Settings</h3>
            <p className="text-gray-600 text-sm">
              {location.city && `${location.city}, `}{location.country} • {location.timezone}
            </p>
          </div>
          <button
            onClick={() => setShowLocationPrompt(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            🔄 Update Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default SunriseSunsetPrayer;

