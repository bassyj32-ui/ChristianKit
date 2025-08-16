import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { User } from 'firebase/auth'

interface CloudData {
  userId: string
  lastUpdated: any
  version: string
}

interface PrayerSession extends CloudData {
  id: string
  startTime: string
  endTime: string
  duration: number
  type: 'prayer' | 'meditation' | 'bible'
  notes?: string
  completed: boolean
}

interface BibleReading extends CloudData {
  id: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  timeSpent: number
  notes: string
  memorized: boolean
  reflection: string
  tags: string[]
  date: string
}

interface ReadingPlan extends CloudData {
  id: string
  name: string
  description: string
  books: string[]
  totalChapters: number
  completedChapters: number
  startDate: string
  targetDate: string
  dailyGoal: number
}

interface CommunityPost extends CloudData {
  id: string
  content: string
  hashtags: string[]
  likes: string[]
  comments: Array<{
    id: string
    content: string
    authorId: string
    authorName: string
    timestamp: any
  }>
  timestamp: any
}

interface UserPlan extends CloudData {
  id: string
  name: string
  description: string
  goals: string[]
  preferences: {
    prayerTime: string
    bibleTime: string
    meditationTime: string
    theme: string
  }
}

interface UserSettings extends CloudData {
  id: string
  theme: string
  notifications: {
    prayer: boolean
    bible: boolean
    community: boolean
    daily: boolean
  }
  privacy: {
    shareProgress: boolean
    publicProfile: boolean
    showStats: boolean
  }
}

class CloudDataService {
  private readonly VERSION = '1.0.0'
  private listeners: { [key: string]: () => void } = {}

  // Generic function to get user document reference
  private getUserDoc(user: User, collectionName: string, docId?: string) {
    if (docId) {
      return doc(db, 'users', user.uid, collectionName, docId)
    }
    return doc(db, 'users', user.uid, collectionName, 'data')
  }

  // Generic function to get user collection reference
  private getUserCollection(user: User, collectionName: string) {
    return collection(db, 'users', user.uid, collectionName)
  }

  // Initialize user data structure
  async initializeUser(user: User): Promise<void> {
    try {
      const userDoc = doc(db, 'users', user.uid)
      const userData = {
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        version: this.VERSION
      }
      
      await setDoc(userDoc, userData, { merge: true })
      console.log('User initialized in cloud')
    } catch (error) {
      console.error('Error initializing user:', error)
      throw error
    }
  }

  // Prayer Sessions
  async savePrayerSession(user: User, session: Omit<PrayerSession, 'userId' | 'lastUpdated' | 'version'>): Promise<string> {
    try {
      const sessionData: PrayerSession = {
        ...session,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      const docRef = await addDoc(this.getUserCollection(user, 'prayerSessions'), sessionData)
      return docRef.id
    } catch (error) {
      console.error('Error saving prayer session:', error)
      throw error
    }
  }

  async getPrayerSessions(user: User): Promise<PrayerSession[]> {
    try {
      const q = query(
        this.getUserCollection(user, 'prayerSessions'),
        orderBy('timestamp', 'desc')
      )
      
      const snapshot = await getDoc(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrayerSession))
    } catch (error) {
      console.error('Error getting prayer sessions:', error)
      return []
    }
  }

  // Bible Readings
  async saveBibleReading(user: User, reading: Omit<BibleReading, 'userId' | 'lastUpdated' | 'version'>): Promise<string> {
    try {
      const readingData: BibleReading = {
        ...reading,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      const docRef = await addDoc(this.getUserCollection(user, 'bibleReadings'), readingData)
      return docRef.id
    } catch (error) {
      console.error('Error saving bible reading:', error)
      throw error
    }
  }

  async getBibleReadings(user: User): Promise<BibleReading[]> {
    try {
      const q = query(
        this.getUserCollection(user, 'bibleReadings'),
        orderBy('date', 'desc')
      )
      
      const snapshot = await getDoc(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleReading))
    } catch (error) {
      console.error('Error getting bible readings:', error)
      return []
    }
  }

  // Reading Plans
  async saveReadingPlan(user: User, plan: Omit<ReadingPlan, 'userId' | 'lastUpdated' | 'version'>): Promise<string> {
    try {
      const planData: ReadingPlan = {
        ...plan,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      const docRef = await addDoc(this.getUserCollection(user, 'readingPlans'), planData)
      return docRef.id
    } catch (error) {
      console.error('Error saving reading plan:', error)
      throw error
    }
  }

  async getReadingPlans(user: User): Promise<ReadingPlan[]> {
    try {
      const q = query(
        this.getUserCollection(user, 'readingPlans'),
        orderBy('startDate', 'desc')
      )
      
      const snapshot = await getDoc(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReadingPlan))
    } catch (error) {
      console.error('Error getting reading plans:', error)
      return []
    }
  }

  // Community Posts
  async saveCommunityPost(user: User, post: Omit<CommunityPost, 'userId' | 'lastUpdated' | 'version'>): Promise<string> {
    try {
      const postData: CommunityPost = {
        ...post,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      const docRef = await addDoc(collection(db, 'communityPosts'), postData)
      return docRef.id
    } catch (error) {
      console.error('Error saving community post:', error)
      throw error
    }
  }

  async getCommunityPosts(): Promise<CommunityPost[]> {
    try {
      const q = query(
        collection(db, 'communityPosts'),
        orderBy('timestamp', 'desc')
      )
      
      const snapshot = await getDoc(q)
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost))
    } catch (error) {
      console.error('Error getting community posts:', error)
      return []
    }
  }

  // User Plan
  async saveUserPlan(user: User, plan: Omit<UserPlan, 'userId' | 'lastUpdated' | 'version'>): Promise<void> {
    try {
      const planData: UserPlan = {
        ...plan,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      await setDoc(this.getUserDoc(user, 'userPlan'), planData)
    } catch (error) {
      console.error('Error saving user plan:', error)
      throw error
    }
  }

  async getUserPlan(user: User): Promise<UserPlan | null> {
    try {
      const docSnap = await getDoc(this.getUserDoc(user, 'userPlan'))
      if (docSnap.exists()) {
        return docSnap.data() as UserPlan
      }
      return null
    } catch (error) {
      console.error('Error getting user plan:', error)
      return null
    }
  }

  // User Settings
  async saveUserSettings(user: User, settings: Omit<UserSettings, 'userId' | 'lastUpdated' | 'version'>): Promise<void> {
    try {
      const settingsData: UserSettings = {
        ...settings,
        userId: user.uid,
        lastUpdated: serverTimestamp(),
        version: this.VERSION
      }
      
      await setDoc(this.getUserDoc(user, 'userSettings'), settingsData)
    } catch (error) {
      console.error('Error saving user settings:', error)
      throw error
    }
  }

  async getUserSettings(user: User): Promise<UserSettings | null> {
    try {
      const docSnap = await getDoc(this.getUserDoc(user, 'userSettings'))
      if (docSnap.exists()) {
        return docSnap.data() as UserSettings
      }
      return null
    } catch (error) {
      console.error('Error getting user settings:', error)
      return null
    }
  }

  // Real-time listeners
  subscribeToPrayerSessions(user: User, callback: (sessions: PrayerSession[]) => void): () => void {
    const q = query(
      this.getUserCollection(user, 'prayerSessions'),
      orderBy('timestamp', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PrayerSession))
      callback(sessions)
    })
    
    this.listeners[`prayerSessions_${user.uid}`] = unsubscribe
    return unsubscribe
  }

  subscribeToBibleReadings(user: User, callback: (readings: BibleReading[]) => void): () => void {
    const q = query(
      this.getUserCollection(user, 'bibleReadings'),
      orderBy('date', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BibleReading))
      callback(readings)
    })
    
    this.listeners[`bibleReadings_${user.uid}`] = unsubscribe
    return unsubscribe
  }

  subscribeToCommunityPosts(callback: (posts: CommunityPost[]) => void): () => void {
    const q = query(
      collection(db, 'communityPosts'),
      orderBy('timestamp', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityPost))
      callback(posts)
    })
    
    this.listeners['communityPosts'] = unsubscribe
    return unsubscribe
  }

  // Sync local data to cloud
  async syncLocalDataToCloud(user: User): Promise<void> {
    try {
      // Get local data
      const localPrayerSessions = JSON.parse(localStorage.getItem('prayerSessions') || '[]')
      const localBibleReadings = JSON.parse(localStorage.getItem('bibleReadings') || '[]')
      const localUserPlan = JSON.parse(localStorage.getItem('userPlan') || 'null')
      
      // Sync prayer sessions
      for (const session of localPrayerSessions) {
        if (!session.cloudSynced) {
          await this.savePrayerSession(user, session)
          session.cloudSynced = true
        }
      }
      
      // Sync bible readings
      for (const reading of localBibleReadings) {
        if (!reading.cloudSynced) {
          await this.saveBibleReading(user, reading)
          reading.cloudSynced = true
        }
      }
      
      // Sync user plan
      if (localUserPlan && !localUserPlan.cloudSynced) {
        await this.saveUserPlan(user, localUserPlan)
        localUserPlan.cloudSynced = true
      }
      
      // Update local storage with sync status
      localStorage.setItem('prayerSessions', JSON.stringify(localPrayerSessions))
      localStorage.setItem('bibleReadings', JSON.stringify(localBibleReadings))
      if (localUserPlan) {
        localStorage.setItem('userPlan', JSON.stringify(localUserPlan))
      }
      
      console.log('Local data synced to cloud successfully')
    } catch (error) {
      console.error('Error syncing local data to cloud:', error)
      throw error
    }
  }

  // Sync cloud data to local
  async syncCloudDataToLocal(user: User): Promise<void> {
    try {
      // Get cloud data
      const cloudPrayerSessions = await this.getPrayerSessions(user)
      const cloudBibleReadings = await this.getBibleReadings(user)
      const cloudUserPlan = await this.getUserPlan(user)
      
      // Update local storage
      localStorage.setItem('prayerSessions', JSON.stringify(cloudPrayerSessions))
      localStorage.setItem('bibleReadings', JSON.stringify(cloudBibleReadings))
      if (cloudUserPlan) {
        localStorage.setItem('userPlan', JSON.stringify(cloudUserPlan))
      }
      
      console.log('Cloud data synced to local successfully')
    } catch (error) {
      console.error('Error syncing cloud data to local:', error)
      throw error
    }
  }

  // Cleanup listeners
  unsubscribeAll(): void {
    Object.values(this.listeners).forEach(unsubscribe => unsubscribe())
    this.listeners = {}
  }

  // Get sync status
  getSyncStatus(user: User): Promise<{ lastSync: Date | null; dataCount: number }> {
    return new Promise(async (resolve) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          resolve({
            lastSync: data.lastLogin?.toDate() || null,
            dataCount: Object.keys(data).length
          })
        } else {
          resolve({ lastSync: null, dataCount: 0 })
        }
      } catch (error) {
        console.error('Error getting sync status:', error)
        resolve({ lastSync: null, dataCount: 0 })
      }
    })
  }
}

export const cloudDataService = new CloudDataService()
