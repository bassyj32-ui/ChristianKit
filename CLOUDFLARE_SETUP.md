# Cloudflare Integration Setup Guide

This guide will walk you through setting up Cloudflare integration for your Christian Kit project, including Pages deployment, D1 database, and KV storage.

## 🚀 **Prerequisites**

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install the Cloudflare CLI tool
3. **Node.js**: Version 18+ (already configured in your project)

## 📦 **Install Wrangler CLI**

```bash
npm install -g wrangler
```

## 🔐 **Authenticate with Cloudflare**

```bash
wrangler login
```

This will open your browser to authenticate with your Cloudflare account.

## 🗄️ **Set up D1 Database**

### 1. Create D1 Database

```bash
wrangler d1 create christian-kit-db
```

This will output something like:
```
✅ Successfully created DB 'christian-kit-db' in region APAC
Created database 'christian-kit-db' (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```

### 2. Update wrangler.toml

Replace `your-database-id-here` in `wrangler.toml` with the actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "christian-kit-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Your actual ID here
```

### 3. Initialize Database Schema

```bash
wrangler d1 execute christian-kit-db --file=./database/schema.sql
```

### 4. Test Database Connection

```bash
wrangler d1 execute christian-kit-db --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
```

## 💾 **Set up KV Storage**

### 1. Create KV Namespace

```bash
wrangler kv:namespace create "christian-kit-cache"
```

This will output something like:
```
✅ Created namespace with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 2. Create Preview Namespace

```bash
wrangler kv:namespace create "christian-kit-cache" --preview
```

This will output something like:
```
✅ Created namespace with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Update wrangler.toml

Replace the KV namespace IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"                    # Production namespace
preview_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"            # Preview namespace
```

## 🌐 **Set up Cloudflare Pages**

### 1. Create Pages Project

```bash
wrangler pages project create christian-kit
```

### 2. Configure Build Settings

The build settings are already configured in your `wrangler.toml`:

```toml
[build]
command = "npm run build"
cwd = "."

[pages]
directory = "dist"
```

## 🔧 **Environment Variables**

### 1. Set Production Variables

```bash
wrangler pages secret put ENVIRONMENT --project-name=christian-kit
# Enter: production
```

### 2. Set Staging Variables

```bash
wrangler pages secret put ENVIRONMENT --project-name=christian-kit-staging
# Enter: staging
```

## 🚀 **Deployment**

### 1. Test Build Locally

```bash
npm run build
```

### 2. Deploy to Staging

```bash
# Using the deployment script
./scripts/deploy.sh staging

# Or manually
wrangler pages deploy dist --project-name=christian-kit-staging --env=staging
```

### 3. Deploy to Production

```bash
# Using the deployment script
./scripts/deploy.sh production

# Or manually
wrangler pages deploy dist --project-name=christian-kit-prod --env=production
```

## 🧪 **Testing Integration**

### 1. Test API Endpoints

After deployment, test your API endpoints:

```bash
# Health check
curl https://christian-kit-staging.pages.dev/api/health

# Hello endpoint
curl https://christian-kit-staging.pages.dev/api/hello
```

### 2. Verify Database Connection

The health endpoint should return:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "staging",
  "responseTime": "50ms",
  "services": {
    "database": {
      "status": "healthy",
      "tables": 3
    },
    "cache": {
      "status": "healthy"
    }
  },
  "overall": "healthy"
}
```

### 3. Test Caching

Make multiple requests to the hello endpoint and verify that the `X-Cache` header changes from `MISS` to `HIT`.

## 📊 **Monitoring and Debugging**

### 1. View Logs

```bash
wrangler pages deployment tail --project-name=christian-kit-staging
```

### 2. Check Database

```bash
wrangler d1 execute christian-kit-db --command="SELECT * FROM users"
```

### 3. Check KV Storage

```bash
wrangler kv:key get --namespace-id=your-namespace-id "health-check"
```

## 🔒 **Security Considerations**

### 1. Environment Variables

- Never commit sensitive data to version control
- Use Cloudflare Pages secrets for sensitive configuration
- Consider using different database instances for staging/production

### 2. Database Access

- D1 databases are automatically isolated per environment
- Use prepared statements to prevent SQL injection
- Implement proper authentication and authorization

### 3. KV Storage

- KV data is automatically encrypted at rest
- Use appropriate TTL values for cached data
- Implement cache invalidation strategies

## 🚨 **Troubleshooting**

### Common Issues

1. **Database Connection Failed**
   - Verify database ID in `wrangler.toml`
   - Check if database exists: `wrangler d1 list`
   - Ensure schema is initialized

2. **KV Storage Errors**
   - Verify namespace IDs in `wrangler.toml`
   - Check namespace exists: `wrangler kv:namespace list`
   - Ensure proper binding names

3. **Deployment Failures**
   - Check build output: `npm run build`
   - Verify `dist` directory exists
   - Check Wrangler authentication: `wrangler whoami`

4. **API Endpoints Not Working**
   - Verify function files are in `functions/api/` directory
   - Check function syntax and exports
   - Verify environment bindings in `wrangler.toml`

### Getting Help

- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **Wrangler CLI**: `wrangler --help`
- **Community**: [community.cloudflare.com](https://community.cloudflare.com)

## 📝 **Next Steps**

After successful Cloudflare integration:

1. **Customize Database Schema**: Modify `database/schema.sql` for your needs
2. **Add More API Endpoints**: Create additional functions in `functions/api/`
3. **Implement Authentication**: Add user authentication and authorization
4. **Set up Monitoring**: Configure alerts and monitoring for production
5. **Optimize Performance**: Implement caching strategies and database optimization

## ✅ **Verification Checklist**

- [ ] Wrangler CLI installed and authenticated
- [ ] D1 database created and schema initialized
- [ ] KV namespace created and configured
- [ ] Cloudflare Pages project created
- [ ] Environment variables configured
- [ ] Staging deployment successful
- [ ] API endpoints responding correctly
- [ ] Database connection verified
- [ ] Caching working properly
- [ ] Production deployment ready

Your Christian Kit project is now fully integrated with Cloudflare's edge computing platform! 🎉





This guide will walk you through setting up Cloudflare integration for your Christian Kit project, including Pages deployment, D1 database, and KV storage.

## 🚀 **Prerequisites**

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Wrangler CLI**: Install the Cloudflare CLI tool
3. **Node.js**: Version 18+ (already configured in your project)

## 📦 **Install Wrangler CLI**

```bash
npm install -g wrangler
```

## 🔐 **Authenticate with Cloudflare**

```bash
wrangler login
```

This will open your browser to authenticate with your Cloudflare account.

## 🗄️ **Set up D1 Database**

### 1. Create D1 Database

```bash
wrangler d1 create christian-kit-db
```

This will output something like:
```
✅ Successfully created DB 'christian-kit-db' in region APAC
Created database 'christian-kit-db' (ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```

### 2. Update wrangler.toml

Replace `your-database-id-here` in `wrangler.toml` with the actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "christian-kit-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Your actual ID here
```

### 3. Initialize Database Schema

```bash
wrangler d1 execute christian-kit-db --file=./database/schema.sql
```

### 4. Test Database Connection

```bash
wrangler d1 execute christian-kit-db --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
```

## 💾 **Set up KV Storage**

### 1. Create KV Namespace

```bash
wrangler kv:namespace create "christian-kit-cache"
```

This will output something like:
```
✅ Created namespace with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 2. Create Preview Namespace

```bash
wrangler kv:namespace create "christian-kit-cache" --preview
```

This will output something like:
```
✅ Created namespace with ID "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Update wrangler.toml

Replace the KV namespace IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"                    # Production namespace
preview_id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"            # Preview namespace
```

## 🌐 **Set up Cloudflare Pages**

### 1. Create Pages Project

```bash
wrangler pages project create christian-kit
```

### 2. Configure Build Settings

The build settings are already configured in your `wrangler.toml`:

```toml
[build]
command = "npm run build"
cwd = "."

[pages]
directory = "dist"
```

## 🔧 **Environment Variables**

### 1. Set Production Variables

```bash
wrangler pages secret put ENVIRONMENT --project-name=christian-kit
# Enter: production
```

### 2. Set Staging Variables

```bash
wrangler pages secret put ENVIRONMENT --project-name=christian-kit-staging
# Enter: staging
```

## 🚀 **Deployment**

### 1. Test Build Locally

```bash
npm run build
```

### 2. Deploy to Staging

```bash
# Using the deployment script
./scripts/deploy.sh staging

# Or manually
wrangler pages deploy dist --project-name=christian-kit-staging --env=staging
```

### 3. Deploy to Production

```bash
# Using the deployment script
./scripts/deploy.sh production

# Or manually
wrangler pages deploy dist --project-name=christian-kit-prod --env=production
```

## 🧪 **Testing Integration**

### 1. Test API Endpoints

After deployment, test your API endpoints:

```bash
# Health check
curl https://christian-kit-staging.pages.dev/api/health

# Hello endpoint
curl https://christian-kit-staging.pages.dev/api/hello
```

### 2. Verify Database Connection

The health endpoint should return:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "staging",
  "responseTime": "50ms",
  "services": {
    "database": {
      "status": "healthy",
      "tables": 3
    },
    "cache": {
      "status": "healthy"
    }
  },
  "overall": "healthy"
}
```

### 3. Test Caching

Make multiple requests to the hello endpoint and verify that the `X-Cache` header changes from `MISS` to `HIT`.

## 📊 **Monitoring and Debugging**

### 1. View Logs

```bash
wrangler pages deployment tail --project-name=christian-kit-staging
```

### 2. Check Database

```bash
wrangler d1 execute christian-kit-db --command="SELECT * FROM users"
```

### 3. Check KV Storage

```bash
wrangler kv:key get --namespace-id=your-namespace-id "health-check"
```

## 🔒 **Security Considerations**

### 1. Environment Variables

- Never commit sensitive data to version control
- Use Cloudflare Pages secrets for sensitive configuration
- Consider using different database instances for staging/production

### 2. Database Access

- D1 databases are automatically isolated per environment
- Use prepared statements to prevent SQL injection
- Implement proper authentication and authorization

### 3. KV Storage

- KV data is automatically encrypted at rest
- Use appropriate TTL values for cached data
- Implement cache invalidation strategies

## 🚨 **Troubleshooting**

### Common Issues

1. **Database Connection Failed**
   - Verify database ID in `wrangler.toml`
   - Check if database exists: `wrangler d1 list`
   - Ensure schema is initialized

2. **KV Storage Errors**
   - Verify namespace IDs in `wrangler.toml`
   - Check namespace exists: `wrangler kv:namespace list`
   - Ensure proper binding names

3. **Deployment Failures**
   - Check build output: `npm run build`
   - Verify `dist` directory exists
   - Check Wrangler authentication: `wrangler whoami`

4. **API Endpoints Not Working**
   - Verify function files are in `functions/api/` directory
   - Check function syntax and exports
   - Verify environment bindings in `wrangler.toml`

### Getting Help

- **Cloudflare Docs**: [developers.cloudflare.com](https://developers.cloudflare.com)
- **Wrangler CLI**: `wrangler --help`
- **Community**: [community.cloudflare.com](https://community.cloudflare.com)

## 📝 **Next Steps**

After successful Cloudflare integration:

1. **Customize Database Schema**: Modify `database/schema.sql` for your needs
2. **Add More API Endpoints**: Create additional functions in `functions/api/`
3. **Implement Authentication**: Add user authentication and authorization
4. **Set up Monitoring**: Configure alerts and monitoring for production
5. **Optimize Performance**: Implement caching strategies and database optimization

## ✅ **Verification Checklist**

- [ ] Wrangler CLI installed and authenticated
- [ ] D1 database created and schema initialized
- [ ] KV namespace created and configured
- [ ] Cloudflare Pages project created
- [ ] Environment variables configured
- [ ] Staging deployment successful
- [ ] API endpoints responding correctly
- [ ] Database connection verified
- [ ] Caching working properly
- [ ] Production deployment ready

Your Christian Kit project is now fully integrated with Cloudflare's edge computing platform! 🎉




