'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const COUNTRIES = [
  { code: 'KZ', name: 'Казахстан', prefix: '+7', currency: 'KZT', symbol: '₸' },
  { code: 'RU', name: 'Россия', prefix: '+7', currency: 'RUB', symbol: '₽' },
]

const CITIES: Record<string, string[]> = {
  KZ: ['Алматы', 'Астана', 'Шымкент', 'Актобе', 'Тараз', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Атырау', 'Костанай', 'Уральск', 'Актау'],
  RU: ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань', 'Нижний Новгород', 'Челябинск', 'Самара', 'Уфа', 'Ростов-на-Дону', 'Краснодар', 'Омск'],
}

const LEGAL_TYPES = ['ИП', 'ТОО', 'ООО']

const AGREEMENTS = [
  { id: 'terms', text: 'Я принимаю условия использования сервиса RAW Studios' },
  { id: 'privacy', text: 'Я согласен(а) с политикой конфиденциальности' },
  { id: 'copyright', text: 'Я понимаю, что приложение RAW защищено авторским правом' },
  { id: 'age', text: 'Мне исполнилось 18 лет' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [country, setCountry] = useState('KZ')
  const [city, setCity] = useState('')
  const [citySearch, setCitySearch] = useState('')
  const [studioName, setStudioName] = useState('')
  const [studioAddress, setStudioAddress] = useState('')
  const [studioPhone, setStudioPhone] = useState('')
  const [bin, setBin] = useState('')
  const [legalName, setLegalName] = useState('')
  const [legalType, setLegalType] = useState('')
  const [directorName, setDirectorName] = useState('')
  const [directorPhone, setDirectorPhone] = useState('')
  const [agreements, setAgreements] = useState<Record<string, boolean>>({ terms: false, privacy: false, copyright: false, age: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const allAgreed = Object.values(agreements).every(Boolean)
  const selectedCountry = COUNTRIES.find(c => c.code === country)!
  const filteredCities = CITIES[country].filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    if (digits.length <= 8) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`
  }

  const handleSave = async () => {
    if (!allAgreed) { setError('Примите все условия'); return }
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/login'); return }

    await supabase.from('studio_profiles').upsert({
      user_id: user.id,
      studio_name: studioName,
      address: studioAddress,
      studio_phone: `${selectedCountry.prefix} ${studioPhone}`,
      city, currency: selectedCountry.currency,
      bin, legal_name: legalName, legal_type: legalType,
      director_name: directorName,
      director_phone: `${selectedCountry.prefix} ${directorPhone}`,
      account_status: 'pending', card_status: 'draft',
      submitted_at: new Date().toISOString(),
    })

    window.location.replace('/dashboard')
  }

  const inputStyle = { width: '100%', padding: '13px 16px', borderRadius: '14px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', background: '#2C2418', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '16px', fontWeight: '700', color: 'white' }}>RAW</div>
          <p style={{ fontSize: '15px', color: '#2C2418', fontWeight: '600', margin: '0 0 4px' }}>
            {['Данные студии', 'Юридические данные', 'Соглашение'][step - 1]}
          </p>
          <p style={{ fontSize: '12px', color: '#9B8E7E', margin: 0 }}>Шаг {step} из 3</p>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {[1,2,3].map(s => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '99px', background: s <= step ? '#2C2418' : '#E8E2D9', transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && <div style={{ background: '#FAECE7', borderRadius: '10px', padding: '10px 14px' }}><p style={{ color: '#C44B2A', fontSize: '13px', margin: 0 }}>{error}</p></div>}

          {step === 1 && (
            <>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '0 0 4px' }}>Информация о студии</p>
              <input placeholder="Название студии *" value={studioName} onChange={e => setStudioName(e.target.value)} style={inputStyle} />
              <input placeholder="Адрес студии *" value={studioAddress} onChange={e => setStudioAddress(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', alignItems: 'center', background: '#FAF8F5', borderRadius: '14px', padding: '13px 16px', gap: '8px' }}>
                <span style={{ color: '#2C2418', fontSize: '14px', fontWeight: '500', flexShrink: 0 }}>{selectedCountry.prefix}</span>
                <input placeholder="Телефон студии *" value={studioPhone} onChange={e => setStudioPhone(formatPhone(e.target.value))} type="tel"
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#2C2418', outline: 'none' }} />
              </div>

              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '4px 0 0' }}>Страна</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {COUNTRIES.map(c => (
                  <button key={c.code} onClick={() => { setCountry(c.code); setCity(''); setCitySearch('') }}
                    style={{ flex: 1, padding: '12px', borderRadius: '14px', border: `2px solid ${country === c.code ? '#2C2418' : 'transparent'}`, background: country === c.code ? '#F5F0E8' : '#FAF8F5', cursor: 'pointer', textAlign: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 2px' }}>{c.name}</p>
                    <p style={{ fontSize: '11px', color: '#9B8E7E', margin: 0 }}>{c.prefix} · {c.symbol}</p>
                  </button>
                ))}
              </div>

              <input placeholder="Поиск города..." value={citySearch} onChange={e => { setCitySearch(e.target.value); setCity('') }} style={inputStyle} />
              {city && <div style={{ background: '#F0F7F0', borderRadius: '10px', padding: '8px 14px' }}><span style={{ fontSize: '13px', color: '#4A7C59', fontWeight: '500' }}>{city}</span></div>}
              {citySearch && !city && (
                <div style={{ background: 'white', borderRadius: '14px', border: '1px solid rgba(139,115,85,0.15)', overflow: 'hidden', maxHeight: '160px', overflowY: 'auto' }}>
                  {filteredCities.length > 0 ? filteredCities.map(c => (
                    <button key={c} onClick={() => { setCity(c); setCitySearch(c) }}
                      style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#2C2418', borderBottom: '1px solid rgba(139,115,85,0.08)' }}>{c}</button>
                  )) : <button onClick={() => setCity(citySearch)} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: '#C4965A' }}>{'Добавить "' + citySearch + '"'}</button>}
                </div>
              )}

              <button onClick={() => { if (!studioName || !studioAddress || !city) { setError('Заполните все поля'); return } setError(''); setStep(2) }}
                style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginTop: '4px' }}>
                Далее →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '0 0 4px' }}>Юридические данные</p>
              <input placeholder="БИН / ИНН *" value={bin} onChange={e => setBin(e.target.value.replace(/\D/g, '').slice(0, 12))} style={inputStyle} />
              <input placeholder="Название юр. лица *" value={legalName} onChange={e => setLegalName(e.target.value)} style={inputStyle} />
              <p style={{ fontSize: '13px', color: '#A89880', margin: '4px 0 0' }}>Форма организации</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {LEGAL_TYPES.map(t => (
                  <button key={t} onClick={() => setLegalType(t)}
                    style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `2px solid ${legalType === t ? '#2C2418' : 'transparent'}`, background: legalType === t ? '#F5F0E8' : '#FAF8F5', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#2C2418' }}>
                    {t}
                  </button>
                ))}
              </div>
              <input placeholder="ФИО руководителя *" value={directorName} onChange={e => setDirectorName(e.target.value)} style={inputStyle} />
              <div style={{ display: 'flex', alignItems: 'center', background: '#FAF8F5', borderRadius: '14px', padding: '13px 16px', gap: '8px' }}>
                <span style={{ color: '#2C2418', fontSize: '14px', fontWeight: '500', flexShrink: 0 }}>{selectedCountry.prefix}</span>
                <input placeholder="Телефон руководителя *" value={directorPhone} onChange={e => setDirectorPhone(formatPhone(e.target.value))} type="tel"
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#2C2418', outline: 'none' }} />
              </div>
              <div style={{ background: '#F5F0E8', borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#8B6B3D', margin: 0 }}>Данные используются только для верификации и не отображаются публично</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#FAF8F5', color: '#9B8E7E', fontSize: '14px', cursor: 'pointer' }}>← Назад</button>
                <button onClick={() => { if (!bin || !legalName || !legalType || !directorName) { setError('Заполните все поля'); return } setError(''); setStep(3) }}
                  style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Далее →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#2C2418', margin: '0 0 4px' }}>Соглашение</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {AGREEMENTS.map(item => (
                  <div key={item.id} onClick={() => setAgreements(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: agreements[item.id] ? '#F0F7F0' : '#FAF8F5', borderRadius: '14px', cursor: 'pointer', border: `1px solid ${agreements[item.id] ? '#4A7C59' : 'transparent'}` }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: `2px solid ${agreements[item.id] ? '#4A7C59' : '#C9A96E'}`, background: agreements[item.id] ? '#4A7C59' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {agreements[item.id] && <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>✓</span>}
                    </div>
                    <p style={{ fontSize: '12px', color: '#2C2418', margin: 0, lineHeight: '1.5' }}>{item.text}</p>
                  </div>
                ))}
              </div>
              {!allAgreed && <button onClick={() => setAgreements({ terms: true, privacy: true, copyright: true, age: true })}
                style={{ width: '100%', padding: '10px', borderRadius: '12px', border: '1px dashed rgba(139,115,85,0.3)', background: 'none', color: '#9B8E7E', fontSize: '12px', cursor: 'pointer' }}>
                Принять все условия
              </button>}
              <div style={{ background: '#F0E8DC', borderRadius: '12px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#8B6B3D', margin: '0 0 4px', fontWeight: '600' }}>Модерация</p>
                <p style={{ fontSize: '12px', color: '#8B6B3D', margin: 0, lineHeight: '1.5' }}>После регистрации аккаунт будет проверен в течение 24 часов.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#FAF8F5', color: '#9B8E7E', fontSize: '14px', cursor: 'pointer' }}>← Назад</button>
                <button onClick={handleSave} disabled={loading || !allAgreed}
                  style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: allAgreed ? '#2C2418' : '#E8E2D9', color: allAgreed ? 'white' : '#9B8E7E', fontSize: '14px', fontWeight: '500', cursor: allAgreed ? 'pointer' : 'default' }}>
                  {loading ? 'Отправляем...' : 'Отправить на модерацию →'}
                </button>
              </div>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9B8E7E', marginTop: '16px' }}>RAW Studios © 2026</p>
      </div>
    </div>
  )
}