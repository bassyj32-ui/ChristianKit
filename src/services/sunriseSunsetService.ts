import { supabase } from '../utils/supabase';

export interface PrayerTime {
  type: 'sunrise' | 'sunset' | 'custom';
  time: string; // HH:MM format
  name: string;
  description: string;
  isActive: boolean;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  timezone: string;
  city?: string;
  country?: string;
}

export interface SunriseSunsetData {
  sunrise: string; // HH:MM format
  sunset: string; // HH:MM format
  civil_twilight_begin: string;
  civil_twilight_end: string;
  nautical_twilight_begin: string;
  nautical_twilight_end: string;
  astronomical_twilight_begin: string;
  astronomical_twilight_end: string;
}

export class SunriseSunsetService {
  private readonly PRAYER_TIMES = {
    morning: {
      name: 'Morning Prayer (Lauds)',
      description: 'Ancient tradition of morning praise and thanksgiving',
      offset: -30, // 30 minutes before sunrise
      type: 'sunrise' as const
    },
    sunrise: {
      name: 'Sunrise Prayer',
      description: 'Greeting the new day with prayer and gratitude',
      offset: 0, // At sunrise
      type: 'sunrise' as const
    },
    midmorning: {
      name: 'Mid-Morning Prayer (Terce)',
      description: 'Third hour prayer - seeking God\'s guidance',
      offset: 180, // 3 hours after sunrise
      type: 'sunrise' as const
    },
    noon: {
      name: 'Noon Prayer (Sext)',
      description: 'Sixth hour prayer - midday devotion',
      offset: 360, // 6 hours after sunrise
      type: 'sunrise' as const
    },
    midafternoon: {
      name: 'Mid-Afternoon Prayer (None)',
      description: 'Ninth hour prayer - afternoon reflection',
      offset: 540, // 9 hours after sunrise
      type: 'sunrise' as const
    },
    sunset: {
      name: 'Evening Prayer (Vespers)',
      description: 'Ancient tradition of evening praise and thanksgiving',
      offset: 0, // At sunset
      type: 'sunset' as const
    },
    evening: {
      name: 'Evening Prayer',
      description: 'Ending the day with prayer and reflection',
      offset: 30, // 30 minutes after sunset
      type: 'sunset' as const
    },
    compline: {
      name: 'Night Prayer (Compline)',
      description: 'Final prayer of the day - seeking peace',
      offset: 120, // 2 hours after sunset
      type: 'sunset' as const
    }
  };

  /**
   * Get user's location from database or browser
   */
  async getUserLocation(): Promise<LocationData | null> {
    try {
      // First try to get from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: locationData } = await supabase
          .from('user_locations')
          .select('latitude, longitude, timezone, city, country')
          .eq('user_id', user.id)
          .single();

        if (locationData) {
          return locationData;
        }
      }

      // Fallback to browser geolocation
      return await this.getBrowserLocation();
    } catch (error) {
      console.error('Error getting user location:', error);
      return null;
    }
  }

  /**
   * Get location from browser geolocation
   */
  private async getBrowserLocation(): Promise<LocationData | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            
            // Get timezone from coordinates
            const timezone = await this.getTimezoneFromCoordinates(latitude, longitude);
            
            // Get city/country from coordinates
            const locationInfo = await this.getLocationInfo(latitude, longitude);
            
            resolve({
              latitude,
              longitude,
              timezone: timezone || 'UTC',
              city: locationInfo?.city,
              country: locationInfo?.country
            });
          } catch (error) {
            console.error('Error processing location:', error);
            resolve({
              latitude,
              longitude: position.coords.longitude,
              timezone: 'UTC',
              city: undefined,
              country: undefined
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000 // 10 minutes
        }
      );
    });
  }

  /**
   * Get timezone from coordinates using timezone API
   */
  private async getTimezoneFromCoordinates(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://api.timezonedb.com/v2.1/get-time-zone?key=${import.meta.env.VITE_TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.zoneName || null;
      }
    } catch (error) {
      console.error('Error getting timezone:', error);
    }

    // Fallback: estimate timezone from longitude
    const timezoneOffset = Math.round(lng / 15);
    const utcHours = new Date().getUTCHours();
    const localHours = (utcHours + timezoneOffset + 24) % 24;
    
    return `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  }

  /**
   * Get city/country from coordinates using reverse geocoding
   */
  private async getLocationInfo(lat: number, lng: number): Promise<{ city?: string; country?: string } | null> {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${import.meta.env.VITE_OPENCAGE_API_KEY}&no_annotations=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const components = data.results[0].components;
          return {
            city: components.city || components.town || components.village,
            country: components.country
          };
        }
      }
    } catch (error) {
      console.error('Error getting location info:', error);
    }

    return null;
  }

  /**
   * Get sunrise/sunset times for a specific date and location
   */
  async getSunriseSunset(date: Date, location: LocationData): Promise<SunriseSunsetData | null> {
    try {
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&date=${date.toISOString().split('T')[0]}&formatted=0`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          return this.formatSunriseSunsetData(data.results, location.timezone);
        }
      }
    } catch (error) {
      console.error('Error getting sunrise/sunset data:', error);
    }

    return null;
  }

  /**
   * Format sunrise/sunset data to local time
   */
  private formatSunriseSunsetData(results: any, timezone: string): SunriseSunsetData {
    const formatTime = (utcTime: string) => {
      const date = new Date(utcTime);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      });
    };

    return {
      sunrise: formatTime(results.sunrise),
      sunset: formatTime(results.sunset),
      civil_twilight_begin: formatTime(results.civil_twilight_begin),
      civil_twilight_end: formatTime(results.civil_twilight_end),
      nautical_twilight_begin: formatTime(results.nautical_twilight_begin),
      nautical_twilight_end: formatTime(results.nautical_twilight_end),
      astronomical_twilight_begin: formatTime(results.astronomical_twilight_begin),
      astronomical_twilight_end: formatTime(results.astronomical_twilight_end)
    };
  }

  /**
   * Calculate prayer times based on sunrise/sunset
   */
  calculatePrayerTimes(sunriseSunset: SunriseSunsetData): PrayerTime[] {
    const prayerTimes: PrayerTime[] = [];
    
    // Parse sunrise and sunset times
    const [sunriseHour, sunriseMinute] = sunriseSunset.sunrise.split(':').map(Number);
    const [sunsetHour, sunsetMinute] = sunriseSunset.sunset.split(':').map(Number);
    
    // Convert to minutes for easier calculation
    const sunriseMinutes = sunriseHour * 60 + sunriseMinute;
    const sunsetMinutes = sunsetHour * 60 + sunsetMinute;

    // Calculate each prayer time
    Object.entries(this.PRAYER_TIMES).forEach(([key, prayer]) => {
      let prayerMinutes: number;
      
      if (prayer.type === 'sunrise') {
        prayerMinutes = sunriseMinutes + prayer.offset;
      } else {
        prayerMinutes = sunsetMinutes + prayer.offset;
      }

      // Handle day wrapping
      if (prayerMinutes < 0) prayerMinutes += 1440; // 24 hours
      if (prayerMinutes >= 1440) prayerMinutes -= 1440;

      const hours = Math.floor(prayerMinutes / 60);
      const minutes = prayerMinutes % 60;
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      prayerTimes.push({
        type: prayer.type,
        time: timeString,
        name: prayer.name,
        description: prayer.description,
        isActive: true
      });
    });

    // Sort by time
    return prayerTimes.sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * Get next prayer time
   */
  getNextPrayerTime(prayerTimes: PrayerTime[]): PrayerTime | null {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Find the next prayer time
    const nextPrayer = prayerTimes.find(prayer => 
      prayer.time > currentTime && prayer.isActive
    );

    if (nextPrayer) {
      return nextPrayer;
    }

    // If no prayer time found today, get the first one for tomorrow
    return prayerTimes.find(prayer => prayer.isActive) || null;
  }

  /**
   * Save user location to database
   */
  async saveUserLocation(location: LocationData): Promise<boolean> {
    try {
      if (!supabase) {
        console.warn('Supabase client not available');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('No user found');
        return false;
      }

      const { error } = await supabase
        .from('user_locations')
        .upsert({
          user_id: user.id,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone,
          city: location.city,
          country: location.country,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving user location:', error);
        return false;
      }

      // User location saved successfully
      return true;
    } catch (error) {
      console.error('Error saving user location:', error);
      return false;
    }
  }

  /**
   * Get prayer time description with biblical reference
   */
  getPrayerTimeDescription(prayerTime: PrayerTime): string {
    const descriptions: Record<string, string> = {
      'Morning Prayer (Lauds)': 'Psalm 5:3 - "In the morning, Lord, you hear my voice; in the morning I lay my requests before you and wait expectantly."',
      'Sunrise Prayer': 'Psalm 19:2 - "Day after day they pour forth speech; night after night they reveal knowledge."',
      'Mid-Morning Prayer (Terce)': 'Acts 2:15 - "These people are not drunk, as you suppose. It\'s only nine in the morning!"',
      'Noon Prayer (Sext)': 'Psalm 55:17 - "Evening, morning and noon I cry out in distress, and he hears my voice."',
      'Mid-Afternoon Prayer (None)': 'Acts 3:1 - "One day Peter and John were going up to the temple at the time of prayer - at three in the afternoon."',
      'Evening Prayer (Vespers)': 'Psalm 141:2 - "May my prayer be set before you like incense; may the lifting up of my hands be like the evening sacrifice."',
      'Evening Prayer': 'Psalm 4:8 - "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety."',
      'Night Prayer (Compline)': 'Psalm 4:4 - "Tremble and do not sin; when you are on your beds, search your hearts and be silent."'
    };

    return descriptions[prayerTime.name] || prayerTime.description;
  }

  /**
   * Check if it's time for a specific prayer
   */
  isPrayerTime(prayerTime: PrayerTime, toleranceMinutes: number = 15): boolean {
    if (!prayerTime.isActive) return false;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const [currentHour, currentMinute] = currentTime.split(':').map(Number);
    const [prayerHour, prayerMinute] = prayerTime.time.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMinute;
    const prayerMinutes = prayerHour * 60 + prayerMinute;

    const diff = Math.abs(currentMinutes - prayerMinutes);
    return diff <= toleranceMinutes;
  }
}

export const sunriseSunsetService = new SunriseSunsetService();
