'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  client_name: string | null
  client_phone: string | null
  hall: string | null
  booking_date: string
  start_time: string | null
  end_time: string | null
  duration_hours: number | null
  price: number
  prepayment: number
  status: string
  notes: string | null
}

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
const STATUS_LABELS: Record<string, string> = { pending: 'Ожидает', confirmed: 'Подтверждено', done: 'Завершено', cancelled: 'Отменено' }
const STATUS_COLORS: Record<string, { bg: string; color: string; bar: string }> = {
  pending: { bg: '#F0E8DC', color: '#C4965A', bar: '#C4965A' },
  confirmed: { bg: '#EAF3E6', color: '#4A7C59', bar: '#4A7C59' },
  done: { bg: '#EDE9E1', color: '#7A6B55', bar: '#A89880' },
  cancelled: { bg: '#FAECE7', color: '#C44B2A', bar: '#C44B2A' },
}

export default function BookingsPage() {
  const [studioId, setStudioId] = useState<string | null>(null)
  const [currency, setCurrency] = useState('KZT')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [hall, setHall] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [prepayment, setPrepayment] = useState('')
  const [notes, setNotes] = useState('')

  const supabase = createClient()

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/login'); return }
    const { data: studioData } = await supabase.from('studio_profiles').select('id, currency').eq('user_id', user.id).single()
    if (studioData) {
      setStudioId(studioData.id)
      setCurrency(studioData.currency || 'KZT')
      const { data } = await supabase.from('studio_bookings').select('*').eq('studio_id', studioData.id).order('booking_date', { ascending: true })
      setBookings(data || [])
    }
    setLoading(false)
  }

  const addBooking = async () => {
    if (!clientName.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: studioData } = await supabase.from('studio_profiles').select('id').eq('user_id', user.id).single()
    if (!studioData) return
    setSaving(true)
    const dateStr = selectedDate.toISOString().split('T')[0]
    let endTime = null
    if (startTime && duration) {
      const [h, m] = startTime.split(':').map(Number)
      const endMin = h * 60 + m + parseFloat(duration) * 60
      endTime = `${String(Math.floor(endMin / 60) % 24).padStart(2,'0')}:${String(endMin % 60).padStart(2,'0')}`
    }
    await supabase.from('studio_bookings').insert({
      studio_id: studioData.id,
      client_name: clientName, client_phone: clientPhone || null,
      hall: hall || null, booking_date: dateStr,
      start_time: startTime || null, end_time: endTime,
      duration_hours: duration ? parseFloat(duration) : null,
      price: parseFloat(price) || 0, prepayment: parseFloat(prepayment) || 0,
      notes: notes || null, status: 'pending',
    })
    setClientName(''); setClientPhone(''); setHall('')
    setStartTime(''); setDuration(''); setPrice(''); setPrepayment(''); setNotes('')
    setShowForm(false); setSaving(false)
    fetchData()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('studio_bookings').update({ status }).eq('id', id)
    setSelected(prev => prev ? { ...prev, status } : null)
    fetchData()
  }

  const deleteBooking = async (id: string) => {
    await supabase.from('studio_bookings').delete().eq('id', id)
    setSelected(null); fetchData()
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth()
    const firstDay = new Date(year, month, 1); const lastDay = new Date(year, month + 1, 0)
    const days: (Date | null)[] = []
    let dow = firstDay.getDay(); if (dow === 0) dow = 7
    for (let i = 1; i < dow; i++) days.push(null)
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i))
    return days
  }

  const hasBooking = (date: Date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return bookings.some(b => b.booking_date === `${y}-${m}-${d}`)
  }

  const dayBookings = bookings.filter(b => {
    const [y, m, d] = b.booking_date.split('-').map(Number)
    return y === selectedDate.getFullYear() && m - 1 === selectedDate.getMonth() && d === selectedDate.getDate()
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #C4965A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const sym = currency === 'RUB' ? '₽' : '₸'
  const formatDate = (date: Date) => `${date.getDate()} ${MONTHS[date.getMonth()].toLowerCase()}, ${DAYS[(date.getDay() + 6) % 7].toLowerCase()}`

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', padding: '0 0 100px' }}>

      <div style={{ background: 'white', padding: '56px 20px 16px', borderBottom: '1px solid rgba(139,115,85,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: 0 }}>Брони</h1>
        <button onClick={() => setShowForm(!showForm)}
          style={{ padding: '8px 16px', borderRadius: '12px', border: 'none', background: '#2C2418', color: 'white', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          + Бронь
        </button>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {showForm && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(139,115,85,0.12)' }}>
            {[
              { placeholder: 'Имя клиента *', value: clientName, onChange: setClientName },
              { placeholder: 'Телефон клиента', value: clientPhone, onChange: setClientPhone },
              { placeholder: 'Зал (необязательно)', value: hall, onChange: setHall },
              { placeholder: 'Время начала (14:00)', value: startTime, onChange: setStartTime },
            ].map(field => (
              <input key={field.placeholder} placeholder={field.placeholder} value={field.value} onChange={e => field.onChange(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }} />
            ))}
            <div style={{ position: 'relative' }}>
              <select value={duration} onChange={e => setDuration(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: duration ? '#2C2418' : '#9B8E7E', outline: 'none', appearance: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}>
                <option value="">Длительность</option>
                {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} ч</option>)}
              </select>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9B8E7E" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <input placeholder={`Стоимость (${sym})`} type="number" value={price} onChange={e => setPrice(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }} />
            <input placeholder={`Предоплата (${sym})`} type="number" value={prepayment} onChange={e => setPrepayment(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }} />
            <textarea placeholder="Заметки" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', resize: 'none', boxSizing: 'border-box' as const }} />
            <p style={{ fontSize: '12px', color: '#9B8E7E', margin: 0 }}>Дата: {formatDate(selectedDate)}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addBooking} disabled={saving}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                {saving ? 'Сохраняем...' : 'Сохранить'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#F5F0E8', color: '#9B8E7E', fontSize: '14px', cursor: 'pointer' }}>
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Календарь */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(139,115,85,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5F0E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#7A6B55' }}>‹</button>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: 0 }}>{MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</p>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5F0E8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#7A6B55' }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '11px', color: '#A89880', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {getDaysInMonth(currentMonth).map((day, i) => {
              if (!day) return <div key={i} />
              const isSelected = selectedDate.toDateString() === day.toDateString()
              const isToday = new Date().toDateString() === day.toDateString()
              const hasB = hasBooking(day)
              return (
                <button key={i} onClick={() => setSelectedDate(day)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: isToday ? '700' : '400', background: isSelected ? '#2C2418' : 'transparent', color: isSelected ? 'white' : '#2C2418', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '0 auto' }}>
                  {day.getDate()}
                  {hasB && <span style={{ position: 'absolute', bottom: '3px', width: '4px', height: '4px', borderRadius: '50%', background: isSelected ? 'white' : '#C4965A' }} />}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: 0 }}>{formatDate(selectedDate)}</p>
          <p style={{ fontSize: '12px', color: '#A89880', margin: 0 }}>{dayBookings.length} броней</p>
        </div>

        {dayBookings.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', border: '1px solid rgba(139,115,85,0.1)' }}>
            <p style={{ fontSize: '13px', color: '#A89880', margin: 0 }}>Нет броней на этот день</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dayBookings.map(booking => {
              const sc = STATUS_COLORS[booking.status] || STATUS_COLORS.pending
              return (
                <div key={booking.id} onClick={() => setSelected(booking)}
                  style={{ background: 'white', borderRadius: '16px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', border: '1px solid rgba(139,115,85,0.1)' }}>
                  <div style={{ width: '4px', height: '40px', borderRadius: '99px', background: sc.bar, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.client_name || 'Клиент'}</p>
                    <p style={{ fontSize: '11px', color: '#A89880', margin: 0 }}>{booking.start_time?.slice(0,5)}{booking.end_time ? ` — ${booking.end_time.slice(0,5)}` : ''}{booking.hall ? ` · ${booking.hall}` : ''}</p>
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

      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#FAF8F5', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{selected.client_name}</h2>
              <button onClick={() => setSelected(null)} style={{ background: '#EDE9E1', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div style={{ background: 'white', borderRadius: '16px', padding: '14px', marginBottom: '12px', border: '1px solid rgba(139,115,85,0.12)' }}>
              {[
                { label: 'Дата', value: (() => { const [y,m,d] = selected.booking_date.split('-').map(Number); return `${d} ${MONTHS[m-1]} ${y}` })() },
                { label: 'Время', value: selected.start_time ? `${selected.start_time.slice(0,5)}${selected.end_time ? ` — ${selected.end_time.slice(0,5)}` : ''}` : '—' },
                { label: 'Зал', value: selected.hall || '—' },
                { label: 'Телефон', value: selected.client_phone || '—' },
                { label: 'Стоимость', value: `${selected.price.toLocaleString()} ${sym}` },
                { label: 'Предоплата', value: selected.prepayment > 0 ? `${selected.prepayment.toLocaleString()} ${sym}` : '—' },
                { label: 'Заметки', value: selected.notes || '—' },
              ].map((item, i) => (
                <div key={item.label} style={{ display: 'flex', gap: '8px', padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(139,115,85,0.08)' : 'none' }}>
                  <span style={{ fontSize: '12px', color: '#A89880', width: '80px', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontSize: '13px', color: '#2C2418', fontWeight: '500' }}>{item.value}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#A89880', margin: '0 0 8px' }}>СТАТУС</p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => updateStatus(selected.id, key)}
                  style={{ padding: '8px 14px', borderRadius: '99px', border: `2px solid ${selected.status === key ? STATUS_COLORS[key].bar : 'transparent'}`, background: selected.status === key ? STATUS_COLORS[key].bg : '#F5F0E8', color: selected.status === key ? STATUS_COLORS[key].color : '#7A6B55', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => deleteBooking(selected.id)}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#FAECE7', color: '#C44B2A', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Удалить бронь
            </button>
          </div>
        </>
      )}
    </div>
  )
}