// Simple localStorage wrapper with JSON support

const PREFIX = 'fittrack_'

export const storage = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(PREFIX + key)
      return val !== null ? JSON.parse(val) : fallback
    } catch { return fallback }
  },
  set: (key, value) => {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch {}
  },
  remove: (key) => { localStorage.removeItem(PREFIX + key) }
}

// Workout helpers
export const getWorkouts = () => storage.get('workouts', [])
export const saveWorkout = (workout) => {
  const workouts = getWorkouts()
  const idx = workouts.findIndex(w => w.id === workout.id)
  if (idx >= 0) workouts[idx] = workout
  else workouts.unshift(workout)
  storage.set('workouts', workouts)
  return workout
}
export const deleteWorkout = (id) => {
  storage.set('workouts', getWorkouts().filter(w => w.id !== id))
}

// Exercise history helpers
export const getExerciseHistory = (name) => {
  const all = storage.get('exercise_history', {})
  return all[name] || []
}
export const addExerciseHistory = (name, entry) => {
  const all = storage.get('exercise_history', {})
  if (!all[name]) all[name] = []
  all[name].unshift({ ...entry, date: new Date().toISOString() })
  if (all[name].length > 50) all[name] = all[name].slice(0, 50)
  storage.set('exercise_history', all)
}
export const getAllExerciseNames = () => {
  return Object.keys(storage.get('exercise_history', {}))
}

// PRs
export const getPRs = () => storage.get('prs', {})
export const updatePR = (exercise, weight, reps) => {
  const prs = getPRs()
  const current = prs[exercise]
  const newEntry = { weight, reps, date: new Date().toISOString() }
  if (!current || weight > current.weight || (weight === current.weight && reps > current.reps)) {
    prs[exercise] = newEntry
    storage.set('prs', prs)
    return true // new PR!
  }
  return false
}

// Photos
export const getPhotos = () => storage.get('progress_photos', [])
export const addPhoto = (photo) => {
  const photos = getPhotos()
  photos.unshift({ ...photo, id: Date.now(), date: new Date().toISOString() })
  storage.set('progress_photos', photos)
  return photos[0]
}
export const deletePhoto = (id) => {
  storage.set('progress_photos', getPhotos().filter(p => p.id !== id))
}

// Nutrition
export const getNutritionLog = () => storage.get('nutrition', [])
export const addNutritionEntry = (entry) => {
  const log = getNutritionLog()
  log.unshift({ ...entry, id: Date.now(), date: new Date().toISOString() })
  // keep last 90 days
  storage.set('nutrition', log.slice(0, 500))
}
export const getTodayNutrition = () => {
  const today = new Date().toDateString()
  return getNutritionLog().filter(e => new Date(e.date).toDateString() === today)
}
export const getFavoriteFoods = () => storage.get('favorite_foods', [
  { name: 'Tvaroh 250g', calories: 200, protein: 28, carbs: 8, fat: 4 },
  { name: 'Protein shake', calories: 150, protein: 25, carbs: 10, fat: 2 },
  { name: 'Kuřecí 150g', calories: 240, protein: 38, carbs: 0, fat: 8 },
  { name: 'Vejce 3ks', calories: 220, protein: 18, carbs: 1, fat: 15 },
  { name: 'Rýže 100g', calories: 350, protein: 7, carbs: 78, fat: 1 },
])
export const addFavoriteFood = (food) => {
  const favs = getFavoriteFoods()
  favs.push({ ...food, id: Date.now() })
  storage.set('favorite_foods', favs)
}

// Supplements
export const getSupplementLog = () => storage.get('supplement_log', {})
export const toggleSupplement = (name) => {
  const today = new Date().toDateString()
  const log = getSupplementLog()
  if (!log[today]) log[today] = {}
  log[today][name] = !log[today][name]
  storage.set('supplement_log', log)
  return log[today][name]
}
export const getTodaySupplements = () => {
  const today = new Date().toDateString()
  return getSupplementLog()[today] || {}
}

// Body weight
export const getWeightLog = () => storage.get('weight_log', [])
export const addWeight = (kg) => {
  const log = getWeightLog()
  log.unshift({ kg, date: new Date().toISOString() })
  storage.set('weight_log', log)
}

// Settings
export const getSettings = () => storage.get('settings', {
  name: '',
  goal_calories: 2800,
  goal_protein: 150,
  apiKey: '',
  supplements_training: ['Kreatin', 'Pre-workout', 'Protein'],
  supplements_rest: ['Kreatin', 'Tvaroh'],
  workout_days: 3,
})
export const saveSettings = (s) => storage.set('settings', s)

// Streak
export const getStreak = () => {
  const workouts = getWorkouts()
  if (!workouts.length) return 0
  const dates = [...new Set(workouts.map(w => new Date(w.date).toDateString()))]
  let streak = 0
  const now = new Date()
  for (let i = 0; i < 90; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (dates.includes(d.toDateString())) streak++
    else if (i > 0) break
  }
  return streak
}

export const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
