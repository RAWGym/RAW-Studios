'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type StudioProfile = {
  studio_name: string | null
  director_name: string | null
  director_phone: string | null
  legal_name: string | null
  legal_type: string | null
  bin: string | null
  city: string | null
  account_status: string
  card_status: string
  card_visible: boolean
  currency: string | null
  photos: string[] | null
}

export default function AccountPage() {
  const [studio, setStudio] = useState<StudioProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const supabase = createClient()

  const fetchStudio = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/login'); return }
    setUserId(user.id)
    const { data } = await supabase.from('studio_profiles').select('*').eq('user_id', user.id).single()
    setStudio(data)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchStudio()
  }, [fetchStudio])

  const toggleVisibility = async () => {
    if (!studio) return
    setToggling(true)
    const newValue = !studio.card_visible
    await supabase.from('studio_profiles').update({ card_visible: newValue }).eq('user_id', userId)
    setStudio(prev => prev ? { ...prev, card_visible: newValue } : null)
    setToggling(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #C4965A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const initials = (name: string | null) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ST'

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', padding: '0 0 100px' }}>

      <div style={{ background: 'white', padding: '56px 20px 16px', borderBottom: '1px solid rgba(139,115,85,0.1)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: 0 }}>Профиль</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 8px' }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '28px', background: '#E8E2D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '700', color: '#2C2418', marginBottom: '14px', boxShadow: '0 2px 12px rgba(44,36,24,0.1)', overflow: 'hidden' }}>
            {studio?.photos?.[0] ? (
              <img src={studio.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : initials(studio?.studio_name ?? null)}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#2C2418', margin: '0 0 4px' }}>{studio?.studio_name || 'Студия'}</h2>
          <p style={{ fontSize: '13px', color: '#A89880', margin: '0 0 12px' }}>{studio?.city}</p>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: studio?.account_status === 'approved' ? '#EAF3E6' : '#F0E8DC', borderRadius: '99px', padding: '5px 12px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: studio?.account_status === 'approved' ? '#4A7C59' : '#C4965A' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: studio?.account_status === 'approved' ? '#4A7C59' : '#C4965A' }}>
                {studio?.account_status === 'approved' ? 'Верифицирован' : 'На проверке'}
              </span>
            </div>
            {studio?.card_status === 'approved' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: studio?.card_visible ? '#EAF3E6' : '#EDE9E1', borderRadius: '99px', padding: '5px 12px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: studio?.card_visible ? '#4A7C59' : '#A89880' }} />
                <span style={{ fontSize: '11px', fontWeight: '600', color: studio?.card_visible ? '#4A7C59' : '#A89880' }}>
                  {studio?.card_visible ? 'Видна' : 'Скрыта'}
                </span>
              </div>
            )}
          </div>
        </div>

        {studio?.card_status === 'approved' && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '0 0 2px' }}>Видимость в каталоге</p>
                <p style={{ fontSize: '12px', color: '#A89880', margin: 0 }}>
                  {studio.card_visible ? 'Карточка отображается' : 'Карточка скрыта'}
                </p>
              </div>
              <button onClick={toggleVisibility} disabled={toggling}
                style={{ width: '48px', height: '26px', borderRadius: '99px', background: studio.card_visible ? '#2C2418' : '#C9B99A', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', left: studio.card_visible ? '25px' : '3px', transition: 'left 0.2s' }} />
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Юридические данные</p>
          {[
            { label: 'Директор', value: studio?.director_name },
            { label: 'Телефон', value: studio?.director_phone },
            { label: 'Юр. лицо', value: studio?.legal_name },
            { label: 'Форма', value: studio?.legal_type },
            { label: 'БИН/ИНН', value: studio?.bin },
          ].map((item, i) => (
            <div key={item.label} style={{ display: 'flex', gap: '8px', padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(139,115,85,0.08)' : 'none' }}>
              <span style={{ fontSize: '12px', color: '#A89880', width: '80px', flexShrink: 0 }}>{item.label}</span>
              <span style={{ fontSize: '13px', color: '#2C2418', fontWeight: '500' }}>{item.value || '—'}</span>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: '#A89880', margin: '12px 0 0' }}>Для изменения обратитесь в поддержку</p>
        </div>

        <div style={{ background: '#2C2418', borderRadius: '20px', padding: '16px' }}>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Тариф</p>
          <p style={{ fontSize: '16px', fontWeight: '700', color: 'white', margin: '0 0 2px' }}>RAW Studios</p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Бесплатное размещение в каталоге</p>
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); window.location.replace('/login') }}
          style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', border: 'none', cursor: 'pointer', background: 'white', textAlign: 'left', borderRadius: '18px', boxShadow: '0 1px 6px rgba(44,36,24,0.06)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FAECE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C44B2A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: '500', color: '#C44B2A' }}>Выйти из аккаунта</span>
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#C4965A', margin: '4px 0 0', letterSpacing: '0.1em', fontWeight: '500' }}>
          RAW Studios © 2026
        </p>
      </div>
    </div>
  )
}