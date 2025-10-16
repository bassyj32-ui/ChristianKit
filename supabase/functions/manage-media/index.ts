import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaUpdateRequest {
  mediaId: string
  altText?: string
  description?: string
  isPublic?: boolean
}

interface MediaDeleteRequest {
  mediaId: string
  bucket: string
  filePath: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'update':
        return await handleUpdateMedia(req, supabaseClient, user.id)
      case 'delete':
        return await handleDeleteMedia(req, supabaseClient, user.id)
      case 'list':
        return await handleListMedia(req, supabaseClient, user.id)
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use ?action=update, ?action=delete, or ?action=list' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleUpdateMedia(req: Request, supabaseClient: any, userId: string) {
  try {
    const body: MediaUpdateRequest = await req.json()
    const { mediaId, altText, description, isPublic } = body

    if (!mediaId) {
      return new Response(
        JSON.stringify({ error: 'mediaId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update media metadata
    const { data: updateResult, error: updateError } = await supabaseClient
      .rpc('update_media_metadata', {
        p_media_id: mediaId,
        p_alt_text: altText,
        p_description: description,
        p_is_public: isPublic
      })

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to update media', details: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { updated: updateResult }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleDeleteMedia(req: Request, supabaseClient: any, userId: string) {
  try {
    const body: MediaDeleteRequest = await req.json()
    const { mediaId, bucket, filePath } = body

    if (!mediaId || !bucket || !filePath) {
      return new Response(
        JSON.stringify({ error: 'mediaId, bucket, and filePath are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Delete from storage
    const { error: storageError } = await supabaseClient.storage
      .from(bucket)
      .remove([filePath])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database (this will cascade)
    const { error: dbError } = await supabaseClient
      .from('media_files')
      .delete()
      .eq('id', mediaId)
      .eq('user_id', userId)

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'Failed to delete media record', details: dbError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { deleted: true }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}

async function handleListMedia(req: Request, supabaseClient: any, userId: string) {
  try {
    const url = new URL(req.url)
    const fileType = url.searchParams.get('fileType')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    let query = supabaseClient
      .from('media_files')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fileType) {
      query = query.eq('file_type', fileType)
    }

    const { data: mediaFiles, error: mediaError } = await query

    if (mediaError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch media', details: mediaError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Add public URLs to each media file
    const mediaWithUrls = await Promise.all(
      (mediaFiles || []).map(async (media: any) => {
        const { data: publicUrlData } = supabaseClient.storage
          .from(media.bucket_name)
          .getPublicUrl(media.file_path)

        return {
          ...media,
          publicUrl: publicUrlData.publicUrl
        }
      })
    )

    return new Response(
      JSON.stringify({
        success: true,
        data: mediaWithUrls,
        pagination: {
          limit,
          offset,
          hasMore: mediaWithUrls.length === limit
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request parameters' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}










