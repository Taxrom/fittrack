import { useState } from 'react'
import Dashboard from './components/Dashboard'
import WorkoutLogger from './components/WorkoutLogger'
import ProgressPhotos from './components/ProgressPhotos'
import Nutrition from './components/Nutrition'
import AICoach from './components/AICoach'
import Settings from './components/Settings'
import { LayoutDashboard, Dumbbell, Camera, Utensils, Zap, Settings as SettingsIcon } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Přehled', icon: LayoutDashboard },
  { id: 'workout', label: 'Trénink', icon: Dumbbell },
  { id: 'photos', label: 'Foto', icon: Camera },
  { id: 'nutrition', label: 'Výživa', icon: Utensils },
  { id: 'coach', label: 'Coach', icon: Zap },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')

  const renderTab = () => {
    if (tab === 'settings') return <Settings />
    switch (tab) {
      case 'dashboard': return <Dashboard onNavigate={setTab} />
      case 'workout': return <WorkoutLogger />
      case 'photos': return <ProgressPhotos />
      case 'nutrition': return <Nutrition />
      case 'coach': return <AICoach />
      default: return <Dashboard onNavigate={setTab} />
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar (only non-coach tabs) */}
      {tab !== 'coach' && (
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg)', borderBottom: '1px solid var(--border)', padding: '12px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--accent)' }}>FITTRACK</div>
          <button onClick={() => setTab(tab === 'settings' ? 'dashboard' : 'settings')} style={{ background: 'none', padding: 4 }}>
            <SettingsIcon size={20} color={tab === 'settings' ? 'var(--accent)' : 'var(--text3)'} />
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderTab()}
      </div>

      {/* Bottom nav */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg)', borderTop: '1px solid var(--border)',
        display: 'flex', height: 'var(--nav-h)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id
          return (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 3, background: 'none', border: 'none', cursor: 'pointer',
              transition: 'all 0.15s', position: 'relative'
            }}>
              {active && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, background: 'var(--accent)', borderRadius: '0 0 2px 2px' }} />
              )}
              <Icon size={20} color={active ? 'var(--accent)' : 'var(--text3)'} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? 'var(--accent)' : 'var(--text3)', letterSpacing: 0.5 }}>
                {label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
