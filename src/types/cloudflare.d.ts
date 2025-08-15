// Cloudflare Types Declaration
// These types will be available when running in Cloudflare Workers environment

declare global {
  interface KVNamespace {
    get(key: string, options?: KVNamespaceGetOptions): Promise<string | null>;
    put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
    getMany(keys: string[]): Promise<(string | null)[]>;
    putMany(entries: KVNamespacePutEntry[]): Promise<void>;
  }

  interface KVNamespaceGetOptions {
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    cacheTtl?: number;
  }

  interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: any;
  }

  interface KVNamespaceListOptions {
    limit?: number;
    prefix?: string;
    cursor?: string;
  }

  interface KVNamespaceListResult {
    keys: KVNamespaceListKey[];
    list_complete: boolean;
    cursor?: string;
  }

  interface KVNamespaceListKey {
    name: string;
    expiration?: number;
    metadata?: any;
  }

  interface KVNamespacePutEntry {
    key: string;
    value: string;
    options?: KVNamespacePutOptions;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1Result>;
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = any>(): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = any>(): Promise<D1Result<T>>;
  }

  interface D1Result<T = any> {
    lastRowId: number | null;
    changes: number;
    duration: number;
    results?: T[];
    success: boolean;
    meta?: any;
  }

  interface EventContext<Env> {
    request: Request;
    env: Env;
    params: any;
    waitUntil: (promise: Promise<any>) => void;
  }
}

export {};



// These types will be available when running in Cloudflare Workers environment

declare global {
  interface KVNamespace {
    get(key: string, options?: KVNamespaceGetOptions): Promise<string | null>;
    put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
    getMany(keys: string[]): Promise<(string | null)[]>;
    putMany(entries: KVNamespacePutEntry[]): Promise<void>;
  }

  interface KVNamespaceGetOptions {
    type?: 'text' | 'json' | 'arrayBuffer' | 'stream';
    cacheTtl?: number;
  }

  interface KVNamespacePutOptions {
    expiration?: number;
    expirationTtl?: number;
    metadata?: any;
  }

  interface KVNamespaceListOptions {
    limit?: number;
    prefix?: string;
    cursor?: string;
  }

  interface KVNamespaceListResult {
    keys: KVNamespaceListKey[];
    list_complete: boolean;
    cursor?: string;
  }

  interface KVNamespaceListKey {
    name: string;
    expiration?: number;
    metadata?: any;
  }

  interface KVNamespacePutEntry {
    key: string;
    value: string;
    options?: KVNamespacePutOptions;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    exec(query: string): Promise<D1Result>;
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = any>(): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = any>(): Promise<D1Result<T>>;
  }

  interface D1Result<T = any> {
    lastRowId: number | null;
    changes: number;
    duration: number;
    results?: T[];
    success: boolean;
    meta?: any;
  }

  interface EventContext<Env> {
    request: Request;
    env: Env;
    params: any;
    waitUntil: (promise: Promise<any>) => void;
  }
}

export {};



