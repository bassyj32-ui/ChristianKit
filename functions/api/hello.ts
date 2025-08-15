interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  ENVIRONMENT: string;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const { request, env } = context;
  
  try {
    // Check cache first
    const cacheKey = 'hello-response';
    const cached = await env.CACHE.get(cacheKey);
    
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }
    
    // Query D1 database
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
    ).first();
    
    const response = {
      message: 'Hello from Christian Kit API!',
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      database: {
        tables: result?.count || 0
      }
    };
    
    // Cache the response for 5 minutes
    await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
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
  const { request, env } = context;
  
  try {
    // Check cache first
    const cacheKey = 'hello-response';
    const cached = await env.CACHE.get(cacheKey);
    
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
      });
    }
    
    // Query D1 database
    const result = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"'
    ).first();
    
    const response = {
      message: 'Hello from Christian Kit API!',
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      database: {
        tables: result?.count || 0
      }
    };
    
    // Cache the response for 5 minutes
    await env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: 300 });
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', 'X-Cache': 'MISS' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}




