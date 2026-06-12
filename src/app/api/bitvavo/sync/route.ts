import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { syncBitvavoForUser } from '@/lib/bitvavoSync'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { api_key, api_secret } = await req.json()
    if (!api_key || !api_secret) return NextResponse.json({ error: 'Clés manquantes' }, { status: 400 })

    const result = await syncBitvavoForUser(supabase, user.id, api_key, api_secret)
    if (!result.success) return NextResponse.json(result, { status: 400 })

    // Sauvegarde les clés pour le cron auto
    await supabase.from('api_keys').upsert({
      user_id: user.id, exchange: 'bitvavo', api_key, api_secret
    })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
