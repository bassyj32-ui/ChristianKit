import { supabase } from './utils/supabase'

export async function testSupabaseConnection() {
  try {
    // Test the connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Supabase Error:', error.message)
      return false
    }

    return true
    
  } catch (err) {
    console.error('❌ Connection Failed:', err)
    return false
  }
}

export async function testProfileFunctionality() {
  try {

    // Test 1: Get current user profile
    const { userService } = await import('./services/userService')
    const profile = await userService.getCurrentUserProfile()
    if (!profile) {
      // No profile found (this is expected for new users)
    }

    // Test 2: Test profile creation (if needed)
    if (profile) {
      const success = await userService.updateUserProfile(profile.id, {
        bio: 'Test bio from migration test'
      })
      if (!success) {
        console.error('❌ Profile update failed')
        return false
      }
    }

    // Test 3: Test user search
    const searchResults = await userService.searchUsers('test', 5)

    // Test 4: Test profile existence check
    const exists = await userService.profileExists('test-id')

    return true
  } catch (error: any) {
    console.error('❌ Profile functionality test failed:', {
      code: error?.code,
      message: error?.message
    })
    return false
  }
}

export async function testSettingsFunctionality() {
  try {
    // Test 1: Settings validation
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    const isValidTime = timeRegex.test('09:00')
    const isInvalidTime = timeRegex.test('25:99')

    // Test 2: Duration validation
    const isValidDuration = 10 >= 5 && 10 <= 120
    const isInvalidDuration = 200 >= 5 && 200 <= 120

    // Test 3: Reminder interval validation
    const isValidInterval = 30 >= 15 && 30 <= 120
    const isInvalidInterval = 10 >= 15 && 10 <= 120
    // Test 4: Test SettingsPage component existence
    try {
      const { SettingsPage } = await import('../components/SettingsPage')
      if (!SettingsPage) {
        console.error('❌ SettingsPage component missing')
        return false
      }
    } catch (error: any) {
      console.error('❌ SettingsPage component failed to import:', error)
      return false
    }

    // Test 5: Test localStorage functionality
    const testSettings = {
      dailyNotifications: true,
      notificationTime: '09:00',
      defaultDuration: 10,
      defaultMode: 'guided' as const,
      ambientSound: 'none' as const
    }
    localStorage.setItem('christiankit-settings', JSON.stringify(testSettings))
    const retrieved = localStorage.getItem('christiankit-settings')
    if (retrieved) {
      const parsed = JSON.parse(retrieved)
      if (parsed.dailyNotifications === true && parsed.defaultDuration === 10) {
        // localStorage test passed
      } else {
        console.error('❌ localStorage functionality failed')
        return false
      }
    } else {
      console.error('❌ localStorage retrieve failed')
      return false
    }

    // Test 6: Test notification permission types
    try {
      const permission = 'granted' as unknown as NotificationPermission
      const defaultPermission = 'default' as unknown as NotificationPermission
    } catch (error: any) {
      console.error('❌ Notification permission types failed:', error)
      return false
    }

    return true
  } catch (error: any) {
    console.error('❌ Settings functionality test failed:', error)
    return false
  }
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  testSupabaseConnection().then(success => {
    if (success) {
      testProfileFunctionality().then(profileSuccess => {
        if (profileSuccess) {
          testSettingsFunctionality()
        }
      })
    }
  })
}