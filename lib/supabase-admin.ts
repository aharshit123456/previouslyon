
import { createClient } from '@supabase/supabase-js';

// Access environment variables directly to avoid build-time issues if not using Next.js specific env loader yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// WARNING: Use this only in server-side API routes. Never expose to client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); // Fallback for now if key missing to avoid crash, but won't bypass RLS
