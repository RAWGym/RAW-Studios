'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A89880" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
    ) : (
      <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    )}
  </svg>
)

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleLogin = async () => {
    if (!email || !password) { setError('Заполните все поля'); return }
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Неверный email или пароль'); setLoading(false); return }
    if (data.session) {
      const { data: profile } = await supabase.from('studio_profiles').select('account_status').eq('user_id', data.session.user.id).single()
      if (!profile) window.location.replace('/onboarding')
      else window.location.replace('/dashboard')
    }
  }

  const handleRegister = async () => {
    if (!email || !password || !passwordConfirm) { setError('Заполните все поля'); return }
    if (password !== passwordConfirm) { setError('Пароли не совпадают'); return }
    if (password.length < 6) { setError('Пароль минимум 6 символов'); return }
    setLoading(true); setError('')
    const { error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    const { data } = await supabase.auth.signInWithPassword({ email, password })
    if (data.session) window.location.replace('/onboarding')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#FAF8F5' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', background: '#2C2418', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '18px', fontWeight: '700', color: 'white', letterSpacing: '-0.5px' }}>RAW</div>
          <p style={{ fontSize: '18px', fontWeight: '700', color: '#2C2418', margin: '0 0 4px' }}>RAW Studios</p>
          <p style={{ fontSize: '12px', color: '#9B8E7E', margin: 0 }}>Кабинет фотостудии</p>
        </div>

        <div style={{ display: 'flex', background: '#EDE9E1', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
          {[{ key: 'login', label: 'Войти' }, { key: 'register', label: 'Регистрация' }].map(tab => (
            <button key={tab.key} onClick={() => { setMode(tab.key as 'login' | 'register'); setError('') }}
              style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', background: mode === tab.key ? 'white' : 'transparent', color: mode === tab.key ? '#2C2418' : '#9B8E7E', boxShadow: mode === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {error && <div style={{ background: '#FAECE7', borderRadius: '10px', padding: '10px 14px' }}><p style={{ color: '#C44B2A', fontSize: '13px', margin: 0 }}>{error}</p></div>}

          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' }} />

          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} placeholder="Пароль" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && mode === 'login' && handleLogin()}
              style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '14px', border: 'none', background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {mode === 'register' && (
            <div style={{ position: 'relative' }}>
              <input type={showPasswordConfirm ? 'text' : 'password'} placeholder="Повторите пароль" value={passwordConfirm}
                onChange={e => setPasswordConfirm(e.target.value)}
                style={{ width: '100%', padding: '14px 44px 14px 16px', borderRadius: '14px', border: `1px solid ${passwordConfirm && password !== passwordConfirm ? '#C44B2A' : 'transparent'}`, background: '#FAF8F5', fontSize: '14px', color: '#2C2418', outline: 'none', boxSizing: 'border-box' }} />
              <button onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                <EyeIcon open={showPasswordConfirm} />
              </button>
            </div>
          )}

          <button onClick={mode === 'login' ? handleLogin : handleRegister} disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '14px', border: 'none', background: '#2C2418', color: 'white', fontSize: '14px', fontWeight: '500', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '4px' }}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#9B8E7E', marginTop: '20px' }}>
          RAW Studios © 2026
        </p>
      </div>
    </div>
  )
}