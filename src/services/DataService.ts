import { User } from '@supabase/supabase-js';

export interface UserData {
  userPlan: any;
  prayerSessions: any[];
  questionnaireCompleted: boolean;
  preferences: any;
  lastSync: number;
  version: string;
}

export interface SaveResult {
  success: boolean;
  message: string;
  timestamp: number;
}

class DataService {
  private readonly VERSION = '1.0.0';
  private readonly STORAGE_KEYS = {
    USER_PLAN: 'userPlan',
    PRAYER_SESSIONS: 'prayerSessions',
    QUESTIONNAIRE_COMPLETED: 'hasCompletedQuestionnaire',
    USER_PREFERENCES: 'userPreferences',
    LAST_SYNC: 'lastDataSync',
    DATA_VERSION: 'dataVersion',
    BACKUP_DATA: 'backupData'
  };

  /**
   * Save user data with automatic backup and versioning
   */
  async saveUserData(user: User | null, data: Partial<UserData>): Promise<SaveResult> {
    try {
      const timestamp = Date.now();
      const userId = user?.uid || 'anonymous';
      
      // Create data package with metadata
      const dataPackage: UserData = {
        userPlan: data.userPlan || null,
        prayerSessions: data.prayerSessions || [],
        questionnaireCompleted: data.questionnaireCompleted || false,
        preferences: data.preferences || {},
        lastSync: timestamp,
        version: this.VERSION
      };

      // Save to localStorage with user-specific keys
      const userKey = `user_${userId}`;
      
      // Save current data
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.USER_PLAN}`, JSON.stringify(dataPackage.userPlan));
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.PRAYER_SESSIONS}`, JSON.stringify(dataPackage.prayerSessions));
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.QUESTIONNAIRE_COMPLETED}`, JSON.stringify(dataPackage.questionnaireCompleted));
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.USER_PREFERENCES}`, JSON.stringify(dataPackage.preferences));
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.LAST_SYNC}`, timestamp.toString());
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.DATA_VERSION}`, this.VERSION);

      // Create backup
      await this.createBackup(userId, dataPackage);

      // Log successful save
      console.log(`✅ Data saved successfully for user: ${userId}`, {
        timestamp,
        dataSize: JSON.stringify(dataPackage).length,
        version: this.VERSION
      });

      return {
        success: true,
        message: 'Data saved successfully',
        timestamp
      };

    } catch (error) {
      console.error('❌ Error saving user data:', error);
      return {
        success: false,
        message: `Failed to save data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Load user data with fallback to backup
   */
  async loadUserData(user: User | null): Promise<UserData | null> {
    try {
      const userId = user?.uid || 'anonymous';
      const userKey = `user_${userId}`;

      // Try to load current data
      const userPlan = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.USER_PLAN}`);
      const prayerSessions = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.PRAYER_SESSIONS}`);
      const questionnaireCompleted = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.QUESTIONNAIRE_COMPLETED}`);
      const preferences = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.USER_PREFERENCES}`);
      const lastSync = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.LAST_SYNC}`);
      const version = this.getLocalStorageItem(`${userKey}_${this.STORAGE_KEYS.DATA_VERSION}`);

      // If data exists and is valid, return it
      if (userPlan || prayerSessions || questionnaireCompleted) {
        const userData: UserData = {
          userPlan: userPlan || null,
          prayerSessions: prayerSessions || [],
          questionnaireCompleted: questionnaireCompleted || false,
          preferences: preferences || {},
          lastSync: lastSync || Date.now(),
          version: version || this.VERSION
        };

        console.log(`✅ Data loaded successfully for user: ${userId}`, {
          dataSize: JSON.stringify(userData).length,
          version: userData.version
        });

        return userData;
      }

      // Try to restore from backup if current data is missing
      const backupData = await this.restoreFromBackup(userId);
      if (backupData) {
        console.log(`🔄 Data restored from backup for user: ${userId}`);
        return backupData;
      }

      console.log(`ℹ️ No data found for user: ${userId}`);
      return null;

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return null;
    }
  }

  /**
   * Save specific data type
   */
  async saveData(user: User | null, key: string, value: any): Promise<SaveResult> {
    try {
      const userId = user?.uid || 'anonymous';
      const userKey = `user_${userId}`;
      const storageKey = `${userKey}_${key}`;

      // Save to localStorage
      localStorage.setItem(storageKey, JSON.stringify(value));
      
      // Update last sync timestamp
      localStorage.setItem(`${userKey}_${this.STORAGE_KEYS.LAST_SYNC}`, Date.now().toString());

      console.log(`✅ ${key} saved successfully for user: ${userId}`);

      return {
        success: true,
        message: `${key} saved successfully`,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error(`❌ Error saving ${key}:`, error);
      return {
        success: false,
        message: `Failed to save ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Load specific data type
   */
  getData(user: User | null, key: string): any {
    try {
      const userId = user?.uid || 'anonymous';
      const userKey = `user_${userId}`;
      const storageKey = `${userKey}_${key}`;

      return this.getLocalStorageItem(storageKey);
    } catch (error) {
      console.error(`❌ Error loading ${key}:`, error);
      return null;
    }
  }

  /**
   * Export user data for backup
   */
  async exportUserData(user: User | null): Promise<string> {
    try {
      const userData = await this.loadUserData(user);
      if (!userData) {
        throw new Error('No user data found to export');
      }

      const exportData = {
        ...userData,
        exportDate: new Date().toISOString(),
        exportVersion: this.VERSION
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `christiankit-backup-${Date.now()}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      console.log('✅ User data exported successfully');
      return 'Data exported successfully';

    } catch (error) {
      console.error('❌ Error exporting user data:', error);
      throw error;
    }
  }

  /**
   * Import user data from backup
   */
  async importUserData(user: User | null, file: File): Promise<SaveResult> {
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      // Validate imported data
      if (!this.validateImportedData(importedData)) {
        throw new Error('Invalid backup file format');
      }

      // Save imported data
      const result = await this.saveUserData(user, importedData);

      if (result.success) {
        console.log('✅ User data imported successfully');
      }

      return result;

    } catch (error) {
      console.error('❌ Error importing user data:', error);
      return {
        success: false,
        message: `Failed to import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Clear all user data
   */
  async clearUserData(user: User | null): Promise<SaveResult> {
    try {
      const userId = user?.uid || 'anonymous';
      const userKey = `user_${userId}`;

      // Remove all user-specific data
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(`${userKey}_${key}`);
      });

      // Remove backup data
      localStorage.removeItem(`${userKey}_backup`);

      console.log(`✅ All data cleared for user: ${userId}`);

      return {
        success: true,
        message: 'All user data cleared successfully',
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('❌ Error clearing user data:', error);
      return {
        success: false,
        message: `Failed to clear data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get data statistics
   */
  getDataStats(user: User | null): { totalSize: number; lastSync: number; dataCount: number } {
    try {
      const userId = user?.uid || 'anonymous';
      const userKey = `user_${userId}`;
      
      let totalSize = 0;
      let dataCount = 0;
      let lastSync = 0;

      Object.values(this.STORAGE_KEYS).forEach(key => {
        const value = localStorage.getItem(`${userKey}_${key}`);
        if (value) {
          totalSize += value.length;
          dataCount++;
          
          if (key === this.STORAGE_KEYS.LAST_SYNC) {
            lastSync = parseInt(value) || 0;
          }
        }
      });

      return {
        totalSize,
        lastSync,
        dataCount
      };

    } catch (error) {
      console.error('❌ Error getting data stats:', error);
      return { totalSize: 0, lastSync: 0, dataCount: 0 };
    }
  }

  // Private helper methods

  private getLocalStorageItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`❌ Error parsing localStorage item ${key}:`, error);
      return null;
    }
  }

  private async createBackup(userId: string, data: UserData): Promise<void> {
    try {
      const backupKey = `user_${userId}_backup`;
      const backup = {
        ...data,
        backupDate: Date.now(),
        backupVersion: this.VERSION
      };

      localStorage.setItem(backupKey, JSON.stringify(backup));
      console.log(`💾 Backup created for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error creating backup for user ${userId}:`, error);
    }
  }

  private async restoreFromBackup(userId: string): Promise<UserData | null> {
    try {
      const backupKey = `user_${userId}_backup`;
      const backup = this.getLocalStorageItem(backupKey);
      
      if (backup && backup.backupDate) {
        // Check if backup is not too old (7 days)
        const backupAge = Date.now() - backup.backupDate;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        if (backupAge < maxAge) {
          return {
            userPlan: backup.userPlan,
            prayerSessions: backup.prayerSessions,
            questionnaireCompleted: backup.questionnaireCompleted,
            preferences: backup.preferences,
            lastSync: backup.lastSync,
            version: backup.version
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error restoring from backup for user ${userId}:`, error);
      return null;
    }
  }

  private validateImportedData(data: any): boolean {
    // Basic validation - check if data has expected structure
    return data && 
           typeof data === 'object' && 
           (data.userPlan !== undefined || 
            data.prayerSessions !== undefined || 
            data.questionnaireCompleted !== undefined);
  }
}

// Export singleton instance
export const dataService = new DataService();
export default dataService;
