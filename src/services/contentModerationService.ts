import { supabase } from '../utils/supabase';

export interface ModerationResult {
  isApproved: boolean;
  reason?: string;
  confidence: number;
  flags: string[];
  requiresReview: boolean;
}

export interface ModerationRule {
  id: string;
  name: string;
  pattern: RegExp | string;
  action: 'block' | 'flag' | 'allow';
  severity: 'low' | 'medium' | 'high';
  category: 'spam' | 'inappropriate' | 'harassment' | 'spiritual' | 'general';
}

export interface ModerationSettings {
  autoApprove: boolean;
  requireReviewThreshold: number;
  maxContentLength: number;
  enableAI: boolean;
  enableKeywordFiltering: boolean;
  enableSpamDetection: boolean;
}

export class ContentModerationService {
  private static instance: ContentModerationService;
  private rules: ModerationRule[] = [];
  private settings: ModerationSettings;
  
  // Default moderation rules
  private static readonly DEFAULT_RULES: ModerationRule[] = [
    // Spam patterns
    {
      id: 'spam_links',
      name: 'Excessive Links',
      pattern: /(https?:\/\/[^\s]+){3,}/g,
      action: 'flag',
      severity: 'medium',
      category: 'spam'
    },
    {
      id: 'repeated_chars',
      name: 'Repeated Characters',
      pattern: /(.)\1{10,}/g,
      action: 'flag',
      severity: 'low',
      category: 'spam'
    },
    {
      id: 'all_caps',
      name: 'All Caps Text',
      pattern: /^[A-Z\s!?.,;:]+$/,
      action: 'flag',
      severity: 'low',
      category: 'spam'
    },
    
    // Inappropriate content
    {
      id: 'profanity',
      name: 'Profanity',
      pattern: /\b(?:fuck|shit|bitch|ass|damn|hell)\b/gi,
      action: 'block',
      severity: 'high',
      category: 'inappropriate'
    },
    {
      id: 'hate_speech',
      name: 'Hate Speech',
      pattern: /\b(?:kill|hate|death|suicide|murder)\b/gi,
      action: 'flag',
      severity: 'high',
      category: 'harassment'
    },
    
    // Spiritual content validation
    {
      id: 'bible_quotes',
      name: 'Bible Quote Validation',
      pattern: /"([^"]+)"\s*-\s*(?:John|Matthew|Mark|Luke|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|John|Jude|Revelation)\s*\d+:\d+/gi,
      action: 'allow',
      severity: 'low',
      category: 'spiritual'
    },
    
    // General rules
    {
      id: 'min_length',
      name: 'Minimum Length',
      pattern: /.{10,}/,
      action: 'allow',
      severity: 'low',
      category: 'general'
    },
    {
      id: 'max_length',
      name: 'Maximum Length',
      pattern: /.{1,1000}/,
      action: 'flag',
      severity: 'medium',
      category: 'general'
    }
  ];

  private constructor() {
    this.rules = [...ContentModerationService.DEFAULT_RULES];
    this.settings = {
      autoApprove: false,
      requireReviewThreshold: 0.7,
      maxContentLength: 1000,
      enableAI: false,
      enableKeywordFiltering: true,
      enableSpamDetection: true
    };
  }

  public static getInstance(): ContentModerationService {
    if (!ContentModerationService.instance) {
      ContentModerationService.instance = new ContentModerationService();
    }
    return ContentModerationService.instance;
  }

  /**
   * Moderate content before posting
   */
  public async moderateContent(
    content: string,
    authorId: string,
    category: string
  ): Promise<ModerationResult> {
    try {
      const result: ModerationResult = {
        isApproved: true,
        confidence: 1.0,
        flags: [],
        requiresReview: false
      };

      // Check content length
      if (content.length > this.settings.maxContentLength) {
        result.isApproved = false;
        result.reason = 'Content too long';
        result.flags.push('exceeds_length_limit');
        result.confidence = 0.9;
      }

      // Apply keyword filtering rules
      if (this.settings.enableKeywordFiltering) {
        const keywordResult = this.applyKeywordRules(content);
        if (!keywordResult.isApproved) {
          result.isApproved = false;
          result.reason = keywordResult.reason;
          result.flags.push(...keywordResult.flags);
          result.confidence = Math.min(result.confidence, keywordResult.confidence);
        }
      }

      // Apply spam detection
      if (this.settings.enableSpamDetection) {
        const spamResult = this.detectSpam(content, authorId);
        if (!spamResult.isApproved) {
          result.isApproved = false;
          result.reason = spamResult.reason;
          result.flags.push(...spamResult.flags);
          result.confidence = Math.min(result.confidence, spamResult.confidence);
        }
      }

      // Check if content requires manual review
      result.requiresReview = result.confidence < this.settings.requireReviewThreshold;

      // Auto-approve if enabled and confidence is high
      if (this.settings.autoApprove && result.confidence >= this.settings.requireReviewThreshold) {
        result.isApproved = true;
      }

      // Log moderation result
      await this.logModerationResult(content, authorId, result);

      return result;
    } catch (error) {
      console.error('Content moderation failed:', error);
      // Fail open - allow content if moderation fails
      return {
        isApproved: true,
        confidence: 0.5,
        flags: ['moderation_failed'],
        requiresReview: true
      };
    }
  }

  /**
   * Apply keyword-based moderation rules
   */
  private applyKeywordRules(content: string): ModerationResult {
    const result: ModerationResult = {
      isApproved: true,
      confidence: 1.0,
      flags: [],
      requiresReview: false
    };

    for (const rule of this.rules) {
      if (typeof rule.pattern === 'string') {
        if (content.toLowerCase().includes(rule.pattern.toLowerCase())) {
          this.applyRule(rule, result);
        }
      } else {
        const matches = content.match(rule.pattern);
        if (matches) {
          this.applyRule(rule, result);
        }
      }
    }

    return result;
  }

  /**
   * Apply a single moderation rule
   */
  private applyRule(rule: ModerationRule, result: ModerationResult): void {
    switch (rule.action) {
      case 'block':
        result.isApproved = false;
        result.reason = `Content blocked by rule: ${rule.name}`;
        result.flags.push(`${rule.category}_${rule.severity}`);
        result.confidence = Math.min(result.confidence, this.getSeverityConfidence(rule.severity));
        break;
      
      case 'flag':
        result.flags.push(`${rule.category}_${rule.severity}`);
        result.confidence = Math.min(result.confidence, this.getSeverityConfidence(rule.severity));
        if (rule.severity === 'high') {
          result.requiresReview = true;
        }
        break;
      
      case 'allow':
        // Content is explicitly allowed
        break;
    }
  }

  /**
   * Detect spam patterns
   */
  private detectSpam(content: string, authorId: string): ModerationResult {
    const result: ModerationResult = {
      isApproved: true,
      confidence: 1.0,
      flags: [],
      requiresReview: false
    };

    // Check for repeated content patterns
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 2) { // Ignore short words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }

    // Flag if any word appears too frequently
    for (const [word, count] of wordCounts.entries()) {
      if (count > words.length * 0.3) { // More than 30% of words
        result.flags.push('repeated_words');
        result.confidence = Math.min(result.confidence, 0.8);
        result.requiresReview = true;
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(?:buy|sell|discount|offer|limited|act now|click here)\b/gi,
      /\$\d+|\d+%|\d+x/gi,
      /(?:www\.|https?:\/\/)[^\s]+/gi
    ];

    let suspiciousCount = 0;
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        suspiciousCount++;
      }
    }

    if (suspiciousCount >= 2) {
      result.flags.push('suspicious_patterns');
      result.confidence = Math.min(result.confidence, 0.7);
      result.requiresReview = true;
    }

    return result;
  }

  /**
   * Get confidence score based on severity
   */
  private getSeverityConfidence(severity: string): number {
    switch (severity) {
      case 'low': return 0.9;
      case 'medium': return 0.7;
      case 'high': return 0.5;
      default: return 0.8;
    }
  }

  /**
   * Log moderation result for audit trail
   */
  private async logModerationResult(
    content: string,
    authorId: string,
    result: ModerationResult
  ): Promise<void> {
    try {
      await supabase
        .from('moderation_logs')
        .insert({
          author_id: authorId,
          content_preview: content.substring(0, 200),
          content_length: content.length,
          is_approved: result.isApproved,
          moderation_reason: result.reason,
          confidence_score: result.confidence,
          flags: result.flags,
          requires_review: result.requiresReview,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log moderation result:', error);
    }
  }

  /**
   * Add custom moderation rule
   */
  public addRule(rule: ModerationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove moderation rule
   */
  public removeRule(ruleId: string): void {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  /**
   * Update moderation settings
   */
  public updateSettings(settings: Partial<ModerationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current moderation settings
   */
  public getSettings(): ModerationSettings {
    return { ...this.settings };
  }

  /**
   * Get all moderation rules
   */
  public getRules(): ModerationRule[] {
    return [...this.rules];
  }

  /**
   * Bulk moderate multiple posts (for admin review)
   */
  public async bulkModerate(posts: Array<{ id: string; content: string; authorId: string }>): Promise<Map<string, ModerationResult>> {
    const results = new Map<string, ModerationResult>();
    
    for (const post of posts) {
      const result = await this.moderateContent(post.content, post.authorId, 'general');
      results.set(post.id, result);
    }
    
    return results;
  }

  /**
   * Get moderation statistics
   */
  public async getModerationStats(): Promise<{
    totalPosts: number;
    approvedPosts: number;
    flaggedPosts: number;
    blockedPosts: number;
    reviewRequired: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select('is_approved, requires_review, flags');

      if (error) throw error;

      const stats = {
        totalPosts: data?.length || 0,
        approvedPosts: 0,
        flaggedPosts: 0,
        blockedPosts: 0,
        reviewRequired: 0
      };

      for (const log of data || []) {
        if (log.is_approved) {
          stats.approvedPosts++;
        } else {
          stats.blockedPosts++;
        }
        
        if (log.requires_review) {
          stats.reviewRequired++;
        }
        
        if (log.flags && log.flags.length > 0) {
          stats.flaggedPosts++;
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get moderation stats:', error);
      return {
        totalPosts: 0,
        approvedPosts: 0,
        flaggedPosts: 0,
        blockedPosts: 0,
        reviewRequired: 0
      };
    }
  }
}

// Export singleton instance
export const contentModerationService = ContentModerationService.getInstance();
