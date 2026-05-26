const BASE = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-opus-4-20250514'

const callAPI = async (apiKey, messages, system = '', maxTokens = 1024) => {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, system, messages })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export const analyzePhotoProgress = async (apiKey, photo1Base64, photo2Base64, daysBetween) => {
  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: `Toto jsou dvě fotky mého fyzického progressu s odstupem ${daysBetween} dní. Analyzuj prosím co se změnilo — zaměř se konkrétně na: svalovou hmotu (ramena, hrudník, paže, záda, břicho), definici, celkový tvar těla. Buď konkrétní a upřímný. Odpovídej česky. Formát: nejprve co se zlepšilo ✅, pak co potřebuje práci 💪, pak celkové hodnocení progressu.` },
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo1Base64 } },
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photo2Base64 } },
    ]
  }]
  return callAPI(apiKey, messages, 'Jsi fitness coach expert na analýzu tělesného progressu.', 800)
}

export const askCoach = async (apiKey, userMessage, context) => {
  const system = `Jsi osobní fitness coach pro ${context.name || 'uživatele'}, který má tato data:
- Trénuje ${context.workoutCount || 0}x celkem, streak ${context.streak || 0} dní
- Poslední tréninky: ${context.recentWorkouts || 'žádné'}
- Oblíbené cviky a PR: ${context.prs || 'žádné'}
- Cíl: nabrat svalovou hmotu
- Věk: 18 let, výška 173cm, váha ~60kg
Odpovídej česky, buď konkrétní, přátelský ale přímý. Krátké odpovědi (max 150 slov).`
  return callAPI(apiKey, [{ role: 'user', content: userMessage }], system, 300)
}

export const suggestProgression = async (apiKey, exerciseName, history) => {
  const system = 'Jsi strength coach. Odpovídej česky, max 2 věty, buď konkrétní.'
  const msg = `Cvik: ${exerciseName}\nHistorie posledních trénink: ${JSON.stringify(history.slice(0, 5))}\nMám přidat váhu? Pokud ano, o kolik?`
  return callAPI(apiKey, [{ role: 'user', content: msg }], system, 100)
}
