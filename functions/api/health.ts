interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { env } = context;
  
  try {
    const startTime = Date.now();
    
    // Check database health
    let dbHealth;
    try {
      const result = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
      ).first<{ count: number }>();
      dbHealth = { status: 'healthy', tables: result?.count || 0 };
    } catch (error) {
      dbHealth = { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Check cache health
    let cacheHealth;
    try {
      const testKey = 'health-check';
      const testValue = { status: 'ok', timestamp: new Date().toISOString() };
      
      await env.CACHE.put(testKey, JSON.stringify(testValue), { expirationTtl: 60 });
      const retrieved = await env.CACHE.get(testKey);
      
      if (retrieved) {
        await env.CACHE.delete(testKey);
        cacheHealth = { status: 'healthy' };
      } else {
        cacheHealth = { status: 'unhealthy', error: 'Cache read/write failed' };
      }
    } catch (error) {
      cacheHealth = { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        cache: cacheHealth
      },
      overall: dbHealth.status === 'healthy' && cacheHealth.status === 'healthy' ? 'healthy' : 'degraded'
    };
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 503;
    
    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}




  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { env } = context;
  
  try {
    const startTime = Date.now();
    
    // Check database health
    let dbHealth;
    try {
      const result = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
      ).first<{ count: number }>();
      dbHealth = { status: 'healthy', tables: result?.count || 0 };
    } catch (error) {
      dbHealth = { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Check cache health
    let cacheHealth;
    try {
      const testKey = 'health-check';
      const testValue = { status: 'ok', timestamp: new Date().toISOString() };
      
      await env.CACHE.put(testKey, JSON.stringify(testValue), { expirationTtl: 60 });
      const retrieved = await env.CACHE.get(testKey);
      
      if (retrieved) {
        await env.CACHE.delete(testKey);
        cacheHealth = { status: 'healthy' };
      } else {
        cacheHealth = { status: 'unhealthy', error: 'Cache read/write failed' };
      }
    } catch (error) {
      cacheHealth = { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT,
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        cache: cacheHealth
      },
      overall: dbHealth.status === 'healthy' && cacheHealth.status === 'healthy' ? 'healthy' : 'degraded'
    };
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 503;
    
    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      status: 'error',
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}




