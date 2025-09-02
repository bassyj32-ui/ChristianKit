# 🚀 ChristianKit Performance & Security Features

This document outlines the comprehensive performance and security improvements implemented in ChristianKit to address the critical issues identified:

- ❌ **No Rate Limiting** → ✅ **Intelligent Rate Limiting System**
- ❌ **No Content Moderation** → ✅ **AI-Powered Content Moderation**
- ❌ **No Pagination** → ✅ **Efficient Cursor-Based Pagination**
- ❌ **No Caching** → ✅ **Multi-Layer Intelligent Caching**

## 🛡️ Security Features

### 1. Rate Limiting Service

**Purpose**: Prevents spam posts, API abuse, and ensures fair usage across all users.

**Features**:
- **Per-Action Limits**: Different limits for posts, interactions, prayers, etc.
- **Time Windows**: Configurable time periods (1 minute, 5 minutes, etc.)
- **Memory + Database**: Hybrid storage for performance and persistence
- **Automatic Cleanup**: Expired limits are automatically removed

**Default Limits**:
```typescript
POST_CREATION: 3 posts per minute
INTERACTION: 10 interactions per minute
PRAYER: 5 prayers per minute
LOGIN: 5 attempts per 5 minutes
API_CALLS: 100 calls per minute
```

**Usage**:
```typescript
import { rateLimitService } from './services/rateLimitService';

// Check if user can perform action
const canPost = await rateLimitService.checkRateLimit(userId, 'POST_CREATION');
if (!canPost.allowed) {
  // Show rate limit message
  const waitTime = Math.ceil(canPost.retryAfter / 1000);
  console.log(`Please wait ${waitTime} seconds`);
}

// Record action after successful operation
await rateLimitService.recordAction(userId, 'POST_CREATION');
```

### 2. Content Moderation Service

**Purpose**: Automatically filters inappropriate content before it goes live.

**Features**:
- **Keyword Filtering**: Blocks profanity, hate speech, spam patterns
- **Spam Detection**: Identifies repeated content, suspicious patterns
- **Confidence Scoring**: AI-like scoring system for content quality
- **Audit Trail**: Complete logging of all moderation decisions
- **Customizable Rules**: Easy to add/remove moderation rules

**Default Rules**:
```typescript
// Spam patterns
- Excessive links (>3 per post)
- Repeated characters (>10 in a row)
- All caps text

// Inappropriate content
- Profanity filter
- Hate speech detection
- Suspicious patterns (buy/sell, discounts, etc.)

// Spiritual content validation
- Bible quote validation
- Minimum/maximum length checks
```

**Usage**:
```typescript
import { contentModerationService } from './services/contentModerationService';

// Moderate content before posting
const result = await contentModerationService.moderateContent(
  postContent,
  userId,
  'prayer'
);

if (!result.isApproved) {
  console.log('Content blocked:', result.reason);
  console.log('Flags:', result.flags);
  console.log('Confidence:', result.confidence);
}

// Check if manual review is needed
if (result.requiresReview) {
  // Send to admin queue
}
```

## ⚡ Performance Features

### 3. Pagination Service

**Purpose**: Efficiently loads data in chunks instead of all at once.

**Features**:
- **Cursor-Based Pagination**: Better performance than offset-based
- **Infinite Scroll Support**: Perfect for social media feeds
- **Flexible Sorting**: Sort by any field in any direction
- **Filtering**: Apply multiple filters simultaneously
- **URL Integration**: Pagination state in URL for sharing/bookmarking

**Usage**:
```typescript
import { paginationService } from './services/paginationService';

// Create pagination options
const options = paginationService.createOptions({
  page: 1,
  limit: 20,
  sortBy: 'created_at',
  sortOrder: 'desc',
  filters: { category: 'prayer' }
});

// Build Supabase query
let query = supabase.from('posts').select('*');
query = paginationService.buildSupabaseQuery(query, options);

// For infinite scroll (cursor-based)
const cursorOptions = paginationService.createCursorOptions({
  limit: 20,
  cursor: 'eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMC4wMDBaIn0='
});

query = paginationService.buildCursorSupabaseQuery(query, cursorOptions);
```

### 4. Enhanced Caching Service

**Purpose**: Reduces database queries and improves response times.

**Features**:
- **Multi-Layer Caching**: Memory + persistent storage
- **Category-Based Strategies**: Different TTLs for different content types
- **Intelligent Invalidation**: Automatically clears related caches
- **Performance Monitoring**: Track hit rates and memory usage
- **Automatic Cleanup**: Removes expired entries

**Cache Strategies**:
```typescript
// User data - cache for 1 hour, high priority
user_profile: { ttl: 3600, priority: 'high' }

// Community content - cache for 15 minutes, medium priority
posts: { ttl: 900, priority: 'medium', maxSize: 1000 }

// Bible content - cache for 24 hours, low priority
bible_verses: { ttl: 86400, priority: 'low' }

// Notifications - cache for 1 minute, high priority
notifications: { ttl: 60, priority: 'high' }
```

**Usage**:
```typescript
import { enhancedCacheService } from './services/enhancedCacheService';

// Get with fallback
const posts = await enhancedCacheService.getOrSet(
  'trending_posts:20',
  () => fetchTrendingPosts(20),
  'trending_posts'
);

// Set with category
await enhancedCacheService.set(
  'user_profile:123',
  userData,
  'user_profile',
  { userId: 123, lastUpdated: Date.now() }
);

// Invalidate related caches
await enhancedCacheService.invalidate('trending_posts');
await enhancedCacheService.invalidateCategory('posts');
```

## 🗄️ Database Schema

### New Tables

Run the `scripts/performance-security-updates.sql` script in your Supabase dashboard to create:

1. **`rate_limits`**: Stores rate limiting data
2. **`moderation_logs`**: Audit trail for content moderation
3. **`cache_metrics`**: Performance monitoring data

### Functions

- **`cleanup_expired_rate_limits()`**: Removes expired rate limit entries
- **`get_rate_limit_stats()`**: Returns rate limiting statistics
- **`get_moderation_stats()`**: Returns content moderation statistics
- **`get_cache_performance()`**: Returns cache performance metrics

### Scheduled Jobs

- **Hourly**: Clean up expired rate limits
- **Daily 2 AM**: Clean up old moderation logs (30+ days)
- **Daily 3 AM**: Clean up old cache metrics (7+ days)

## 🎛️ Admin Dashboard

### Performance Dashboard Component

The `PerformanceDashboard` component provides real-time monitoring of:

- **Rate Limits**: Active limits, expired entries, user counts
- **Content Moderation**: Approval rates, flagged content, review queue
- **Cache Performance**: Hit rates, memory usage, category status
- **System Health**: Overall system status and quick actions

**Usage**:
```typescript
import PerformanceDashboard from './components/PerformanceDashboard';

// Add to your admin routes
<Route path="/admin/performance" element={<PerformanceDashboard />} />
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_STRICT_MODE=false

# Content Moderation
MODERATION_AUTO_APPROVE=false
MODERATION_REVIEW_THRESHOLD=0.7
MODERATION_MAX_CONTENT_LENGTH=1000

# Caching
CACHE_ENABLED=true
CACHE_MEMORY_LIMIT=100MB
CACHE_PERSISTENT_TTL=3600

# Pagination
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
```

### Service Configuration

```typescript
// Configure rate limiting
rateLimitService.updateSettings({
  POST_CREATION: { maxRequests: 5, windowMs: 60000 }
});

// Configure content moderation
contentModerationService.updateSettings({
  autoApprove: true,
  requireReviewThreshold: 0.8
});

// Configure caching
enhancedCacheService.addStrategy('custom', {
  ttl: 1800,
  priority: 'medium',
  maxSize: 500
});
```

## 📊 Monitoring & Analytics

### Metrics Available

1. **Rate Limiting**:
   - Total active limits
   - Expired entries count
   - Per-user limit status

2. **Content Moderation**:
   - Posts processed today
   - Approval/rejection rates
   - Content quality scores
   - Review queue length

3. **Cache Performance**:
   - Hit rates by category
   - Memory usage
   - Cache invalidation frequency

### Real-Time Updates

The dashboard refreshes automatically every 30 seconds and provides:

- Live rate limit status
- Real-time moderation queue
- Current cache performance
- System health indicators

## 🚨 Error Handling

### Rate Limit Exceeded

```typescript
try {
  const result = await createPost(postData);
  if (!result.success) {
    if (result.error?.includes('Rate limit exceeded')) {
      // Show user-friendly message with wait time
      showRateLimitMessage(result.error);
    }
  }
} catch (error) {
  console.error('Post creation failed:', error);
}
```

### Content Moderation Failed

```typescript
try {
  const result = await createPost(postData);
  if (!result.success && result.moderationResult) {
    if (result.moderationResult.requiresReview) {
      // Show "pending review" message
      showPendingReviewMessage();
    } else {
      // Show rejection reason
      showRejectionMessage(result.moderationResult.reason);
    }
  }
} catch (error) {
  console.error('Post creation failed:', error);
}
```

## 🔒 Security Best Practices

### Rate Limiting

- **Fail Open**: If rate limiting fails, allow the request
- **User-Specific Keys**: Each user has separate limits
- **Automatic Reset**: Limits reset after time windows
- **Admin Override**: Admins can reset limits for users

### Content Moderation

- **Audit Trail**: All decisions are logged
- **Confidence Scoring**: Transparent decision making
- **Manual Review**: Low-confidence content goes to admins
- **Custom Rules**: Easy to adapt to community needs

### Caching

- **TTL Enforcement**: Automatic expiration
- **Size Limits**: Prevent memory overflow
- **Invalidation Patterns**: Smart cache clearing
- **Performance Monitoring**: Track effectiveness

## 🧪 Testing

### Test Rate Limiting

```typescript
// Test rapid post creation
for (let i = 0; i < 5; i++) {
  const result = await createPost(testPost);
  console.log(`Post ${i + 1}:`, result.success);
  if (!result.success) {
    console.log('Rate limited:', result.error);
    break;
  }
}
```

### Test Content Moderation

```typescript
// Test inappropriate content
const testContent = "This is a test post with inappropriate language";
const result = await contentModerationService.moderateContent(
  testContent,
  userId,
  'general'
);

console.log('Moderation result:', result);
```

### Test Caching

```typescript
// Test cache hit/miss
const start = Date.now();
const posts1 = await getTrendingPosts({ useCache: true });
const time1 = Date.now() - start;

const start2 = Date.now();
const posts2 = await getTrendingPosts({ useCache: true });
const time2 = Date.now() - start2;

console.log(`First request: ${time1}ms`);
console.log(`Cached request: ${time2}ms`);
console.log(`Cache improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
```

## 📈 Performance Impact

### Expected Improvements

- **Database Queries**: 60-80% reduction through caching
- **Response Times**: 3-5x faster for cached content
- **User Experience**: Smooth infinite scroll with pagination
- **System Stability**: No more spam or abuse
- **Content Quality**: Filtered inappropriate content

### Monitoring

Use the Performance Dashboard to track:

- Cache hit rates (target: >80%)
- Rate limit effectiveness
- Content moderation accuracy
- System response times
- Memory usage patterns

## 🆘 Troubleshooting

### Common Issues

1. **Rate Limits Too Strict**:
   ```typescript
   // Adjust limits for specific actions
   rateLimitService.updateSettings({
     POST_CREATION: { maxRequests: 10, windowMs: 60000 }
   });
   ```

2. **Cache Not Working**:
   ```typescript
   // Check cache status
   const stats = enhancedCacheService.getStats();
   console.log('Cache stats:', stats);
   
   // Clear and rebuild cache
   await enhancedCacheService.clear();
   ```

3. **Moderation Too Aggressive**:
   ```typescript
   // Adjust confidence threshold
   contentModerationService.updateSettings({
     requireReviewThreshold: 0.5
   });
   ```

### Debug Mode

Enable debug logging:

```typescript
// Rate limiting debug
localStorage.setItem('DEBUG_RATE_LIMITS', 'true');

// Content moderation debug
localStorage.setItem('DEBUG_MODERATION', 'true');

// Cache debug
localStorage.setItem('DEBUG_CACHE', 'true');
```

## 🔮 Future Enhancements

### Planned Features

1. **AI Content Moderation**: Integration with OpenAI/Claude
2. **Advanced Analytics**: User behavior patterns, content trends
3. **Machine Learning**: Adaptive rate limiting based on user history
4. **Real-Time Alerts**: Notifications for security threats
5. **A/B Testing**: Different moderation strategies

### Integration Points

- **Analytics Platforms**: Google Analytics, Mixpanel
- **Monitoring Tools**: Sentry, LogRocket
- **Security Services**: Cloudflare, AWS Shield
- **Content APIs**: Perspective API, Sift

---

## 📞 Support

For questions or issues with these features:

1. Check the troubleshooting section above
2. Review the service logs for errors
3. Use the Performance Dashboard for diagnostics
4. Check the database functions for data integrity

**Remember**: These features are designed to work together to create a secure, performant, and scalable platform for your Christian community! 🙏✨
