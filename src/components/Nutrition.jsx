import { useState, useEffect } from 'react'
import { getTodayNutrition, addNutritionEntry, getFavoriteFoods, addFavoriteFood, getSettings, addWeight, getWeightLog } from '../utils/storage'
import { Plus, Star, TrendingUp, X } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const MacroBar = ({ label, value, goal, color }) => {
  const pct = Math.min((value / goal) * 100, 100)
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>{value}<span style={{ color: 'var(--text3)' }}>/{goal}</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

export default function Nutrition() {
  const [todayLog, setTodayLog] = useState([])
  const [favs, setFavs] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showWeight, setShowWeight] = useState(false)
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [newWeight, setNewWeight] = useState('')
  const [weightLog, setWeightLog] = useState([])
  const settings = getSettings()

  useEffect(() => {
    setTodayLog(getTodayNutrition())
    setFavs(getFavoriteFoods())
    setWeightLog(getWeightLog())
  }, [])

  const totals = todayLog.reduce((s, e) => ({
    calories: s.calories + (e.calories || 0),
    protein: s.protein + (e.protein || 0),
    carbs: s.carbs + (e.carbs || 0),
    fat: s.fat + (e.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const addFromFav = (food) => {
    addNutritionEntry({ name: food.name, calories: food.calories, protein: food.protein, carbs: food.carbs || 0, fat: food.fat || 0 })
    setTodayLog(getTodayNutrition())
  }

  const addCustom = () => {
    if (!customFood.name || !customFood.calories) return
    addNutritionEntry({ name: customFood.name, calories: +customFood.calories, protein: +customFood.protein || 0, carbs: +customFood.carbs || 0, fat: +customFood.fat || 0 })
    addFavoriteFood({ name: customFood.name, calories: +customFood.calories, protein: +customFood.protein || 0, carbs: +customFood.carbs || 0, fat: +customFood.fat || 0 })
    setFavs(getFavoriteFoods())
    setTodayLog(getTodayNutrition())
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowAdd(false)
  }

  const logWeight = () => {
    if (!newWeight) return
    addWeight(parseFloat(newWeight))
    setWeightLog(getWeightLog())
    setNewWeight('')
    setShowWeight(false)
  }

  const weightChartData = weightLog.slice(0, 14).reverse().map((w, i) => ({
    day: new Date(w.date).toLocaleDateString('cs', { day: 'numeric', month: 'short' }),
    kg: w.kg
  }))

  const goalCals = settings.goal_calories || 2800
  const goalProtein = settings.goal_protein || 150
  const calsLeft = goalCals - totals.calories

  return (
    <div className="page">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, marginBottom: 4 }}>VÝŽIVA</div>
      <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>Dnes</div>

      {/* Calorie ring + macros */}
      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
          <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 }}>
            <svg viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="45" cy="45" r="38" fill="none" stroke="var(--bg3)" strokeWidth="8" />
              <circle cx="45" cy="45" r="38" fill="none" stroke="var(--accent)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - Math.min(totals.calories / goalCals, 1))}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, lineHeight: 1, color: 'var(--accent)' }}>{totals.calories}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>kcal</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 2 }}>
              {calsLeft > 0 ? `${calsLeft} kcal zbývá` : `${Math.abs(calsLeft)} kcal přes limit`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Cíl: {goalCals} kcal</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <MacroBar label="PROTEIN" value={totals.protein} goal={goalProtein} color="var(--blue)" />
          <MacroBar label="SACHARIDY" value={totals.carbs} goal={300} color="var(--orange)" />
          <MacroBar label="TUKY" value={totals.fat} goal={80} color="var(--red)" />
        </div>
      </div>

      {/* Quick add favorites */}
      <div className="card fade-in" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="card-title" style={{ fontSize: 18, marginBottom: 0 }}>RYCHLÉ PŘIDÁNÍ</span>
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'var(--accent-dim)', border: 'none', borderRadius: 'var(--r-sm)', padding: '6px 10px', color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Vlastní
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {favs.map((food, i) => (
            <button key={i} onClick={() => addFromFav(food)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px',
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'border-color 0.15s'
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
              <span style={{ fontSize: 14, color: 'var(--text)', textAlign: 'left' }}>{food.name}</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--accent)' }}>{food.calories} kcal</span>
                <span style={{ fontSize: 12, color: 'var(--blue)' }}>{food.protein}g P</span>
              </div>
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="fade-in" style={{ marginTop: 12, padding: 12, background: 'var(--bg3)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input className="input-field" placeholder="Název jídla" value={customFood.name} onChange={e => setCustomFood(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {['calories', 'protein', 'carbs', 'fat'].map(k => (
                <input key={k} className="input-field" type="number" placeholder={k === 'calories' ? 'kcal' : k[0].toUpperCase()} value={customFood[k]} onChange={e => setCustomFood(p => ({ ...p, [k]: e.target.value }))} style={{ padding: '8px', textAlign: 'center' }} />
              ))}
            </div>
            <button onClick={addCustom} className="btn-primary" style={{ padding: '10px' }}>Přidat + uložit do oblíbených</button>
          </div>
        )}
      </div>

      {/* Today's log */}
      {todayLog.length > 0 && (
        <div className="card fade-in" style={{ marginBottom: 16 }}>
          <div className="section-label">DNEŠNÍ JÍDLA</div>
          {todayLog.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < todayLog.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: 14 }}>{e.name}</span>
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--accent)' }}>{e.calories} kcal</span>
                <span style={{ fontSize: 13, color: 'var(--blue)' }}>{e.protein}g</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body weight */}
      <div className="card fade-in">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="card-title" style={{ fontSize: 18, marginBottom: 0 }}>TĚLESNÁ VÁHA</span>
          <button onClick={() => setShowWeight(!showWeight)} style={{ background: 'var(--accent-dim)', border: 'none', borderRadius: 'var(--r-sm)', padding: '6px 10px', color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Zaznamenat
          </button>
        </div>

        {showWeight && (
          <div className="fade-in" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className="input-field" type="number" placeholder="kg" value={newWeight} onChange={e => setNewWeight(e.target.value)} step="0.1" />
            <button onClick={logWeight} className="btn-primary" style={{ width: 'auto', padding: '0 16px' }}>Uložit</button>
          </div>
        )}

        {weightChartData.length > 1 ? (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} labelStyle={{ color: 'var(--text3)' }} />
              <Line type="monotone" dataKey="kg" stroke="var(--green)" strokeWidth={2} dot={{ fill: 'var(--green)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text3)', fontSize: 13 }}>Zaznamenej váhu pro zobrazení grafu</div>
        )}
      </div>
    </div>
  )
}
