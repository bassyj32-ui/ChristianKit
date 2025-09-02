export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    totalCount?: number;
    currentPage: number;
    totalPages?: number;
    limit: number;
  };
}

export interface CursorPaginationOptions {
  limit: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
    limit: number;
  };
}

export class PaginationService {
  private static instance: PaginationService;
  
  private constructor() {}

  public static getInstance(): PaginationService {
    if (!PaginationService.instance) {
      PaginationService.instance = new PaginationService();
    }
    return PaginationService.instance;
  }

  /**
   * Create pagination options with defaults
   */
  public createOptions(options: Partial<PaginationOptions> = {}): PaginationOptions {
    return {
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...options
    };
  }

  /**
   * Create cursor-based pagination options
   */
  public createCursorOptions(options: Partial<CursorPaginationOptions> = {}): CursorPaginationOptions {
    return {
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...options
    };
  }

  /**
   * Calculate offset-based pagination
   */
  public calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Calculate total pages
   */
  public calculateTotalPages(totalCount: number, limit: number): number {
    return Math.ceil(totalCount / limit);
  }

  /**
   * Create pagination result for offset-based pagination
   */
  public createPaginationResult<T>(
    data: T[],
    options: PaginationOptions,
    totalCount: number
  ): PaginationResult<T> {
    const { page = 1, limit = 20 } = options;
    const totalPages = this.calculateTotalPages(totalCount, limit);

    return {
      data,
      pagination: {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        totalCount,
        currentPage: page,
        totalPages,
        limit
      }
    };
  }

  /**
   * Create pagination result for cursor-based pagination
   */
  public createCursorPaginationResult<T>(
    data: T[],
    options: CursorPaginationOptions,
    hasNextPage: boolean,
    hasPreviousPage: boolean
  ): CursorPaginationResult<T> {
    const { limit, cursor, sortBy, sortOrder } = options;
    
    let nextCursor: string | undefined;
    let previousCursor: string | undefined;

    if (data.length > 0) {
      if (hasNextPage) {
        const lastItem = data[data.length - 1] as any;
        nextCursor = this.encodeCursor(lastItem, sortBy || 'created_at');
      }
      
      if (hasPreviousPage && cursor) {
        const firstItem = data[0] as any;
        previousCursor = this.encodeCursor(firstItem, sortBy || 'created_at');
      }
    }

    return {
      data,
      pagination: {
        hasNextPage,
        hasPreviousPage,
        nextCursor,
        previousCursor,
        limit
      }
    };
  }

  /**
   * Encode cursor for pagination
   */
  public encodeCursor(item: any, sortBy: string): string {
    const value = item[sortBy];
    if (value instanceof Date) {
      return btoa(`${sortBy}:${value.toISOString()}`);
    }
    return btoa(`${sortBy}:${value}`);
  }

  /**
   * Decode cursor for pagination
   */
  public decodeCursor(cursor: string): { field: string; value: any } {
    try {
      const decoded = atob(cursor);
      const [field, value] = decoded.split(':');
      
      // Try to parse as date if it looks like an ISO date
      if (value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return { field, value: new Date(value) };
      }
      
      return { field, value };
    } catch (error) {
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Build Supabase query with pagination
   */
  public buildSupabaseQuery<T>(
    query: any,
    options: PaginationOptions
  ): any {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', filters } = options;
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
    }
    
    // Apply pagination
    const offset = this.calculateOffset(page, limit);
    query = query.range(offset, offset + limit - 1);
    
    return query;
  }

  /**
   * Build Supabase query with cursor-based pagination
   */
  public buildCursorSupabaseQuery<T>(
    query: any,
    options: CursorPaginationOptions
  ): any {
    const { limit, cursor, sortBy = 'created_at', sortOrder = 'desc', filters } = options;
    
    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    
    // Apply filters
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value);
          } else {
            query = query.eq(key, value);
          }
        }
      }
    }
    
    // Apply cursor pagination
    if (cursor) {
      const { field, value } = this.decodeCursor(cursor);
      if (sortOrder === 'desc') {
        query = query.lt(field, value);
      } else {
        query = query.gt(field, value);
      }
    }
    
    // Apply limit
    query = query.limit(limit + 1); // +1 to check if there's a next page
    
    return query;
  }

  /**
   * Process cursor-based pagination results
   */
  public processCursorResults<T>(
    data: T[],
    limit: number
  ): { data: T[]; hasNextPage: boolean } {
    const hasNextPage = data.length > limit;
    const processedData = hasNextPage ? data.slice(0, limit) : data;
    
    return {
      data: processedData,
      hasNextPage
    };
  }

  /**
   * Create infinite scroll pagination result
   */
  public createInfiniteScrollResult<T>(
    data: T[],
    options: CursorPaginationOptions,
    hasNextPage: boolean
  ): CursorPaginationResult<T> {
    return this.createCursorPaginationResult(data, options, hasNextPage, false);
  }

  /**
   * Validate pagination options
   */
  public validateOptions(options: PaginationOptions): boolean {
    const { page, limit } = options;
    
    if (page && page < 1) return false;
    if (limit && (limit < 1 || limit > 100)) return false;
    
    return true;
  }

  /**
   * Get default pagination options for different content types
   */
  public getDefaultOptions(contentType: 'posts' | 'comments' | 'users' | 'notifications'): PaginationOptions {
    const defaults = {
      posts: { limit: 20, sortBy: 'created_at', sortOrder: 'desc' as const },
      comments: { limit: 50, sortBy: 'created_at', sortOrder: 'asc' as const },
      users: { limit: 30, sortBy: 'display_name', sortOrder: 'asc' as const },
      notifications: { limit: 25, sortBy: 'created_at', sortOrder: 'desc' as const }
    };
    
    return defaults[contentType];
  }

  /**
   * Create URL-friendly pagination parameters
   */
  public createUrlParams(options: PaginationOptions): URLSearchParams {
    const params = new URLSearchParams();
    
    if (options.page && options.page > 1) {
      params.set('page', options.page.toString());
    }
    
    if (options.limit && options.limit !== 20) {
      params.set('limit', options.limit.toString());
    }
    
    if (options.sortBy && options.sortBy !== 'created_at') {
      params.set('sortBy', options.sortBy);
    }
    
    if (options.sortOrder && options.sortOrder !== 'desc') {
      params.set('sortOrder', options.sortOrder);
    }
    
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value !== undefined && value !== null) {
          params.set(`filter_${key}`, value.toString());
        }
      }
    }
    
    return params;
  }

  /**
   * Parse URL parameters into pagination options
   */
  public parseUrlParams(params: URLSearchParams): PaginationOptions {
    const options: PaginationOptions = {};
    
    const page = params.get('page');
    if (page) {
      const pageNum = parseInt(page, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        options.page = pageNum;
      }
    }
    
    const limit = params.get('limit');
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 100) {
        options.limit = limitNum;
      }
    }
    
    const sortBy = params.get('sortBy');
    if (sortBy) {
      options.sortBy = sortBy;
    }
    
    const sortOrder = params.get('sortOrder');
    if (sortOrder && (sortOrder === 'asc' || sortOrder === 'desc')) {
      options.sortOrder = sortOrder;
    }
    
    // Parse filters
    const filters: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      if (key.startsWith('filter_')) {
        const filterKey = key.replace('filter_', '');
        filters[filterKey] = value;
      }
    }
    
    if (Object.keys(filters).length > 0) {
      options.filters = filters;
    }
    
    return options;
  }
}

// Export singleton instance
export const paginationService = PaginationService.getInstance();
