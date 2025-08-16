interface ExportData {
  userPlan: any
  prayerSessions: any[]
  bibleReadings: any[]
  journalEntries: any[]
  communityPosts: any[]
  settings: any
  exportDate: string
  version: string
}

class DataExportService {
  private readonly VERSION = '1.0.0'

  // Export all user data
  async exportAllData(): Promise<void> {
    try {
      const exportData: ExportData = {
        userPlan: this.getLocalStorageItem('userPlan'),
        prayerSessions: this.getLocalStorageItem('prayerSessions') || [],
        bibleReadings: this.getLocalStorageItem('bibleReadings') || [],
        journalEntries: this.getLocalStorageItem('journalEntries') || [],
        communityPosts: this.getLocalStorageItem('communityPosts') || [],
        settings: this.getLocalStorageItem('userSettings') || {},
        exportDate: new Date().toISOString(),
        version: this.VERSION
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const link = document.createElement('a')
      link.href = URL.createObjectURL(dataBlob)
      link.download = `christiankit-backup-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      
      URL.revokeObjectURL(link.href)
    } catch (error) {
      console.error('Error exporting data:', error)
      throw new Error('Failed to export data')
    }
  }

  // Import data from backup file
  async importData(file: File): Promise<void> {
    try {
      const text = await file.text()
      const importData: ExportData = JSON.parse(text)
      
      // Validate version compatibility
      if (importData.version !== this.VERSION) {
        console.warn('Importing data from different version:', importData.version)
      }
      
      // Import data to localStorage
      if (importData.userPlan) {
        localStorage.setItem('userPlan', JSON.stringify(importData.userPlan))
      }
      if (importData.prayerSessions) {
        localStorage.setItem('prayerSessions', JSON.stringify(importData.prayerSessions))
      }
      if (importData.bibleReadings) {
        localStorage.setItem('bibleReadings', JSON.stringify(importData.bibleReadings))
      }
      if (importData.journalEntries) {
        localStorage.setItem('journalEntries', JSON.stringify(importData.journalEntries))
      }
      if (importData.communityPosts) {
        localStorage.setItem('communityPosts', JSON.stringify(importData.communityPosts))
      }
      if (importData.settings) {
        localStorage.setItem('userSettings', JSON.stringify(importData.settings))
      }
      
      // Reload page to apply imported data
      window.location.reload()
    } catch (error) {
      console.error('Error importing data:', error)
      throw new Error('Failed to import data. Please check the file format.')
    }
  }

  // Export specific data types
  async exportPrayerData(): Promise<void> {
    const prayerData = {
      sessions: this.getLocalStorageItem('prayerSessions') || [],
      exportDate: new Date().toISOString(),
      type: 'prayer-data'
    }
    
    this.downloadData(prayerData, 'christiankit-prayer-data.json')
  }

  async exportBibleData(): Promise<void> {
    const bibleData = {
      readings: this.getLocalStorageItem('bibleReadings') || [],
      plans: this.getLocalStorageItem('bibleReadingPlans') || [],
      exportDate: new Date().toISOString(),
      type: 'bible-data'
    }
    
    this.downloadData(bibleData, 'christiankit-bible-data.json')
  }

  async exportJournalData(): Promise<void> {
    const journalData = {
      entries: this.getLocalStorageItem('journalEntries') || [],
      exportDate: new Date().toISOString(),
      type: 'journal-data'
    }
    
    this.downloadData(journalData, 'christiankit-journal-data.json')
  }

  // Get data summary for user
  getDataSummary(): { totalEntries: number; lastBackup: string | null; dataSize: string } {
    const prayerSessions = this.getLocalStorageItem('prayerSessions') || []
    const bibleReadings = this.getLocalStorageItem('bibleReadings') || []
    const journalEntries = this.getLocalStorageItem('journalEntries') || []
    const communityPosts = this.getLocalStorageItem('communityPosts') || []
    
    const totalEntries = prayerSessions.length + bibleReadings.length + journalEntries.length + communityPosts.length
    
    const lastBackup = localStorage.getItem('lastBackupDate')
    
    // Calculate approximate data size
    const dataSize = this.calculateDataSize()
    
    return { totalEntries, lastBackup, dataSize }
  }

  // Clear all data (for reset purposes)
  async clearAllData(): Promise<void> {
    try {
      const keysToRemove = [
        'userPlan',
        'prayerSessions',
        'bibleReadings',
        'journalEntries',
        'communityPosts',
        'userSettings',
        'hasCompletedQuestionnaire'
      ]
      
      keysToRemove.forEach(key => localStorage.removeItem(key))
      
      // Reload page after clearing
      window.location.reload()
    } catch (error) {
      console.error('Error clearing data:', error)
      throw new Error('Failed to clear data')
    }
  }

  // Private helper methods
  private getLocalStorageItem(key: string): any {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  }

  private downloadData(data: any, filename: string): void {
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = filename
    link.click()
    
    URL.revokeObjectURL(link.href)
  }

  private calculateDataSize(): string {
    try {
      const totalSize = Object.keys(localStorage).reduce((size, key) => {
        return size + (localStorage[key]?.length || 0)
      }, 0)
      
      if (totalSize < 1024) return `${totalSize} B`
      if (totalSize < 1024 * 1024) return `${(totalSize / 1024).toFixed(1)} KB`
      return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
    } catch {
      return 'Unknown'
    }
  }

  // Update last backup date
  updateLastBackupDate(): void {
    localStorage.setItem('lastBackupDate', new Date().toISOString())
  }
}

export const dataExportService = new DataExportService()
