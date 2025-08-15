export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  user_id: number;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export class DatabaseService {
  constructor(private db: D1Database) {}

  // User operations
  async getUserById(id: number): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    return result || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
    return result || null;
  }

  async createUser(email: string, name: string): Promise<User> {
    const result = await this.db
      .prepare('INSERT INTO users (email, name) VALUES (?, ?) RETURNING *')
      .bind(email, name)
      .first<User>();
    
    if (!result) {
      throw new Error('Failed to create user');
    }
    
    return result;
  }

  // Project operations
  async getProjectsByUserId(userId: number): Promise<Project[]> {
    const result = await this.db
      .prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC')
      .bind(userId)
      .all<Project>();
    return result.results || [];
  }

  async createProject(userId: number, name: string, description?: string): Promise<Project> {
    const result = await this.db
      .prepare('INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?) RETURNING *')
      .bind(userId, name, description || null)
      .first<Project>();
    
    if (!result) {
      throw new Error('Failed to create project');
    }
    
    return result;
  }

  // Settings operations
  async getUserSetting(userId: number, key: string): Promise<string | null> {
    const result = await this.db
      .prepare('SELECT value FROM settings WHERE user_id = ? AND key = ?')
      .bind(userId, key)
      .first<{ value: string }>();
    return result?.value || null;
  }

  async setUserSetting(userId: number, key: string, value: string): Promise<void> {
    await this.db
      .prepare(`
        INSERT INTO settings (user_id, key, value) 
        VALUES (?, ?, ?) 
        ON CONFLICT(user_id, key) 
        DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
      `)
      .bind(userId, key, value, value);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; tables: number }> {
    const result = await this.db
      .prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"')
      .first<{ count: number }>();
    
    return {
      status: 'healthy',
      tables: result?.count || 0
    };
  }
}
