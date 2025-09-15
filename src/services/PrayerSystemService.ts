// Prayer System Service - Structured Spiritual Growth Journey
// Inspired by Charles Spurgeon, Jonathan Edwards, CS Lewis, Billy Graham, John MacArthur

interface PrayerLevel {
  id: 'beginner' | 'intermediate' | 'advanced';
  name: string;
  description: string;
  duration: number; // minutes
  theme: string;
  monthlyFocus: string[];
  advancementCriteria: {
    consistencyDays: number;
    completedPrayers: number;
    reflectionEntries: number;
    communityEngagement: number;
  };
}

interface DailyPrayer {
  level: string;
  day: number; // 1-30 (monthly cycle)
  week: number; // 1-4
  theme: string;
  scripture: {
    reference: string;
    text: string;
    inspiration: string; // From great Christian teachers
  };
  prayers: {
    opening: string;
    meditation: string;
    intercession: string;
    confession: string;
    thanksgiving: string;
    closing: string;
  };
  reflection: {
    questions: string[];
    journalPrompt: string;
  };
  nextSteps: string[];
}

interface UserPrayerProfile {
  userId: string;
  currentLevel: string;
  startDate: Date;
  completedDays: number;
  currentStreak: number;
  favoritePrayers: string[];
  personalThemes: string[];
  prayerGoals: string[];
  advancementRequested: boolean;
  advancementReady: boolean;
  communityShared: number;
  reflectionEntries: number;
}

class PrayerSystemService {
  private static instance: PrayerSystemService;

  // Prayer Levels inspired by spiritual growth stages
  private prayerLevels: PrayerLevel[] = [
    {
      id: 'beginner',
      name: 'Beginner',
      description: 'Building Foundations - Learning to pray simply and sincerely',
      duration: 5,
      theme: 'Simple Faith',
      monthlyFocus: [
        'Gratitude & Praise',
        'Confession & Forgiveness',
        'Basic Prayer Patterns',
        'Trust & Dependence'
      ],
      advancementCriteria: {
        consistencyDays: 60, // 60 days of consistent prayer
        completedPrayers: 50,
        reflectionEntries: 30,
        communityEngagement: 5
      }
    },
    {
      id: 'intermediate',
      name: 'Intermediate',
      description: 'Deepening Roots - Growing in prayer depth and understanding',
      duration: 15,
      theme: 'Growing Faith',
      monthlyFocus: [
        'Scripture Meditation',
        'Intercessory Prayer',
        'Spiritual Warfare',
        'Wisdom & Discernment'
      ],
      advancementCriteria: {
        consistencyDays: 90,
        completedPrayers: 75,
        reflectionEntries: 50,
        communityEngagement: 10
      }
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Spiritual Maturity - Contemplative prayer and spiritual leadership',
      duration: 20,
      theme: 'Mature Faith',
      monthlyFocus: [
        'Contemplative Prayer',
        'Spiritual Direction',
        'Community Leadership',
        'Eternal Perspective'
      ],
      advancementCriteria: {
        consistencyDays: 120,
        completedPrayers: 100,
        reflectionEntries: 75,
        communityEngagement: 15
      }
    }
  ];

  static getInstance(): PrayerSystemService {
    if (!PrayerSystemService.instance) {
      PrayerSystemService.instance = new PrayerSystemService();
    }
    return PrayerSystemService.instance;
  }

  // Get user's prayer profile from localStorage
  getUserProfile(userId: string): UserPrayerProfile | undefined {
    const stored = localStorage.getItem(`prayerProfile_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return undefined;
  }

  // Get user's current prayer level
  getUserLevel(userId: string): PrayerLevel | null {
    const userProfile = this.getUserProfile(userId);
    if (!userProfile) return this.prayerLevels[0]; // Default to beginner

    return this.prayerLevels.find(level => level.id === userProfile.currentLevel) || this.prayerLevels[0];
  }

  // Get daily prayer for user
  getDailyPrayer(userId: string, date?: Date): DailyPrayer {
    const userProfile = this.getUserProfile(userId);
    const level = this.getUserLevel(userId);
    const targetDate = date || new Date();

    // Calculate day in monthly cycle (1-30)
    const dayOfMonth = targetDate.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // Get personalized prayer based on user profile
    return this.generatePersonalizedPrayer(level!, dayOfMonth, weekOfMonth, userProfile);
  }

  // Generate personalized prayer based on user's spiritual journey
  private generatePersonalizedPrayer(level: PrayerLevel, day: number, week: number, profile?: UserPrayerProfile): DailyPrayer {
    const monthThemes = level.monthlyFocus;
    const currentTheme = monthThemes[(day - 1) % monthThemes.length];

    // Get scripture and inspiration based on level and theme
    const { scripture, prayers, reflection } = this.getLevelSpecificContent(level.id, currentTheme, day, profile);

    return {
      level: level.id,
      day,
      week,
      theme: currentTheme,
      scripture,
      prayers,
      reflection,
      nextSteps: this.generateNextSteps(level.id, currentTheme, profile)
    };
  }

  // Get content specific to prayer level and theme
  private getLevelSpecificContent(levelId: string, theme: string, day: number, profile?: UserPrayerProfile) {
    switch (levelId) {
      case 'beginner':
        return this.getBeginnerContent(theme, day, profile);
      case 'intermediate':
        return this.getIntermediateContent(theme, day, profile);
      case 'advanced':
        return this.getAdvancedContent(theme, day, profile);
      default:
        return this.getBeginnerContent(theme, day, profile);
    }
  }

  // Beginner Level Content - Simple, encouraging prayers
  private getBeginnerContent(theme: string, day: number, profile?: UserPrayerProfile) {
    const contentMap: { [key: string]: any } = {
      'Gratitude & Praise': {
        scripture: {
          reference: 'Psalm 100:4-5',
          text: 'Enter his gates with thanksgiving and his courts with praise; give thanks to him and praise his name. For the LORD is good and his love endures forever; his faithfulness continues through all generations.',
          inspiration: 'Charles Spurgeon: "Praise is the rehearsal of our eternal song."'
        },
        prayers: {
          opening: 'Heavenly Father, I come to You with a grateful heart...',
          meditation: 'Thank You for Your goodness and mercy that never fail...',
          intercession: 'Please bless my family, friends, and those in need...',
          confession: 'Forgive me for the times I\'ve taken Your blessings for granted...',
          thanksgiving: 'I praise You for Your unfailing love and faithfulness...',
          closing: 'In Jesus\' name, Amen.'
        },
        reflection: {
          questions: [
            'What are three things I\'m grateful for today?',
            'How have I experienced God\'s goodness this week?',
            'What praise can I offer for His faithfulness?'
          ],
          journalPrompt: 'Write a thank-you note to God for His specific blessings in your life.'
        }
      },
      'Confession & Forgiveness': {
        scripture: {
          reference: '1 John 1:9',
          text: 'If we confess our sins, he is faithful and just and will forgive us our sins and purify us from all unrighteousness.',
          inspiration: 'Jonathan Edwards: "The pleasures of the world are deceitful; they promise more than they give."'
        },
        prayers: {
          opening: 'Lord Jesus, I come to You as Your child, ready to confess...',
          meditation: 'Search my heart and show me any hidden sin...',
          intercession: 'Help me to forgive others as You have forgiven me...',
          confession: 'I confess my pride, anger, and selfishness...',
          thanksgiving: 'Thank You for Your mercy and grace that cleanse me...',
          closing: 'Create in me a clean heart, O God. Amen.'
        },
        reflection: {
          questions: [
            'What attitudes or actions need confession today?',
            'Who do I need to forgive or seek forgiveness from?',
            'How can I show God\'s forgiveness to others?'
          ],
          journalPrompt: 'Reflect on a time when you experienced God\'s forgiveness deeply.'
        }
      }
    };

    return contentMap[theme] || contentMap['Gratitude & Praise'];
  }

  // Intermediate Level Content - Deeper spiritual insights
  private getIntermediateContent(theme: string, day: number, profile?: UserPrayerProfile) {
    const contentMap: { [key: string]: any } = {
      'Scripture Meditation': {
        scripture: {
          reference: 'Joshua 1:8',
          text: 'Keep this Book of the Law always on your lips; meditate on it day and night, so that you may be careful to do everything written in it. Then you will be prosperous and successful.',
          inspiration: 'John MacArthur: "Scripture is not merely to be read, but to be received into the soul."'
        },
        prayers: {
          opening: 'Lord, open my eyes to see wonderful things in Your Word...',
          meditation: 'Help me to meditate on Your Word day and night...',
          intercession: 'Pray for wisdom to understand and apply Your truth...',
          confession: 'Forgive me for neglecting Your Word...',
          thanksgiving: 'Thank You for the living, active Word that transforms lives...',
          closing: 'May Your Word dwell richly in me. Amen.'
        },
        reflection: {
          questions: [
            'What verse spoke to me today and why?',
            'How can I apply this truth to my life?',
            'What is the Holy Spirit revealing to me through this passage?'
          ],
          journalPrompt: 'Meditate on one verse for 10 minutes and write your insights.'
        }
      },
      'Intercessory Prayer': {
        scripture: {
          reference: '1 Timothy 2:1-2',
          text: 'I urge, then, first of all, that petitions, prayers, intercession and thanksgiving be made for all people—for kings and all those in authority, that we may live peaceful and quiet lives in all godliness and holiness.',
          inspiration: 'Billy Graham: "The greatest legacy one can pass on is a prayer life."'
        },
        prayers: {
          opening: 'Father, You are the God who hears and answers prayer...',
          meditation: 'Teach me to pray with faith and persistence...',
          intercession: 'Pray for world leaders, missionaries, and the lost...',
          confession: 'Forgive me for praying selfishly instead of kingdom-minded...',
          thanksgiving: 'Thank You for hearing every prayer offered in faith...',
          closing: 'May Your kingdom come and Your will be done. Amen.'
        },
        reflection: {
          questions: [
            'Who in my life needs prayer today?',
            'How can I pray more effectively for others?',
            'What global issues should burden my heart?'
          ],
          journalPrompt: 'Create a prayer list of 5-10 people or causes to pray for daily.'
        }
      }
    };

    return contentMap[theme] || contentMap['Scripture Meditation'];
  }

  // Advanced Level Content - Contemplative and leadership-focused
  private getAdvancedContent(theme: string, day: number, profile?: UserPrayerProfile) {
    const contentMap: { [key: string]: any } = {
      'Contemplative Prayer': {
        scripture: {
          reference: 'Psalm 46:10',
          text: 'Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.',
          inspiration: 'CS Lewis: "We may ignore, but we can nowhere evade, the presence of God."'
        },
        prayers: {
          opening: 'Holy Spirit, lead me into Your presence...',
          meditation: 'Help me to be still and know You are God...',
          intercession: 'Pray without words, in the Spirit\'s groaning...',
          confession: 'Reveal the deep places of my soul that need Your healing...',
          thanksgiving: 'Thank You for the mystery of Your presence...',
          closing: 'In the silence, I find You. Amen.'
        },
        reflection: {
          questions: [
            'What is the Holy Spirit saying to me in the silence?',
            'How is God inviting me to deeper intimacy?',
            'What contemplative practice resonates with my soul?'
          ],
          journalPrompt: 'Spend 5 minutes in silence, then write about God\'s presence.'
        }
      },
      'Spiritual Direction': {
        scripture: {
          reference: 'Proverbs 3:5-6',
          text: 'Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.',
          inspiration: 'Charles Spurgeon: "The nearer we live to God, the more graciously we can live with others."'
        },
        prayers: {
          opening: 'Lord, You are my Shepherd and Guide...',
          meditation: 'Show me Your path and Your perfect will...',
          intercession: 'Pray for wisdom in life decisions and leadership...',
          confession: 'Forgive me for relying on my own understanding...',
          thanksgiving: 'Thank You for Your perfect guidance and direction...',
          closing: 'Lead me in Your truth and teach me. Amen.'
        },
        reflection: {
          questions: [
            'What decision am I facing that needs God\'s direction?',
            'How is God speaking to me about my calling?',
            'What spiritual disciplines should I prioritize?'
          ],
          journalPrompt: 'Write about a time when God clearly directed your path.'
        }
      }
    };

    return contentMap[theme] || contentMap['Contemplative Prayer'];
  }

  // Generate personalized next steps based on user progress
  private generateNextSteps(levelId: string, theme: string, profile?: UserPrayerProfile): string[] {
    const baseSteps = [
      'Spend 2 minutes in silent reflection',
      'Read the suggested scripture passage',
      'Share this prayer with someone in your community'
    ];

    if (profile?.prayerGoals?.length) {
      baseSteps.push(`Focus on your goal: ${profile.prayerGoals[0]}`);
    }

    return baseSteps;
  }


  // Save user prayer progress
  savePrayerProgress(userId: string, progress: Partial<UserPrayerProfile>): void {
    const existing = this.getUserProfile(userId) || {
      userId,
      currentLevel: 'beginner',
      startDate: new Date(),
      completedDays: 0,
      currentStreak: 0,
      favoritePrayers: [],
      personalThemes: [],
      prayerGoals: [],
      advancementRequested: false,
      advancementReady: false,
      communityShared: 0,
      reflectionEntries: 0
    };

    const updated = { ...existing, ...progress };
    localStorage.setItem(`prayerProfile_${userId}`, JSON.stringify(updated));
  }

  // Request advancement to next level
  requestAdvancement(userId: string): { success: boolean; message: string } {
    const profile = this.getUserProfile(userId);
    const currentLevel = this.getUserLevel(userId);

    if (!profile || !currentLevel) {
      return { success: false, message: 'Profile not found' };
    }

    const criteria = currentLevel.advancementCriteria;

    // Check if user meets criteria
    const meetsCriteria =
      profile.completedDays >= criteria.consistencyDays &&
      profile.communityShared >= criteria.communityEngagement &&
      profile.reflectionEntries >= criteria.reflectionEntries;

    if (meetsCriteria) {
      this.savePrayerProgress(userId, {
        advancementRequested: true,
        advancementReady: true
      });

      return {
        success: true,
        message: `Advancement request submitted! You'll be notified when ready to advance to ${this.getNextLevel(currentLevel.id)} level.`
      };
    } else {
      const missing = [];
      if (profile.completedDays < criteria.consistencyDays) {
        missing.push(`${criteria.consistencyDays - profile.completedDays} more prayer days`);
      }
      if (profile.communityShared < criteria.communityEngagement) {
        missing.push(`${criteria.communityEngagement - profile.communityShared} more community shares`);
      }
      if (profile.reflectionEntries < criteria.reflectionEntries) {
        missing.push(`${criteria.reflectionEntries - profile.reflectionEntries} more reflections`);
      }

      return {
        success: false,
        message: `Almost there! You need: ${missing.join(', ')} to advance.`
      };
    }
  }

  private getNextLevel(currentLevel: string): string {
    const levels = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = levels.indexOf(currentLevel);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }

  // Get community prayer suggestions
  getCommunityPrayers(theme: string): string[] {
    const communityPrayers: { [key: string]: string[] } = {
      'gratitude': [
        'Thank You for the gift of community and fellowship...',
        'Praise God for the body of believers worldwide...',
        'Grateful for the spiritual family You\'ve given me...'
      ],
      'healing': [
        'Pray for those suffering from illness and pain...',
        'Ask God for healing in body, mind, and spirit...',
        'Intercede for medical professionals and caregivers...'
      ],
      'guidance': [
        'Seek God\'s wisdom for life decisions...',
        'Pray for clear direction in uncertain times...',
        'Ask for discernment in relationships and opportunities...'
      ]
    };

    return communityPrayers[theme.toLowerCase()] || communityPrayers['gratitude'];
  }

  // Generate personalized prayer for external use based on user's spiritual background
  generatePersonalizedPrayerForUser(userId: string, preferences: any): DailyPrayer {
    const profile = this.getUserProfile(userId);
    const level = this.getUserLevel(userId);

    // Incorporate user preferences
    const personalized = this.getDailyPrayer(userId);

    // Add personal touches based on user's journey
    if (profile?.personalThemes?.length) {
      personalized.theme = profile.personalThemes[0];
    }

    return personalized;
  }

  // Get prayer notification schedule for the user
  getPrayerNotificationSchedule(userId: string): {
    preferredTime: string;
    reminders: string[];
    motivationalMessages: string[];
  } {
    const profile = this.getUserProfile(userId);
    const level = this.getUserLevel(userId);

    // Default prayer times based on level
    const defaultTimes = {
      beginner: '8:00 AM',
      intermediate: '7:30 AM',
      advanced: '6:30 AM'
    };

    const preferredTime = profile?.prayerGoals?.[0] || defaultTimes[level?.id as keyof typeof defaultTimes] || '8:00 AM';

    const reminders = [
      `🙏 Time for your daily prayer! Your ${level?.name} prayer journey awaits.`,
      `📖 Scripture and prayer ready for today. Let's grow in faith together!`,
      `🌅 Start your day with God's presence. Your prayer time is calling.`,
      `💭 Take a moment to connect with God. Your spiritual growth matters.`,
      `✨ Your daily prayer is ready. Let's deepen our relationship with God.`
    ];

    const motivationalMessages = [
      `"Prayer is the key to heaven, but faith unlocks the door." - Being a Christian`,
      `"The prayer of a righteous person is powerful and effective." - James 5:16`,
      `"When we pray, we speak to God; when we read His Word, He speaks to us." - A.W. Tozer`,
      `"Prayer is not asking. It is a longing of the soul." - Mahatma Gandhi`,
      `"The more you pray, the more you realize how much God loves you." - Unknown`
    ];

    return {
      preferredTime,
      reminders,
      motivationalMessages
    };
  }

  // Check if user should receive prayer reminder today
  shouldSendPrayerReminder(userId: string): boolean {
    const profile = this.getUserProfile(userId);
    if (!profile) return false;

    // Don't send reminder if user prayed today
    const today = new Date().toDateString();
    const lastPrayerDate = profile.completedDays > 0 ? new Date() : null; // This is simplified

    // Send reminder if:
    // 1. User hasn't prayed today
    // 2. User has an active streak or wants to maintain consistency
    // 3. It's within their preferred prayer window

    return profile.currentStreak > 0 || profile.completedDays > 0;
  }
}

export const prayerSystemService = PrayerSystemService.getInstance();
export type { PrayerLevel, DailyPrayer, UserPrayerProfile };
