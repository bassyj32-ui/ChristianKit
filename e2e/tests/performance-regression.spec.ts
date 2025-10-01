import { test, expect } from '@playwright/test';
import { setupTestDatabase, cleanupTestData } from '../utils/test-database';

test.describe('Performance Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestDatabase();

    // Mock authentication
    await page.route('**/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'test-user-id', email: 'test@example.com' }
        })
      });
    });

    await page.goto('/');
  });

  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('notification loading performance', async ({ page }) => {
    // Performance test: Loading 100 notifications should be fast

    await test.step('Baseline performance measurement', async () => {
      const startTime = Date.now();

      // Mock large dataset of notifications
      await page.route('**/user_notifications**', async route => {
        const mockNotifications = Array.from({ length: 100 }, (_, i) => ({
          id: `notification-${i}`,
          user_id: 'test-user-id',
          type: 'test',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          read: i < 50, // 50 read, 50 unread
          created_at: new Date(Date.now() - i * 60000).toISOString(), // Spread over time
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockNotifications,
            error: null
          })
        });
      });

      // Load notifications
      await page.click('[data-testid="notification-bell"]');

      const loadTime = Date.now() - startTime;

      // Wait for notifications to render
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(100);

      // Should load 100 notifications in under 2 seconds
      expect(loadTime).toBeLessThan(2000);

      console.log(`📊 Notification loading: ${loadTime}ms for 100 items`);
    });
  });

  test('notification filtering performance', async ({ page }) => {
    // Test filtering performance with large dataset

    await test.step('Unread filter performance', async () => {
      // Mock 1000 notifications (800 read, 200 unread)
      await page.route('**/user_notifications**', async route => {
        const mockNotifications = Array.from({ length: 1000 }, (_, i) => ({
          id: `notification-${i}`,
          user_id: 'test-user-id',
          type: 'test',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          read: i < 800, // 800 read, 200 unread
          created_at: new Date(Date.now() - i * 60000).toISOString(),
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockNotifications,
            error: null
          })
        });
      });

      const startTime = Date.now();
      await page.click('[data-testid="notification-bell"]');

      // Filter to unread only
      await page.click('[data-testid="filter-unread"]');

      const filterTime = Date.now() - startTime;

      // Wait for filtered results
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(200);

      // Filtering 1000 items should take under 1 second
      expect(filterTime).toBeLessThan(1000);

      console.log(`📊 Notification filtering: ${filterTime}ms for 1000 items`);
    });
  });

  test('real-time notification performance', async ({ page }) => {
    // Test performance of real-time updates

    await test.step('Rapid real-time updates', async () => {
      const startTime = Date.now();

      // Simulate 50 rapid real-time notifications
      for (let i = 0; i < 50; i++) {
        await page.evaluate((index) => {
          const event = new CustomEvent('supabase-realtime', {
            detail: {
              eventType: 'INSERT',
              new: {
                id: `realtime-${index}`,
                user_id: 'test-user-id',
                type: 'test',
                title: `Real-time Notification ${index}`,
                message: `Message ${index}`,
                read: false,
                created_at: new Date().toISOString()
              }
            }
          });
          window.dispatchEvent(event);
        }, i);

        // Small delay between notifications
        await page.waitForTimeout(10);
      }

      const updateTime = Date.now() - startTime;

      // Wait for all notifications to be processed
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(50);

      // 50 rapid updates should complete in under 3 seconds
      expect(updateTime).toBeLessThan(3000);

      console.log(`📊 Real-time updates: ${updateTime}ms for 50 notifications`);
    });
  });

  test('memory usage regression', async ({ page }) => {
    // Test for memory leaks in notification system

    await test.step('Memory usage after repeated operations', async () => {
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform 100 notification operations
      for (let i = 0; i < 100; i++) {
        await page.click('[data-testid="notification-bell"]');
        await page.waitForTimeout(50);

        // Mock notification data for each operation
        await page.route('**/user_notifications**', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [{
                id: `memory-test-${i}`,
                user_id: 'test-user-id',
                type: 'test',
                title: `Memory Test ${i}`,
                message: `Message ${i}`,
                read: false,
                created_at: new Date().toISOString(),
              }],
              error: null
            })
          });
        });
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });

      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB for 100 operations)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);

      console.log(`📊 Memory usage: +${Math.round(memoryIncrease / 1024 / 1024)}MB for 100 operations`);
    });
  });

  test('database query performance regression', async ({ page }) => {
    // Test database query performance doesn't regress

    await test.step('Notification count query performance', async () => {
      // Mock slow database response
      await page.route('**/user_notifications**', async route => {
        // Simulate slow database query (200ms delay)
        await new Promise(resolve => setTimeout(resolve, 200));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            error: null
          })
        });
      });

      const startTime = Date.now();
      await page.click('[data-testid="notification-bell"]');
      const queryTime = Date.now() - startTime;

      // Query should complete despite simulated slowness
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();

      // Should handle slow queries gracefully (under 5 seconds)
      expect(queryTime).toBeLessThan(5000);

      console.log(`📊 Database query time: ${queryTime}ms`);
    });
  });

  test('caching effectiveness validation', async ({ page }) => {
    // Test that caching improves performance

    await test.step('First load vs cached load performance', async () => {
      // First load (cache miss)
      const firstLoadStart = Date.now();

      await page.route('**/user_notifications**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 50 }, (_, i) => ({
              id: `cached-${i}`,
              user_id: 'test-user-id',
              type: 'test',
              title: `Cached Notification ${i}`,
              message: `Message ${i}`,
              read: false,
              created_at: new Date().toISOString(),
            })),
            error: null
          })
        });
      });

      await page.click('[data-testid="notification-bell"]');
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(50);

      const firstLoadTime = Date.now() - firstLoadStart;

      // Second load (cache hit) - reload page to test cache
      await page.reload();

      const secondLoadStart = Date.now();
      await page.click('[data-testid="notification-bell"]');
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(50);

      const secondLoadTime = Date.now() - secondLoadStart;

      // Second load should be faster due to caching
      expect(secondLoadTime).toBeLessThan(firstLoadTime);

      console.log(`📊 Cache effectiveness: ${firstLoadTime}ms → ${secondLoadTime}ms (${Math.round((1 - secondLoadTime/firstLoadTime) * 100)}% improvement)`);
    });
  });

  test('concurrent user operations performance', async ({ page, context }) => {
    // Test performance under concurrent load

    await test.step('Multiple users accessing notifications simultaneously', async () => {
      const startTime = Date.now();

      // Create multiple pages simulating different users
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage(),
      ]);

      // All pages try to load notifications simultaneously
      await Promise.all(
        pages.map(async (testPage) => {
          await testPage.route('**/auth/**', async route => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                user: { id: `concurrent-user-${Math.random()}`, email: 'test@example.com' }
              })
            });
          });

          await testPage.goto('/');
          await testPage.click('[data-testid="notification-bell"]');

          // Mock notification data for each user
          await testPage.route('**/user_notifications**', async route => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                data: [{
                  id: `concurrent-${Date.now()}`,
                  user_id: 'concurrent-user-id',
                  type: 'test',
                  title: 'Concurrent Notification',
                  message: 'Concurrent test message',
                  read: false,
                  created_at: new Date().toISOString(),
                }],
                error: null
              })
            });
          });

          await testPage.waitForSelector('[data-testid="notification-item"]');
        })
      );

      const totalTime = Date.now() - startTime;

      // 4 concurrent users should complete in under 5 seconds
      expect(totalTime).toBeLessThan(5000);

      console.log(`📊 Concurrent operations: ${totalTime}ms for 4 users`);
    });
  });

  test('notification rendering performance', async ({ page }) => {
    // Test UI rendering performance with large notification lists

    await test.step('Large notification list rendering', async () => {
      const notificationCount = 500;

      await page.route('**/user_notifications**', async route => {
        const mockNotifications = Array.from({ length: notificationCount }, (_, i) => ({
          id: `render-${i}`,
          user_id: 'test-user-id',
          type: 'test',
          title: `Notification ${i}`,
          message: `Message ${i}`,
          read: i % 2 === 0, // Alternate read/unread
          created_at: new Date(Date.now() - i * 60000).toISOString(),
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: mockNotifications,
            error: null
          })
        });
      });

      const startTime = Date.now();
      await page.click('[data-testid="notification-bell"]');

      // Wait for all notifications to render
      await expect(page.locator('[data-testid="notification-item"]')).toHaveCount(notificationCount);

      const renderTime = Date.now() - startTime;

      // Should render 500 notifications in under 3 seconds
      expect(renderTime).toBeLessThan(3000);

      console.log(`📊 UI rendering: ${renderTime}ms for ${notificationCount} notifications`);
    });
  });

  test('mobile performance validation', async ({ page }) => {
    // Test performance on mobile devices

    await test.step('Mobile viewport performance', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Mock mobile notification data
      await page.route('**/user_notifications**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: Array.from({ length: 20 }, (_, i) => ({
              id: `mobile-${i}`,
              user_id: 'test-user-id',
              type: 'test',
              title: `Mobile Notification ${i}`,
              message: `Message ${i}`,
              read: false,
              created_at: new Date().toISOString(),
            })),
            error: null
          })
        });
      });

      const startTime = Date.now();
      await page.click('[data-testid="notification-bell"]');

      // Wait for mobile-optimized interface
      await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();

      const mobileLoadTime = Date.now() - startTime;

      // Mobile should load in under 2 seconds
      expect(mobileLoadTime).toBeLessThan(2000);

      console.log(`📱 Mobile performance: ${mobileLoadTime}ms load time`);
    });
  });

  test('offline functionality validation', async ({ page }) => {
    // Test notification system behavior when offline

    await test.step('Offline notification access', async () => {
      // Mock offline state
      await page.context().setOffline(true);

      // Try to access notifications while offline
      await page.click('[data-testid="notification-bell"]');

      // Should show offline message or cached data
      await expect(page.locator('text=Offline')).toBeVisible();
    });

    await test.step('Online recovery after offline', async () => {
      // Go back online
      await page.context().setOffline(false);

      // Mock successful notification data
      await page.route('**/user_notifications**', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              id: 'recovery-1',
              user_id: 'test-user-id',
              type: 'test',
              title: 'Recovery Notification',
              message: 'Back online!',
              read: false,
              created_at: new Date().toISOString(),
            }],
            error: null
          })
        });
      });

      // Refresh notifications
      await page.reload();
      await page.click('[data-testid="notification-bell"]');

      // Should recover and show latest notifications
      await expect(page.locator('text=Recovery Notification')).toBeVisible();
    });
  });
});
