import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UploadRequest {
  file: File
  bucket: string
  userId: string
  fileType: 'avatar' | 'banner' | 'post_image' | 'post_video' | 'document'
  altText?: string
  description?: string
  makePublic?: boolean
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const fileType = formData.get('fileType') as UploadRequest['fileType']
    const altText = formData.get('altText') as string
    const description = formData.get('description') as string
    const makePublic = formData.get('makePublic') === 'true'

    if (!file || !bucket || !fileType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, bucket, fileType' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate bucket
    const allowedBuckets = ['avatars', 'post-media', 'private-docs', 'banners']
    if (!allowedBuckets.includes(bucket)) {
      return new Response(
        JSON.stringify({ error: 'Invalid bucket name' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = `${timestamp}_${randomId}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Convert File to Uint8Array for upload
    const fileBuffer = await file.arrayBuffer()
    const fileArray = new Uint8Array(fileBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, fileArray, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get file size
    const fileSize = file.size

    // Create media record in database
    const { data: mediaRecord, error: mediaError } = await supabaseClient
      .rpc('create_media_record', {
        p_user_id: user.id,
        p_bucket_name: bucket,
        p_file_path: filePath,
        p_file_name: file.name,
        p_file_size: fileSize,
        p_mime_type: file.type,
        p_file_type: fileType,
        p_alt_text: altText || null,
        p_description: description || null,
        p_is_public: makePublic
      })

    if (mediaError) {
      console.error('Media record error:', mediaError)
      // Don't fail the upload if media record creation fails
      console.warn('Continuing without media record')
    }

    // Generate public URL
    const { data: publicUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath)

    // Process images if it's an image file
    let thumbnailUrl = null
    if (file.type.startsWith('image/') && fileType !== 'document') {
      try {
        // Generate thumbnail (simplified version)
        thumbnailUrl = await generateThumbnail(supabaseClient, bucket, filePath, fileName)
      } catch (thumbnailError) {
        console.warn('Thumbnail generation failed:', thumbnailError)
      }
    }

    const response = {
      success: true,
      data: {
        filePath,
        fileName,
        fileSize,
        mimeType: file.type,
        publicUrl: publicUrlData.publicUrl,
        thumbnailUrl,
        mediaId: mediaRecord,
        uploadedAt: new Date().toISOString()
      }
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Simplified thumbnail generation (you can enhance this)
async function generateThumbnail(supabaseClient: any, bucket: string, originalPath: string, fileName: string) {
  try {
    // For now, just return the original URL as thumbnail
    // In a real implementation, you would:
    // 1. Download the image
    // 2. Resize it using a library like sharp
    // 3. Upload the thumbnail to a thumbnails bucket
    // 4. Return the thumbnail URL

    const { data: thumbnailUrlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(originalPath)

    return thumbnailUrlData.publicUrl
  } catch (error) {
    console.error('Thumbnail generation error:', error)
    return null
  }
}










