import { useState } from 'react'
import { getSettings, saveSettings } from '../utils/storage'
import { Check, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const [s, setS] = useState(getSettings())
  const [saved, setSaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const save = () => {
    saveSettings(s)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSup = (type, val) => {
    setS(p => ({ ...p, [type]: val.split(',').map(x => x.trim()).filter(Boolean) }))
  }

  return (
    <div className="page">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, marginBottom: 20 }}>NASTAVENÍ</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Profile */}
        <div className="card">
          <div className="section-label">PROFIL</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Jméno</label>
              <input className="input-field" value={s.name} onChange={e => setS(p => ({ ...p, name: e.target.value }))} placeholder="Tvoje jméno" />
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="card">
          <div className="section-label">CÍLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Denní kalorický cíl (kcal)</label>
              <input className="input-field" type="number" value={s.goal_calories} onChange={e => setS(p => ({ ...p, goal_calories: +e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Denní cíl proteinu (g)</label>
              <input className="input-field" type="number" value={s.goal_protein} onChange={e => setS(p => ({ ...p, goal_protein: +e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Supplements */}
        <div className="card">
          <div className="section-label">DOPLŇKY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Tréninkový den (oddělené čárkou)</label>
              <input className="input-field" value={(s.supplements_training || []).join(', ')} onChange={e => updateSup('supplements_training', e.target.value)} placeholder="Kreatin, Pre-workout, Protein" />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 6 }}>Rest day</label>
              <input className="input-field" value={(s.supplements_rest || []).join(', ')} onChange={e => updateSup('supplements_rest', e.target.value)} placeholder="Kreatin, Tvaroh" />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="card" style={{ borderColor: 'rgba(232,255,71,0.15)' }}>
          <div className="section-label">AI COACH — ANTHROPIC API KLÍČ</div>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.6 }}>
            Pro AI analýzu fotek a AI Coach potřebuješ vlastní API klíč z{' '}
            <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>console.anthropic.com</a>.
            Klíč se ukládá pouze do tvého prohlížeče.
          </p>
          <div style={{ position: 'relative' }}>
            <input
              className="input-field"
              type={showKey ? 'text' : 'password'}
              value={s.apiKey || ''}
              onChange={e => setS(p => ({ ...p, apiKey: e.target.value }))}
              placeholder="sk-ant-..."
              style={{ paddingRight: 44 }}
            />
            <button onClick={() => setShowKey(!showKey)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none' }}>
              {showKey ? <EyeOff size={16} color="var(--text3)" /> : <Eye size={16} color="var(--text3)" />}
            </button>
          </div>
          {s.apiKey && (
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              <span style={{ fontSize: 12, color: 'var(--green)' }}>API klíč nastaven</span>
            </div>
          )}
        </div>

        {/* Save */}
        <button onClick={save} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {saved ? <><Check size={18} /> Uloženo!</> : 'Uložit nastavení'}
        </button>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)', paddingBottom: 8 }}>
          FitTrack v1.0 · Vytvořeno s 💪
        </div>
      </div>
    </div>
  )
}
