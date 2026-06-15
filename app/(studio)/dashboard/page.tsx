'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type StudioProfile = {
  id: string
  studio_name: string | null
  city: string | null
  address: string | null
  account_status: string
  card_status: string
  currency: string | null
  photos: string[] | null
  moderation_note: string | null
}

type Booking = {
  id: string
  client_name: string | null
  hall: string | null
  booking_date: string
  start_time: string | null
  end_time: string | null
  duration_hours: number | null
  price: number
  status: string
}

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const STATUS_COLORS: Record<string, { bg: string; color: string; bar: string }> = {
  pending: { bg: '#F0E8DC', color: '#C4965A', bar: '#C4965A' },
  confirmed: { bg: '#EAF3E6', color: '#4A7C59', bar: '#4A7C59' },
  done: { bg: '#EDE9E1', color: '#7A6B55', bar: '#A89880' },
  cancelled: { bg: '#FAECE7', color: '#C44B2A', bar: '#C44B2A' },
}
const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', confirmed: 'Подтверждено', done: 'Завершено', cancelled: 'Отменено' }

export default function DashboardPage() {
  const [studio, setStudio] = useState<StudioProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/login'); return }
    const { data: studioData } = await supabase.from('studio_profiles').select('*').eq('user_id', user.id).single()
    setStudio(studioData)
    if (studioData) {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
      const { data: bookingsData } = await supabase.from('studio_bookings').select('*').eq('studio_id', studioData.id).gte('booking_date', firstDay).lte('booking_date', lastDay).order('booking_date', { ascending: true })
      setBookings(bookingsData || [])
    }
    setLoading(false)
  }

  const submitCard = async () => {
    if (!studio) return
    await supabase.from('studio_profiles').update({ card_status: 'pending', submitted_at: new Date().toISOString() }).eq('id', studio.id)
    fetchData()
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #C4965A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const sym = studio?.currency === 'RUB' ? '₽' : '₸'
  const accountStatus = studio?.account_status || 'pending'
  const cardStatus = studio?.card_status || 'draft'
  const now = new Date()
  const monthName = MONTHS[now.getMonth()]

  const totalBookings = bookings.length
  const uniqueClients = new Set(bookings.map(b => b.client_name).filter(Boolean)).size
  const totalIncome = bookings.filter(b => b.status === 'done').reduce((s, b) => s + b.price, 0)
  const totalHours = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.duration_hours || 0), 0)

  const upcomingBookings = bookings.filter(b => {
    const [y, m, d] = b.booking_date.split('-').map(Number)
    return new Date(y, m - 1, d) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()) && b.status !== 'cancelled'
  }).slice(0, 5)

  const initials = (name: string | null) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'ST'

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', padding: '0 0 24px' }}>

      {/* Шапка */}
      <div style={{ background: 'white', padding: '56px 20px 16px', borderBottom: '1px solid rgba(139,115,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {studio?.photos?.[0] ? (
            <img src={studio.photos[0]} alt="" style={{ width: '36px', height: '36px', borderRadius: '10px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#2C2418', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', color: 'white' }}>
              {initials(studio?.studio_name ?? null)}
            </div>
          )}
          <div>
            <p style={{ fontSize: '15px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{studio?.studio_name || 'Студия'}</p>
            <p style={{ fontSize: '11px', color: '#A89880', margin: 0 }}>{studio?.city}</p>
          </div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', borderRadius: '99px', padding: '5px 12px', background: accountStatus === 'approved' ? '#EAF3E6' : '#F0E8DC' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accountStatus === 'approved' ? '#4A7C59' : '#C4965A' }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: accountStatus === 'approved' ? '#4A7C59' : '#C4965A' }}>
            {accountStatus === 'approved' ? 'Верифицирован' : 'На проверке'}
          </span>
        </div>
      </div>

      <div style={{ padding: '20px' }}>

        {/* Статусные сообщения */}
        {accountStatus === 'pending' && (
          <div style={{ background: '#F0E8DC', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6B3D" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
            </svg>
            <p style={{ fontSize: '13px', color: '#8B6B3D', margin: 0, lineHeight: '1.5' }}>
              Аккаунт на проверке — обычно до 24 часов. После верификации заполните карточку.
            </p>
          </div>
        )}

        {accountStatus === 'approved' && cardStatus === 'draft' && (
          <div style={{ background: '#EAF3E6', borderRadius: '16px', padding: '14px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <p style={{ fontSize: '13px', color: '#4A7C59', margin: 0, fontWeight: '500' }}>Аккаунт верифицирован! Заполните карточку студии.</p>
          </div>
        )}

        {accountStatus === 'approved' && cardStatus === 'approved' && (
          <div style={{ background: '#EAF3E6', borderRadius: '16px', padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A7C59" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <p style={{ fontSize: '12px', color: '#4A7C59', margin: 0 }}>Студия опубликована в каталоге RAW</p>
          </div>
        )}

        {/* Статистика */}
        {accountStatus === 'approved' && (
          <>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#A89880', margin: '0 0 12px', letterSpacing: '0.05em' }}>{monthName.toUpperCase()} {now.getFullYear()}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Броней', value: totalBookings, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6B3D" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
                { label: 'Клиентов', value: uniqueClients, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6B3D" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
                { label: 'Доход', value: totalIncome > 0 ? `${totalIncome >= 1000 ? Math.round(totalIncome/1000) + 'K' : totalIncome} ${sym}` : `0 ${sym}`, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6B3D" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                { label: 'Часов', value: totalHours, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B6B3D" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '14px', border: '1px solid rgba(139,115,85,0.1)', boxShadow: '0 1px 6px rgba(44,36,24,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    {s.icon}<span style={{ fontSize: '11px', color: '#A89880' }}>{s.label}</span>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Ближайшие брони */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: 0 }}>Ближайшие брони</p>
                <button onClick={() => router.push('/bookings')} style={{ fontSize: '12px', color: '#C4965A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Все →</button>
              </div>
              {upcomingBookings.length === 0 ? (
                <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid rgba(139,115,85,0.1)' }}>
                  <p style={{ fontSize: '13px', color: '#A89880', margin: '0 0 12px' }}>Броней пока нет</p>
                  <button onClick={() => router.push('/bookings')} style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#2C2418', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>Добавить бронь</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {upcomingBookings.map(booking => {
                    const [y, m, d] = booking.booking_date.split('-').map(Number)
                    const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
                    return (
                      <div key={booking.id} style={{ background: 'white', borderRadius: '16px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(139,115,85,0.1)' }}>
                        <div style={{ textAlign: 'center', minWidth: '36px' }}>
                          <p style={{ fontSize: '18px', fontWeight: '700', color: '#2C2418', margin: 0, lineHeight: 1 }}>{d}</p>
                          <p style={{ fontSize: '10px', color: '#A89880', margin: '2px 0 0', textTransform: 'uppercase' }}>{MONTHS[m-1].slice(0,3)}</p>
                        </div>
                        <div style={{ width: '1px', height: '36px', background: 'rgba(139,115,85,0.15)' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.client_name || 'Клиент'}</p>
                          <p style={{ fontSize: '11px', color: '#A89880', margin: 0 }}>{booking.start_time?.slice(0,5)}{booking.hall ? ` · ${booking.hall}` : ''}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 4px' }}>{booking.price.toLocaleString()} {sym}</p>
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: sc.bg, color: sc.color, fontWeight: '500' }}>{STATUS_LABELS[booking.status]}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Быстрые действия */}
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Быстрые действия</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Новая бронь', sub: 'Добавить клиента', href: '/bookings', color: '#2C2418', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg> },
                { label: 'Карточка', sub: 'Редактировать', href: '/studio', color: '#C4965A', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
              ].map((item, i) => (
                <button key={i} onClick={() => router.push(item.href)}
                  style={{ padding: '16px', borderRadius: '16px', border: 'none', background: item.color, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>{item.icon}</div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'white', margin: '0 0 2px' }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{item.sub}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Заполненность если не одобрена */}
        {accountStatus === 'approved' && cardStatus !== 'approved' && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', marginTop: '16px', boxShadow: '0 1px 8px rgba(44,36,24,0.06)' }}>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Следующий шаг</p>
            {cardStatus === 'draft' && (
              <button onClick={() => router.push('/studio')}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                Заполнить карточку →
              </button>
            )}
            {cardStatus === 'pending' && (
              <p style={{ fontSize: '13px', color: '#C4965A', margin: 0, textAlign: 'center' }}>Карточка на модерации — ждите подтверждения</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}