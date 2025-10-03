/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GA4_MEASUREMENT_ID?: string
  readonly VITE_PADDLE_VENDOR_ID?: string
  readonly VITE_PADDLE_VENDOR_AUTH_CODE?: string
  readonly VITE_PADDLE_PUBLIC_KEY?: string
  readonly VITE_PADDLE_ENVIRONMENT?: string
  readonly VITE_VAPID_PUBLIC_KEY?: string
  readonly VITE_BREVO_API_KEY?: string
  readonly VITE_TIMEZONE_API_KEY?: string
  readonly VITE_OPENCAGE_API_KEY?: string
  readonly VITE_ESV_API_KEY?: string
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}










