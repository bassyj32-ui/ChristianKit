#!/bin/bash

# =================================================================
# SUPABASE EDGE FUNCTIONS DEPLOYMENT SCRIPT
# =================================================================
# This script deploys the media management edge functions to Supabase

echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're in the project root
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in project root. Please run this script from your project root directory."
    exit 1
fi

echo "📦 Deploying upload-media function..."
supabase functions deploy upload-media --project-ref hrznuhcwdjnpasfnqqwp

if [ $? -eq 0 ]; then
    echo "✅ upload-media function deployed successfully"
else
    echo "❌ Failed to deploy upload-media function"
    exit 1
fi

echo "📦 Deploying manage-media function..."
supabase functions deploy manage-media --project-ref hrznuhcwdjnpasfnqqwp

if [ $? -eq 0 ]; then
    echo "✅ manage-media function deployed successfully"
else
    echo "❌ Failed to deploy manage-media function"
    exit 1
fi

echo ""
echo "🎉 Edge functions deployed successfully!"
echo ""
echo "🔗 Function URLs:"
echo "   upload-media: https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/upload-media"
echo "   manage-media: https://hrznuhcwdjnpasfnqqwp.supabase.co/functions/v1/manage-media"
echo ""
echo "📝 Next steps:"
echo "   1. Test the functions with your frontend"
echo "   2. Set up environment variables if needed"
echo "   3. Configure CORS if accessing from web"
echo ""
echo "✅ Deployment complete!"










