import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncBitvavoForUser } from '@/lib/bitvavoSync'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // Sécurité : vérifie le secret du cron
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('user_id, api_key, api_secret')
    .eq('exchange', 'bitvavo')

  const results: any[] = []

  for (const k of keys || []) {
    try {
      const result = await syncBitvavoForUser(supabase, k.user_id, k.api_key, k.api_secret)
      results.push({ user_id: k.user_id, ...result })
    } catch (e: any) {
      results.push({ user_id: k.user_id, success: false, error: e.message })
    }
  }

  return NextResponse.json({ synced: results.length, results })
}
