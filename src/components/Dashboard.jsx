import { useState, useEffect } from 'react'
import { getSettings, getStreak, getWorkouts, getTodayNutrition, getTodaySupplements, getWeightLog, toggleSupplement } from '../utils/storage'
import { Flame, Dumbbell, Camera, ChefHat, Zap, TrendingUp } from 'lucide-react'

const StatCard = ({ label, value, unit, color, icon: Icon }) => (
  <div className="card fade-in" style={{ flex: 1, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text3)' }}>{label}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, color }}>{value}</span>
      {unit && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{unit}</span>}
    </div>
  </div>
)

export default function Dashboard({ onNavigate }) {
  const [settings, setSettings] = useState(getSettings())
  const [streak, setStreak] = useState(0)
  const [todayNutrition, setTodayNutrition] = useState([])
  const [supplements, setSupplements] = useState({})
  const [workouts, setWorkouts] = useState([])
  const [weightLog, setWeightLog] = useState([])
  const [isTrainingDay, setIsTrainingDay] = useState(false)

  useEffect(() => {
    const s = getSettings()
    setSettings(s)
    setStreak(getStreak())
    setTodayNutrition(getTodayNutrition())
    setSupplements(getTodaySupplements())
    const w = getWorkouts()
    setWorkouts(w)
    setWeightLog(getWeightLog())
    // Simple training day detection: if last workout wasn't today
    const todayStr = new Date().toDateString()
    const lastWorkout = w[0]
    const lastWasToday = lastWorkout && new Date(lastWorkout.date).toDateString() === todayStr
    setIsTrainingDay(!lastWasToday)
  }, [])

  const todayCals = todayNutrition.reduce((s, e) => s + (e.calories || 0), 0)
  const todayProtein = todayNutrition.reduce((s, e) => s + (e.protein || 0), 0)
  const currentWeight = weightLog[0]?.kg || null
  const totalWorkouts = workouts.length

  const dayName = new Date().toLocaleDateString('cs', { weekday: 'long', day: 'numeric', month: 'long' })

  const activeSups = Object.values(supplements).filter(Boolean).length
  const supList = isTrainingDay ? (settings.supplements_training || []) : (settings.supplements_rest || [])
  const totalSups = supList.length

  return (
    <div className="page">
      {/* Header */}
      <div className="fade-in" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 1, letterSpacing: 1 }}>
              {settings.name ? `Ahoj, ${settings.name}` : 'FITTRACK'}
            </div>
            <div style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4, textTransform: 'capitalize' }}>{dayName}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`tag ${isTrainingDay ? 'tag-accent' : 'tag-green'}`}>
              {isTrainingDay ? '🏋️ TRÉNINK' : '😴 REST DAY'}
            </span>
          </div>
        </div>
      </div>

      {/* Streak banner */}
      {streak > 0 && (
        <div className="fade-in" style={{ background: 'linear-gradient(135deg, rgba(232,255,71,0.12), rgba(232,255,71,0.04))', border: '1px solid rgba(232,255,71,0.2)', borderRadius: 'var(--r)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Flame size={22} color="var(--accent)" />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)', letterSpacing: 1 }}>{streak} DNÍ V ŘADĚ</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Nepřeruš sérii 💪</div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <StatCard label="Tréninky" value={totalWorkouts} icon={Dumbbell} color="var(--accent)" />
        <StatCard label="Kalorie dnes" value={todayCals} unit="kcal" icon={ChefHat} color="var(--orange)" />
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <StatCard label="Protein dnes" value={todayProtein} unit="g" icon={Zap} color="var(--blue)" />
        <StatCard label="Váha" value={currentWeight || '—'} unit={currentWeight ? 'kg' : ''} icon={TrendingUp} color="var(--green)" />
      </div>

      {/* Supplement checklist */}
      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="card-title" style={{ marginBottom: 0, fontSize: 18 }}>DOPLŇKY</span>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{activeSups}/{totalSups}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {supList.map(sup => {
            const done = supplements[sup]
            return (
              <button key={sup} onClick={() => {
                toggleSupplement(sup)
                setSupplements(getTodaySupplements())
              }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: done ? 'rgba(71,255,138,0.06)' : 'var(--bg3)',
                border: `1px solid ${done ? 'rgba(71,255,138,0.2)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left'
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
                  background: done ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {done && <span style={{ fontSize: 10, color: '#080808', fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ color: done ? 'var(--text2)' : 'var(--text)', fontSize: 14, fontWeight: 500, textDecoration: done ? 'line-through' : 'none' }}>{sup}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card fade-in">
        <span className="card-title" style={{ fontSize: 18 }}>RYCHLÉ AKCE</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: '+ Trénink', icon: Dumbbell, tab: 'workout', color: 'var(--accent)' },
            { label: '+ Foto', icon: Camera, tab: 'photos', color: 'var(--blue)' },
            { label: '+ Jídlo', icon: ChefHat, tab: 'nutrition', color: 'var(--orange)' },
            { label: 'AI Coach', icon: Zap, tab: 'coach', color: 'var(--green)' },
          ].map(({ label, icon: Icon, tab, color }) => (
            <button key={tab} onClick={() => onNavigate(tab)} style={{
              padding: '12px', background: 'var(--bg3)', border: '1px solid var(--border2)',
              borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', transition: 'all 0.15s', color: 'var(--text)'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = color}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border2)'}>
              <Icon size={16} color={color} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Last workout */}
      {workouts[0] && (
        <div className="card fade-in mt-4" style={{ borderColor: 'var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="section-label">POSLEDNÍ TRÉNINK</span>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              {new Date(workouts[0].date).toLocaleDateString('cs', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{workouts[0].name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {workouts[0].exercises?.length || 0} cviky · {workouts[0].exercises?.reduce((s, e) => s + (e.sets?.length || 0), 0)} sérií
          </div>
        </div>
      )}
    </div>
  )
}
