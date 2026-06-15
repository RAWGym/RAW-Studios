'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  price: number
  status: string
  booking_date: string
  duration_hours: number | null
  client_name: string | null
}

const MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

export default function StatsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currency, setCurrency] = useState('KZT')

  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: studioData } = await supabase.from('studio_profiles').select('id, currency').eq('user_id', user.id).single()
    if (studioData) {
      setCurrency(studioData.currency || 'KZT')
      const { data } = await supabase.from('studio_bookings').select('*').eq('studio_id', studioData.id)
      setBookings(data || [])
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #C4965A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const sym = currency === 'RUB' ? '₽' : '₸'
  const now = new Date()

  // Статистика за текущий месяц
  const thisMonthBookings = bookings.filter(b => {
    const [y, m] = b.booking_date.split('-').map(Number)
    return y === now.getFullYear() && m - 1 === now.getMonth()
  })
  const lastMonthBookings = bookings.filter(b => {
    const [y, m] = b.booking_date.split('-').map(Number)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    return y === lastMonth.getFullYear() && m - 1 === lastMonth.getMonth()
  })

  const thisMonthIncome = thisMonthBookings.filter(b => b.status === 'done').reduce((s, b) => s + b.price, 0)
  const lastMonthIncome = lastMonthBookings.filter(b => b.status === 'done').reduce((s, b) => s + b.price, 0)
  const incomeGrowth = lastMonthIncome > 0 ? Math.round((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0

  const thisMonthHours = thisMonthBookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.duration_hours || 0), 0)
  const uniqueClients = new Set(bookings.map(b => b.client_name).filter(Boolean)).size

  // Доход по последним 6 месяцам
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthBookings = bookings.filter(b => {
      const [y, m] = b.booking_date.split('-').map(Number)
      return y === date.getFullYear() && m - 1 === date.getMonth()
    })
    return {
      month: MONTHS[date.getMonth()],
      income: monthBookings.filter(b => b.status === 'done').reduce((s, b) => s + b.price, 0),
      count: monthBookings.length,
    }
  })

  const maxIncome = Math.max(...monthlyData.map(d => d.income), 1)

  const statusStats = [
    { label: 'Ожидает', count: bookings.filter(b => b.status === 'pending').length, color: '#C4965A', bg: '#F0E8DC' },
    { label: 'Подтверждено', count: bookings.filter(b => b.status === 'confirmed').length, color: '#4A7C59', bg: '#EAF3E6' },
    { label: 'Завершено', count: bookings.filter(b => b.status === 'done').length, color: '#7A6B55', bg: '#EDE9E1' },
    { label: 'Отменено', count: bookings.filter(b => b.status === 'cancelled').length, color: '#C44B2A', bg: '#FAECE7' },
  ]

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', padding: '0 0 100px' }}>

      <div style={{ background: 'white', padding: '56px 20px 16px', borderBottom: '1px solid rgba(139,115,85,0.1)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: 0 }}>Статистика</h1>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Главные цифры */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Доход за месяц', value: `${thisMonthIncome >= 1000 ? Math.round(thisMonthIncome/1000) + 'K' : thisMonthIncome} ${sym}`, sub: incomeGrowth !== 0 ? `${incomeGrowth > 0 ? '+' : ''}${incomeGrowth}% к прошлому` : 'нет данных', subColor: incomeGrowth >= 0 ? '#4A7C59' : '#C44B2A' },
            { label: 'Броней за месяц', value: String(thisMonthBookings.length), sub: `Всего: ${bookings.length}`, subColor: '#A89880' },
            { label: 'Часов занято', value: String(thisMonthHours), sub: 'за этот месяц', subColor: '#A89880' },
            { label: 'Клиентов', value: String(uniqueClients), sub: 'всего уникальных', subColor: '#A89880' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '16px', padding: '14px', border: '1px solid rgba(139,115,85,0.1)' }}>
              <p style={{ fontSize: '11px', color: '#A89880', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: '0 0 4px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: s.subColor, margin: 0 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* График дохода */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.1)' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 16px' }}>Доход по месяцам</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '100px', marginBottom: '8px' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '100%', borderRadius: '6px 6px 0 0', background: i === monthlyData.length - 1 ? '#2C2418' : '#E8E2D9', height: `${Math.max((d.income / maxIncome) * 80, d.income > 0 ? 8 : 2)}px`, transition: 'height 0.3s' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {monthlyData.map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#A89880', margin: 0 }}>{d.month}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Статусы броней */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.1)' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Статусы броней</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {statusStats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#7A6B55', width: '100px', flexShrink: 0 }}>{s.label}</span>
                <div style={{ flex: 1, height: '6px', borderRadius: '99px', background: '#F5F0E8' }}>
                  <div style={{ height: '6px', borderRadius: '99px', background: s.color, width: `${bookings.length > 0 ? (s.count / bookings.length) * 100 : 0}%` }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: s.color, width: '24px', textAlign: 'right' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}