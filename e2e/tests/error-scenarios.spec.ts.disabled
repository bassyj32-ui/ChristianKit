import { test, expect } from '@playwright/test';
import { setupTestDatabase, cleanupTestData, createTestUser } from '../utils/test-database';

test.describe('Error Scenario Testing', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestDatabase();

    // Mock authentication
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-id',
            email: 'test@example.com'
          }
        })
      });
    });

    await page.goto('/');
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('handles network failures gracefully', async ({ page }) => {
    // Test 1: Supabase connection failure
    await test.step('Supabase connection failure', async () => {
      // Mock network failure for Supabase requests
      await page.route('**/supabase.co/**', async route => {
        await route.abort('failed');
      });

      // Try to access notifications
      await page.click('[data-testid="notification-bell"]');

      // Should show graceful error message, not crash
      await expect(page.locator('text=Unable to load notifications')).toBeVisible();
    });

    // Test 2: Push notification service failure
    await test.step('Push notification service failure', async () => {
      // Mock push service failure
      await page.route('**/functions/v1/**', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service unavailable' })
        });
      });

      // Try to enable push notifications
      await page.click('[data-testid="enable-push-btn"]');

      // Should show error message but not crash app
      await expect(page.locator('text=Failed to enable push notifications')).toBeVisible();
    });
  });

  test('handles invalid user data scenarios', async ({ page }) => {
    // Test corrupted user preferences
    await test.step('Corrupted notification preferences', async () => {
      // Mock corrupted preferences data
      await page.route('**/user_notification_preferences**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            error: null,
            data: null // No preferences found
          })
        });
      });

      // Try to access notification settings
      await page.click('[data-testid="settings-btn"]');

      // Should create default preferences, not crash
      await expect(page.locator('text=Daily Messages')).toBeVisible();
    });

    // Test malformed notification data
    await test.step('Malformed notification data', async () => {
      // Mock malformed notification data
      await page.route('**/user_notifications**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            error: null,
            data: [
              {
                id: 'malformed-1',
                // Missing required fields
                title: null,
                message: undefined,
                created_at: 'invalid-date'
              }
            ]
          })
        });
      });

      // Try to display notifications
      await page.click('[data-testid="notification-bell"]');

      // Should handle malformed data gracefully
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
    });
  });

  test('handles browser API limitations', async ({ page, browserName }) => {
    // Test notification API not available
    await test.step('Notification API not available', async () => {
      // Mock missing Notification API
      await page.addInitScript(() => {
        delete (window as any).Notification;
      });

      // Try to enable notifications
      await page.click('[data-testid="notification-bell"]');

      // Should show appropriate message about browser limitations
      await expect(page.locator('text=Notifications not supported')).toBeVisible();
    });

    // Test service worker registration failure
    await test.step('Service worker registration failure', async () => {
      // Mock service worker registration failure
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          value: {
            register: async () => {
              throw new Error('Service worker registration failed');
            }
          }
        });
      });

      // Try to enable push notifications
      await page.click('[data-testid="enable-push-btn"]');

      // Should handle service worker failure gracefully
      await expect(page.locator('text=Push notifications unavailable')).toBeVisible();
    });
  });

  test('handles database constraint violations', async ({ page }) => {
    // Test duplicate subscription prevention
    await test.step('Duplicate push subscription prevention', async () => {
      const testUser = await createTestUser();

      // Create first subscription
      await page.evaluate(async (userId) => {
        // Simulate creating push subscription
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            subscription: {
              endpoint: 'https://example.com/push1',
              keys: { p256dh: 'key1', auth: 'auth1' }
            }
          })
        });
        return response.ok;
      }, testUser.id);

      // Try to create duplicate subscription
      const duplicateResult = await page.evaluate(async (userId) => {
        try {
          const response = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              subscription: {
                endpoint: 'https://example.com/push2', // Different endpoint
                keys: { p256dh: 'key2', auth: 'auth2' }
              }
            })
          });
          return response.ok;
        } catch (error) {
          return false;
        }
      }, testUser.id);

      // Should fail due to unique constraint (one active subscription per user)
      expect(duplicateResult).toBe(false);
    });
  });

  test('handles authentication edge cases', async ({ page }) => {
    // Test unauthenticated access
    await test.step('Unauthenticated notification access', async () => {
      // Mock unauthenticated state
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Not authenticated' })
        });
      });

      // Try to access notifications
      await page.click('[data-testid="notification-bell"]');

      // Should redirect to login or show auth required message
      await expect(page.locator('text=Sign in to view notifications')).toBeVisible();
    });

    // Test session expiry during notification operations
    await test.step('Session expiry during operations', async () => {
      // Start authenticated
      await page.route('**/auth/**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' }
          })
        });
      });

      // Mock session expiry mid-operation
      await page.route('**/user_notifications**', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expired' })
        });
      });

      // Try notification operation
      await page.click('[data-testid="notification-bell"]');

      // Should handle session expiry gracefully
      await expect(page.locator('text=Please sign in again')).toBeVisible();
    });
  });

  test('handles malformed push subscription data', async ({ page }) => {
    // Test invalid subscription data handling
    await test.step('Invalid push subscription format', async () => {
      // Mock invalid subscription data
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'serviceWorker', {
          writable: true,
          value: {
            register: async () => ({
              pushManager: {
                subscribe: async () => {
                  // Return malformed subscription
                  return {
                    endpoint: null, // Invalid - should be string
                    keys: {
                      p256dh: 'invalid-key', // Invalid format
                      auth: null // Missing
                    }
                  };
                }
              }
            })
          }
        });
      });

      // Try to enable push notifications
      await page.click('[data-testid="enable-push-btn"]');

      // Should handle malformed data gracefully
      await expect(page.locator('text=Unable to enable push notifications')).toBeVisible();
    });
  });

  test('handles timezone edge cases', async ({ page }) => {
    // Test timezone boundary conditions
    await test.step('Invalid timezone handling', async () => {
      // Mock invalid timezone
      await page.evaluate(() => {
        // Override Intl.DateTimeFormat to return invalid timezone
        const originalFormat = Intl.DateTimeFormat;
        Intl.DateTimeFormat = function(locales, options) {
          if (options?.timeZone === 'Invalid/Timezone') {
            throw new Error('Invalid timezone');
          }
          return originalFormat.call(this, locales, options);
        } as any;
      });

      // Try to set notification time
      await page.click('[data-testid="settings-btn"]');
      await page.selectOption('[data-testid="timezone-select"]', 'Invalid/Timezone');

      // Should fallback to UTC gracefully
      await expect(page.locator('text=UTC')).toBeVisible();
    });

    // Test daylight saving time transitions
    await test.step('Daylight saving time transitions', async () => {
      // Mock DST transition
      await page.evaluate(() => {
        const mockDate = new Date('2024-03-10T02:30:00Z'); // During DST transition
        Date.now = () => mockDate.getTime();
      });

      // Try to schedule notification
      await page.click('[data-testid="settings-btn"]');
      await page.selectOption('[data-testid="time-select"]', '2:30 AM');

      // Should handle DST transition gracefully
      await expect(page.locator('[data-testid="settings-saved"]')).toBeVisible();
    });
  });

  test('handles concurrent notification operations', async ({ page, context }) => {
    // Test race conditions and concurrent operations

    await test.step('Concurrent notification creation', async () => {
      // Create multiple pages/tabs
      const page2 = await context.newPage();

      // Both pages try to create notifications simultaneously
      await Promise.all([
        page.evaluate(async () => {
          // Simulate rapid notification creation
          for (let i = 0; i < 5; i++) {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'test',
                title: `Notification ${i}`,
                message: `Message ${i}`
              })
            });
          }
        }),
        page2.evaluate(async () => {
          // Simulate concurrent notification creation
          for (let i = 0; i < 5; i++) {
            await fetch('/api/notifications', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'test',
                title: `Notification ${i}`,
                message: `Message ${i}`
              })
            });
          }
        })
      ]);

      // Verify all notifications were created without conflicts
      await expect(page.locator('[data-testid="notification-count"]')).toHaveText('10');
    });
  });

  test('handles storage quota exceeded', async ({ page }) => {
    // Test localStorage quota limits

    await test.step('Storage quota exceeded handling', async () => {
      // Fill localStorage to quota limit
      await page.evaluate(() => {
        try {
          for (let i = 0; i < 1000; i++) {
            localStorage.setItem(`test-key-${i}`, 'x'.repeat(1000));
          }
        } catch (error) {
          // Expected when quota exceeded
        }
      });

      // Try notification operations that use localStorage
      await page.click('[data-testid="notification-bell"]');

      // Should handle storage quota gracefully
      await expect(page.locator('text=Notifications loaded')).toBeVisible();
    });
  });

  test('handles slow network conditions', async ({ page }) => {
    // Test performance under slow network

    await test.step('Slow network notification loading', async () => {
      // Mock slow network for Supabase requests
      await page.route('**/supabase.co/**', async route => {
        // Add 2 second delay to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.continue();
      });

      const startTime = Date.now();
      await page.click('[data-testid="notification-bell"]');
      const loadTime = Date.now() - startTime;

      // Should eventually load despite slow network
      await expect(page.locator('text=Notifications')).toBeVisible();

      // But should show loading state during slow load
      expect(loadTime).toBeGreaterThan(1500); // Should take at least 1.5 seconds
    });
  });

  test('handles memory pressure scenarios', async ({ page }) => {
    // Test performance under memory constraints

    await test.step('Memory pressure notification handling', async () => {
      // Simulate memory pressure by creating many DOM elements
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'memory-test';

        // Create many elements to consume memory
        for (let i = 0; i < 10000; i++) {
          const element = document.createElement('div');
          element.textContent = `Memory test element ${i}`;
          element.style.display = 'none';
          container.appendChild(element);
        }

        document.body.appendChild(container);
      });

      // Try notification operations under memory pressure
      await page.click('[data-testid="notification-bell"]');

      // Should still work despite memory pressure
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
    });
  });
});
