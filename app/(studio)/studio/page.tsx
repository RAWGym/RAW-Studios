'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type StudioProfile = {
  id: string
  studio_name: string | null
  address: string | null
  city: string | null
  studio_phone: string | null
  description: string | null
  instagram: string | null
  vk: string | null
  telegram: string | null
  website: string | null
  price_from: number | null
  currency: string | null
  tags: string[] | null
  photos: string[] | null
  card_status: string
  halls: Hall[]
}

type Hall = {
  id: string
  name: string
  description: string
  price_per_hour: number
  photos: string[]
}

const ALL_TAGS = ['Циклорама', 'Интерьерная', 'Естественный свет', 'Для видео', 'Лофт', 'Fashion', 'Детская', 'Предметная']

export default function StudioPage() {
  const [studio, setStudio] = useState<StudioProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'card' | 'halls'>('card')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingHall, setEditingHall] = useState<Hall | null>(null)
  const [showHallForm, setShowHallForm] = useState(false)
  const [hallUploading, setHallUploading] = useState(false)

  const [studioName, setStudioName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [instagram, setInstagram] = useState('')
  const [vk, setVk] = useState('')
  const [telegram, setTelegram] = useState('')
  const [website, setWebsite] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [hallName, setHallName] = useState('')
  const [hallDesc, setHallDesc] = useState('')
  const [hallPrice, setHallPrice] = useState('')
  const [hallPhotos, setHallPhotos] = useState<string[]>([])

  const fileRef = useRef<HTMLInputElement>(null)
  const hallFileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { fetchStudio() }, [])

  const fetchStudio = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.replace('/login'); return }
    const { data } = await supabase.from('studio_profiles').select('*').eq('user_id', user.id).single()
    if (data) {
      setStudio({ ...data, halls: data.halls || [] })
      setStudioName(data.studio_name || '')
      setAddress(data.address || '')
      setPhone(data.studio_phone || '')
      setDescription(data.description || '')
      setInstagram(data.instagram || '')
      setVk(data.vk || '')
      setTelegram(data.telegram || '')
      setWebsite(data.website || '')
      setPriceFrom(String(data.price_from || ''))
      setSelectedTags(data.tags || [])
      setPhotos(data.photos || [])
    }
    setLoading(false)
  }

  const saveCard = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('studio_profiles').update({
      studio_name: studioName, address, studio_phone: phone,
      description, instagram: instagram.replace('@', ''),
      vk: vk.replace('@', ''), telegram: telegram.replace('@', ''),
      website, price_from: parseFloat(priceFrom) || null,
      tags: selectedTags, photos,
    }).eq('user_id', user.id)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    fetchStudio()
  }

  const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('studio-photos').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('studio-photos').getPublicUrl(path)
      setPhotos(prev => [...prev, urlData.publicUrl])
    }
    setUploading(false)
  }

  const uploadHallPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setHallUploading(true)
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return
    const ext = file.name.split('.').pop()
    const path = `${user.id}/halls/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('studio-photos').upload(path, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('studio-photos').getPublicUrl(path)
      setHallPhotos(prev => [...prev, urlData.publicUrl])
    }
    setHallUploading(false)
  }

  const openHallForm = (hall?: Hall) => {
    if (hall) {
      setEditingHall(hall); setHallName(hall.name)
      setHallDesc(hall.description); setHallPrice(String(hall.price_per_hour))
      setHallPhotos(hall.photos || [])
    } else {
      setEditingHall(null); setHallName(''); setHallDesc(''); setHallPrice(''); setHallPhotos([])
    }
    setShowHallForm(true)
  }

  const saveHall = async () => {
    if (!hallName.trim() || !studio) return
    const halls = studio.halls || []
    const newHall: Hall = {
      id: editingHall?.id || Date.now().toString(),
      name: hallName, description: hallDesc,
      price_per_hour: parseFloat(hallPrice) || 0, photos: hallPhotos,
    }
    const updated = editingHall ? halls.map(h => h.id === editingHall.id ? newHall : h) : [...halls, newHall]
    await supabase.from('studio_profiles').update({ halls: updated }).eq('id', studio.id)
    setStudio(prev => prev ? { ...prev, halls: updated } : null)
    setShowHallForm(false)
  }

  const deleteHall = async (id: string) => {
    if (!studio) return
    const updated = studio.halls.filter(h => h.id !== id)
    await supabase.from('studio_profiles').update({ halls: updated }).eq('id', studio.id)
    setStudio(prev => prev ? { ...prev, halls: updated } : null)
    setShowHallForm(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2.5px solid #C4965A', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const sym = studio?.currency === 'RUB' ? '₽' : '₸'

  return (
    <div style={{ background: '#FAF8F5', minHeight: '100vh', padding: '0 0 100px' }}>

      <div style={{ background: 'white', padding: '56px 20px 0', borderBottom: '1px solid rgba(139,115,85,0.1)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#2C2418', margin: '0 0 16px' }}>Студия</h1>
        <div style={{ display: 'flex' }}>
          {[['card', 'Карточка'], ['halls', 'Залы']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as 'card' | 'halls')}
              style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === key ? '600' : '400', color: activeTab === key ? '#2C2418' : '#A89880', borderBottom: `2px solid ${activeTab === key ? '#2C2418' : 'transparent'}` }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {activeTab === 'card' && (
          <>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '99px', padding: '6px 14px', background: studio?.card_status === 'approved' ? '#EAF3E6' : studio?.card_status === 'pending' ? '#F0E8DC' : '#EDE9E1', alignSelf: 'flex-start' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: studio?.card_status === 'approved' ? '#4A7C59' : studio?.card_status === 'pending' ? '#C4965A' : '#A89880' }} />
              <span style={{ fontSize: '12px', fontWeight: '600', color: studio?.card_status === 'approved' ? '#4A7C59' : studio?.card_status === 'pending' ? '#C4965A' : '#A89880' }}>
                {studio?.card_status === 'approved' ? 'Опубликована' : studio?.card_status === 'pending' ? 'На модерации' : 'Черновик'}
              </span>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Общая информация</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { label: 'Название', value: studioName, onChange: setStudioName, placeholder: 'Название студии' },
                  { label: 'Адрес', value: address, onChange: setAddress, placeholder: 'Улица, дом' },
                  { label: 'Телефон', value: phone, onChange: setPhone, placeholder: '+7 (700) 000-00-00' },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', color: '#A89880', margin: '0 0 4px' }}>{item.label}</p>
                    <input value={item.value} onChange={e => item.onChange(e.target.value)} placeholder={item.placeholder}
                      style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 10px' }}>Описание</p>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Расскажите о студии..."
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', resize: 'none', boxSizing: 'border-box' as const, lineHeight: '1.5' }} />
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Соцсети и контакты</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: '📸', prefix: 'instagram.com/', placeholder: 'Instagram', value: instagram, onChange: setInstagram },
                  { icon: '💬', prefix: 'vk.com/', placeholder: 'ВКонтакте', value: vk, onChange: setVk },
                  { icon: '✈️', prefix: 't.me/', placeholder: 'Telegram', value: telegram, onChange: setTelegram },
                  { icon: '🌐', prefix: '', placeholder: 'Сайт (https://...)', value: website, onChange: setWebsite },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', background: '#FAF8F5', borderRadius: '12px', padding: '12px 14px', gap: '8px' }}>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.icon}</span>
                    {item.prefix && <span style={{ fontSize: '12px', color: '#A89880', flexShrink: 0 }}>{item.prefix}</span>}
                    <input placeholder={item.placeholder} value={item.value} onChange={e => item.onChange(e.target.value.replace('@', ''))}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#2C2418', outline: 'none' }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 12px' }}>Тип студии</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALL_TAGS.map(tag => (
                  <button key={tag} onClick={() => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                    style={{ padding: '8px 14px', borderRadius: '99px', border: `1px solid ${selectedTags.includes(tag) ? '#2C2418' : 'rgba(139,115,85,0.2)'}`, background: selectedTags.includes(tag) ? '#2C2418' : 'white', color: selectedTags.includes(tag) ? 'white' : '#7A6B55', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 10px' }}>Минимальная стоимость</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FAF8F5', borderRadius: '12px', padding: '12px 14px' }}>
                <span style={{ fontSize: '13px', color: '#A89880' }}>от</span>
                <input type="number" placeholder="2000" value={priceFrom} onChange={e => setPriceFrom(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#2C2418', outline: 'none' }} />
                <span style={{ fontSize: '13px', color: '#A89880' }}>{sym}/ч</span>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: '20px', padding: '16px', border: '1px solid rgba(139,115,85,0.12)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '0 0 4px' }}>Фото карточки</p>
              <p style={{ fontSize: '11px', color: '#A89880', margin: '0 0 12px' }}>Первое фото — обложка в каталоге</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {photos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
                    {i === 0 && <div style={{ position: 'absolute', top: '4px', left: '4px', background: '#2C2418', borderRadius: '6px', padding: '2px 6px', zIndex: 1 }}><span style={{ fontSize: '9px', color: 'white', fontWeight: '600' }}>ОБЛОЖКА</span></div>}
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => fileRef.current?.click()}
                  style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(139,115,85,0.3)', background: '#FAF8F5', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '24px', color: '#C4965A' }}>+</span>
                  <span style={{ fontSize: '10px', color: '#A89880' }}>{uploading ? 'Загрузка...' : 'Добавить'}</span>
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} style={{ display: 'none' }} />
            </div>

            <button onClick={saveCard} disabled={saving}
              style={{ width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: saved ? '#4A7C59' : '#2C2418', color: 'white', fontSize: '15px', fontWeight: '600', cursor: saving ? 'default' : 'pointer' }}>
              {saved ? '✓ Сохранено' : saving ? 'Сохраняем...' : 'Сохранить карточку'}
            </button>
          </>
        )}

        {activeTab === 'halls' && (
          <>
            <button onClick={() => openHallForm()}
              style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px dashed rgba(139,115,85,0.3)', background: 'white', color: '#8B6B3D', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>+</span> Добавить зал
            </button>
            {(!studio?.halls || studio.halls.length === 0) ? (
              <div style={{ background: 'white', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', border: '1px solid rgba(139,115,85,0.1)' }}>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#2C2418', margin: '0 0 8px' }}>Залы не добавлены</p>
                <p style={{ fontSize: '13px', color: '#A89880', margin: 0 }}>Добавьте залы с описанием, фото и ценами</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {studio.halls.map(hall => (
                  <div key={hall.id} style={{ background: 'white', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(139,115,85,0.12)' }}>
                    {hall.photos?.[0] && (
                      <div style={{ height: '140px', overflow: 'hidden' }}>
                        <img src={hall.photos[0]} alt={hall.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{hall.name}</p>
                        {hall.price_per_hour > 0 && <p style={{ fontSize: '13px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{hall.price_per_hour.toLocaleString()} {sym}/ч</p>}
                      </div>
                      {hall.description && <p style={{ fontSize: '12px', color: '#7A6B55', margin: '0 0 10px', lineHeight: '1.5' }}>{hall.description}</p>}
                      <button onClick={() => openHallForm(hall)}
                        style={{ width: '100%', padding: '9px', borderRadius: '10px', border: '1px solid rgba(139,115,85,0.2)', background: 'white', color: '#7A6B55', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                        Редактировать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showHallForm && (
        <>
          <div onClick={() => setShowHallForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} />
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: '#FAF8F5', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#2C2418', margin: 0 }}>{editingHall ? 'Редактировать зал' : 'Новый зал'}</h2>
              <button onClick={() => setShowHallForm(false)} style={{ background: '#EDE9E1', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Название зала *" value={hallName} onChange={e => setHallName(e.target.value)}
                style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: 'none', background: 'white', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' as const }} />
              <textarea placeholder="Описание" value={hallDesc} onChange={e => setHallDesc(e.target.value)} rows={3}
                style={{ width: '100%', padding: '13px 16px', borderRadius: '14px', border: 'none', background: 'white', fontSize: '14px', color: '#2C2418', outline: 'none', resize: 'none', boxSizing: 'border-box' as const, lineHeight: '1.5' }} />
              <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: '14px', padding: '13px 16px', gap: '8px' }}>
                <input placeholder="Стоимость" type="number" value={hallPrice} onChange={e => setHallPrice(e.target.value)}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', color: '#2C2418', outline: 'none' }} />
                <span style={{ fontSize: '13px', color: '#A89880' }}>{sym}/ч</span>
              </div>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#2C2418', margin: '4px 0 0' }}>Фотографии</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {hallPhotos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '1' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setHallPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
                <button onClick={() => hallFileRef.current?.click()}
                  style={{ aspectRatio: '1', borderRadius: '12px', border: '2px dashed rgba(139,115,85,0.3)', background: '#FAF8F5', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '24px', color: '#C4965A' }}>+</span>
                  <span style={{ fontSize: '10px', color: '#A89880' }}>{hallUploading ? 'Загрузка...' : 'Фото'}</span>
                </button>
              </div>
              <input ref={hallFileRef} type="file" accept="image/*" onChange={uploadHallPhoto} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {editingHall && (
                  <button onClick={() => deleteHall(editingHall.id)}
                    style={{ flex: 1, padding: '14px', borderRadius: '14px', border: 'none', background: '#FAECE7', color: '#C44B2A', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                    Удалить
                  </button>
                )}
                <button onClick={saveHall}
                  style={{ flex: 2, padding: '14px', borderRadius: '14px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}