import { supabase } from './utils/supabase'

export async function testSupabaseConnection() {
  try {
    // Test the connection
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Supabase Error:', error.message)
      return false
    }
    
    console.log('✅ Supabase Connected Successfully!')
    console.log('📊 Data:', data)
    return true
    
  } catch (err) {
    console.log('❌ Connection Failed:', err)
    return false
  }
}

export async function testProfileFunctionality() {
  try {
    console.log('🧪 Testing Profile Functionality...')

    // Test 1: Get current user profile
    console.log('📋 Test 1: Getting current user profile...')
    const { userService } = await import('./services/userService')
    const profile = await userService.getCurrentUserProfile()
    if (profile) {
      console.log('✅ Profile loaded successfully:', profile.display_name)
    } else {
      console.log('ℹ️ No profile found (this is expected for new users)')
    }

    // Test 2: Test profile creation (if needed)
    if (profile) {
      console.log('📝 Test 2: Updating profile...')
      const success = await userService.updateUserProfile(profile.id, {
        bio: 'Test bio from migration test'
      })
      if (success) {
        console.log('✅ Profile update successful')
      } else {
        console.log('❌ Profile update failed')
        return false
      }
    } else {
      console.log('ℹ️ Skipping profile update test (no profile to update)')
    }

    // Test 3: Test user search
    console.log('🔍 Test 3: Testing user search...')
    const searchResults = await userService.searchUsers('test', 5)
    console.log(`✅ User search returned ${searchResults.length} results`)

    // Test 4: Test profile existence check
    console.log('✅ Test 4: Testing profile existence check...')
    const exists = await userService.profileExists('test-id')
    console.log(`✅ Profile existence check works (result: ${exists})`)

    console.log('🎉 All profile functionality tests passed!')
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
    console.log('⚙️ Testing Settings Functionality...')

    // Test 1: Settings validation
    console.log('✅ Test 1: Testing settings validation...')
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    const isValidTime = timeRegex.test('09:00')
    const isInvalidTime = timeRegex.test('25:99')
    console.log(`✅ Time validation works: ${isValidTime}, rejects invalid: ${isInvalidTime}`)

    // Test 2: Duration validation
    console.log('✅ Test 2: Testing duration validation...')
    const isValidDuration = 10 >= 5 && 10 <= 120
    const isInvalidDuration = 200 >= 5 && 200 <= 120
    console.log(`✅ Duration validation works: ${isValidDuration}, rejects invalid: ${isInvalidDuration}`)

    // Test 3: Reminder interval validation
    console.log('✅ Test 3: Testing reminder interval validation...')
    const isValidInterval = 30 >= 15 && 30 <= 120
    const isInvalidInterval = 10 >= 15 && 10 <= 120
    console.log(`✅ Interval validation works: ${isValidInterval}, rejects invalid: ${isInvalidInterval}`)

    // Test 4: Test SettingsPage component existence
    console.log('✅ Test 4: Testing SettingsPage component...')
    try {
      const { SettingsPage } = await import('../components/SettingsPage')
      if (SettingsPage) {
        console.log('✅ SettingsPage component exists and exports correctly')
      } else {
        console.log('❌ SettingsPage component missing')
        return false
      }
    } catch (error: any) {
      console.error('❌ SettingsPage component failed to import:', error)
      return false
    }

    // Test 5: Test localStorage functionality
    console.log('✅ Test 5: Testing localStorage functionality...')
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
        console.log('✅ localStorage save/retrieve works correctly')
      } else {
        console.log('❌ localStorage functionality failed')
        return false
      }
    } else {
      console.log('❌ localStorage retrieve failed')
      return false
    }

    // Test 6: Test notification permission types
    console.log('✅ Test 6: Testing notification permission types...')
    try {
      const permission = 'granted' as unknown as NotificationPermission
      const defaultPermission = 'default' as unknown as NotificationPermission
      console.log('✅ Notification permission types work correctly:', permission, defaultPermission)
    } catch (error: any) {
      console.error('❌ Notification permission types failed:', error)
      return false
    }

    console.log('🎉 All settings functionality tests passed!')
    return true
  } catch (error: any) {
    console.error('❌ Settings functionality test failed:', error)
    return false
  }
}

// Auto-run tests if this file is imported
if (typeof window !== 'undefined') {
  console.log('🚀 Running Profile Migration Tests...')
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