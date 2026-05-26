import { useState, useEffect } from 'react'
import { getWorkouts, saveWorkout, deleteWorkout, getExerciseHistory, addExerciseHistory, getPRs, updatePR, generateId, getSettings } from '../utils/storage'
import { suggestProgression } from '../utils/api'
import { Plus, Trash2, ChevronDown, ChevronUp, Trophy, TrendingUp, X, Check } from 'lucide-react'

const PRESET_EXERCISES = [
  'Bench Press', 'Shoulder Press', 'Incline Bench', 'Cable Fly',
  'Pull-up / Sheko', 'Lat Pulldown', 'Cable Row', 'T-Bar Row',
  'Squat', 'Leg Press', 'Romanian Deadlift', 'Leg Curl',
  'Bicep Curl', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher',
  'Lateral Raise', 'Face Pull', 'Dip', 'Deadlift'
]

const SetRow = ({ set, idx, onUpdate, onDelete }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr auto', gap: 8, alignItems: 'center' }}>
    <span style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', fontWeight: 600 }}>{idx + 1}</span>
    <div>
      <input className="input-field" type="number" placeholder="kg" value={set.weight || ''} min="0" step="0.5"
        onChange={e => onUpdate({ ...set, weight: parseFloat(e.target.value) || 0 })}
        style={{ textAlign: 'center', padding: '8px' }} />
    </div>
    <div>
      <input className="input-field" type="number" placeholder="reps" value={set.reps || ''} min="0"
        onChange={e => onUpdate({ ...set, reps: parseInt(e.target.value) || 0 })}
        style={{ textAlign: 'center', padding: '8px' }} />
    </div>
    <button onClick={onDelete} style={{ background: 'transparent', padding: 4 }}>
      <X size={14} color="var(--text3)" />
    </button>
  </div>
)

const ExerciseCard = ({ exercise, onUpdate, onDelete, prs, apiKey }) => {
  const [expanded, setExpanded] = useState(true)
  const [suggestion, setSuggestion] = useState('')
  const [loadingSug, setLoadingSug] = useState(false)
  const history = getExerciseHistory(exercise.name)
  const pr = prs[exercise.name]

  const addSet = () => {
    const lastSet = exercise.sets[exercise.sets.length - 1]
    onUpdate({ ...exercise, sets: [...exercise.sets, { id: generateId(), weight: lastSet?.weight || 0, reps: lastSet?.reps || 8 }] })
  }

  const getSuggestion = async () => {
    if (!apiKey || !history.length) return
    setLoadingSug(true)
    try {
      const s = await suggestProgression(apiKey, exercise.name, history)
      setSuggestion(s)
    } catch (e) { setSuggestion('Nelze načíst návrh.') }
    setLoadingSug(false)
  }

  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: expanded ? 12 : 0 }}>
        <button onClick={() => setExpanded(!expanded)} style={{ flex: 1, background: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
          {expanded ? <ChevronUp size={16} color="var(--text3)" /> : <ChevronDown size={16} color="var(--text3)" />}
          <span style={{ fontWeight: 600, fontSize: 15 }}>{exercise.name}</span>
          {pr && <Trophy size={12} color="var(--accent)" />}
        </button>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{exercise.sets.length} sérií</span>
        <button onClick={onDelete}><Trash2 size={14} color="var(--text3)" /></button>
      </div>

      {expanded && (
        <div className="fade-in">
          {pr && (
            <div style={{ background: 'var(--accent-dim)', borderRadius: 'var(--r-sm)', padding: '6px 10px', marginBottom: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Trophy size={12} color="var(--accent)" />
              <span style={{ fontSize: 12, color: 'var(--accent)' }}>PR: {pr.weight}kg × {pr.reps} reps</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
            <div />
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>kg</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' }}>reps</span>
            <div />
          </div>

          {exercise.sets.map((set, idx) => (
            <SetRow key={set.id} set={set} idx={idx}
              onUpdate={updated => onUpdate({ ...exercise, sets: exercise.sets.map(s => s.id === set.id ? updated : s) })}
              onDelete={() => onUpdate({ ...exercise, sets: exercise.sets.filter(s => s.id !== set.id) })}
            />
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={addSet} style={{ flex: 1, background: 'var(--bg3)', border: '1px dashed var(--border2)', borderRadius: 'var(--r-sm)', padding: '8px', color: 'var(--text2)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Plus size={14} /> Serie
            </button>
            {apiKey && history.length > 0 && (
              <button onClick={getSuggestion} style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.2)', borderRadius: 'var(--r-sm)', padding: '8px 12px', color: 'var(--accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} /> {loadingSug ? '...' : 'AI tip'}
              </button>
            )}
          </div>

          {suggestion && (
            <div style={{ marginTop: 8, background: 'var(--accent-dim)', borderRadius: 'var(--r-sm)', padding: '8px 12px', fontSize: 13, color: 'var(--text)' }}>
              {suggestion}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WorkoutLogger() {
  const [view, setView] = useState('list') // list | new | active | detail
  const [workouts, setWorkouts] = useState([])
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [prs, setPrs] = useState({})
  const [newPR, setNewPR] = useState(null)
  const settings = getSettings()

  useEffect(() => {
    setWorkouts(getWorkouts())
    setPrs(getPRs())
  }, [])

  const startWorkout = () => {
    const workout = {
      id: generateId(),
      name: `Trénink ${new Date().toLocaleDateString('cs', { weekday: 'long' })}`,
      date: new Date().toISOString(),
      exercises: [],
      notes: '',
      duration: 0,
      startTime: Date.now()
    }
    setActiveWorkout(workout)
    setView('active')
  }

  const finishWorkout = () => {
    if (!activeWorkout) return
    const duration = Math.round((Date.now() - activeWorkout.startTime) / 60000)
    const finalWorkout = { ...activeWorkout, duration }

    // Save exercise history and check PRs
    let newPRFound = null
    finalWorkout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.weight > 0 && set.reps > 0) {
          addExerciseHistory(ex.name, { weight: set.weight, reps: set.reps })
          const isPR = updatePR(ex.name, set.weight, set.reps)
          if (isPR) newPRFound = `${ex.name}: ${set.weight}kg × ${set.reps}`
        }
      })
    })

    saveWorkout(finalWorkout)
    setWorkouts(getWorkouts())
    setPrs(getPRs())
    if (newPRFound) setNewPR(newPRFound)
    setActiveWorkout(null)
    setView('list')
  }

  const addExercise = (name) => {
    const ex = { id: generateId(), name, sets: [{ id: generateId(), weight: 0, reps: 8 }] }
    setActiveWorkout(prev => ({ ...prev, exercises: [...(prev.exercises || []), ex] }))
    setShowExercisePicker(false)
    setExerciseSearch('')
  }

  const filteredExercises = PRESET_EXERCISES.filter(e => e.toLowerCase().includes(exerciseSearch.toLowerCase()))

  if (view === 'active' && activeWorkout) {
    return (
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 1 }}>AKTIVNÍ TRÉNINK</div>
            <input value={activeWorkout.name} onChange={e => setActiveWorkout(p => ({ ...p, name: e.target.value }))}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 13, marginTop: 2, width: '100%' }} />
          </div>
          <span className="tag tag-green pulse">LIVE</span>
        </div>

        {activeWorkout.exercises.map(ex => (
          <ExerciseCard key={ex.id} exercise={ex} prs={prs} apiKey={settings.apiKey}
            onUpdate={updated => setActiveWorkout(p => ({ ...p, exercises: p.exercises.map(e => e.id === ex.id ? updated : e) }))}
            onDelete={() => setActiveWorkout(p => ({ ...p, exercises: p.exercises.filter(e => e.id !== ex.id) }))}
          />
        ))}

        <button onClick={() => setShowExercisePicker(true)} style={{
          width: '100%', border: '2px dashed var(--border2)', background: 'transparent',
          borderRadius: 'var(--r)', padding: 16, color: 'var(--text3)', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16
        }}>
          <Plus size={18} /> Přidat cvik
        </button>

        <button onClick={finishWorkout} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Check size={18} /> Dokončit trénink
        </button>

        {showExercisePicker && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
            <div style={{ background: 'var(--bg2)', width: '100%', borderRadius: '20px 20px 0 0', padding: 20, maxHeight: '70vh', overflow: 'auto' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 12, letterSpacing: 1 }}>VYBER CVIK</div>
              <input className="input-field" placeholder="Hledat nebo napsat vlastní..." value={exerciseSearch}
                onChange={e => setExerciseSearch(e.target.value)} style={{ marginBottom: 12 }} autoFocus />
              {exerciseSearch && !PRESET_EXERCISES.includes(exerciseSearch) && (
                <button onClick={() => addExercise(exerciseSearch)} style={{ width: '100%', padding: '12px', background: 'var(--accent-dim)', border: '1px solid rgba(232,255,71,0.3)', borderRadius: 'var(--r-sm)', color: 'var(--accent)', marginBottom: 10, fontWeight: 600 }}>
                  + Přidat "{exerciseSearch}"
                </button>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredExercises.map(ex => (
                  <button key={ex} onClick={() => addExercise(ex)} style={{ padding: '12px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', textAlign: 'left', fontSize: 14 }}>
                    {ex}
                    {prs[ex] && <span style={{ float: 'right', fontSize: 12, color: 'var(--accent)' }}>PR {prs[ex].weight}kg</span>}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowExercisePicker(false)} className="btn-ghost" style={{ marginTop: 16, width: '100%' }}>Zavřít</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, marginBottom: 4 }}>TRÉNINKY</div>
      <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>{workouts.length} celkem</div>

      {newPR && (
        <div className="fade-in" style={{ background: 'linear-gradient(135deg, rgba(232,255,71,0.15), rgba(232,255,71,0.05))', border: '1px solid var(--accent)', borderRadius: 'var(--r)', padding: 16, marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Trophy size={24} color="var(--accent)" />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--accent)', letterSpacing: 1 }}>NOVÝ REKORD!</div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{newPR}</div>
          </div>
          <button onClick={() => setNewPR(null)} style={{ marginLeft: 'auto', background: 'none' }}><X size={16} color="var(--text3)" /></button>
        </div>
      )}

      <button onClick={startWorkout} className="btn-primary" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15 }}>
        <Plus size={20} /> Začít nový trénink
      </button>

      {/* PRs overview */}
      {Object.keys(prs).length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-label">OSOBNÍ REKORDY</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(prs).slice(0, 5).map(([name, pr]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13 }}>{name}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--accent)' }}>{pr.weight}<span style={{ fontSize: 13, color: 'var(--text3)' }}>kg</span></span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {workouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏋️</div>
            <div>Zatím žádné tréninky</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Začni svůj první trénink!</div>
          </div>
        ) : workouts.map(w => (
          <div key={w.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{w.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {new Date(w.date).toLocaleDateString('cs', { weekday: 'short', day: 'numeric', month: 'short' })} · {w.exercises?.length || 0} cviky · {w.duration ? `${w.duration} min` : ''}
              </div>
            </div>
            <button onClick={() => { if (confirm('Smazat trénink?')) { deleteWorkout(w.id); setWorkouts(getWorkouts()) } }}>
              <Trash2 size={14} color="var(--text3)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
