import { useState, useEffect, useRef } from 'react'
import { getSettings, getWorkouts, getStreak, getPRs } from '../utils/storage'
import { askCoach } from '../utils/api'
import { Send, Zap, Bot } from 'lucide-react'

const QUICK_QUESTIONS = [
  'Co trénovat dnes?',
  'Bolí mě rameno, co vynechat?',
  'Mám jíst před nebo po tréninku?',
  'Kdy udělat deload?',
  'Jak zvýšit bench press?',
  'Kolik odpočívat mezi sériemi?',
]

const Bubble = ({ msg }) => (
  <div style={{
    display: 'flex', flexDirection: 'column',
    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
    marginBottom: 12
  }}>
    {msg.role === 'assistant' && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={12} color="var(--accent)" />
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, letterSpacing: 1 }}>AI COACH</span>
      </div>
    )}
    <div style={{
      maxWidth: '85%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
      background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg3)',
      color: msg.role === 'user' ? '#080808' : 'var(--text)',
      fontSize: 14, lineHeight: 1.6, fontWeight: msg.role === 'user' ? 500 : 400,
      border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
      whiteSpace: 'pre-wrap'
    }}>
      {msg.content}
    </div>
  </div>
)

export default function AICoach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Čau! Jsem tvůj AI fitness coach. Zeptej se mě na cokoli ohledně tréninku, výživy nebo progressu. 💪' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const settings = getSettings()
  const bottomRef = useRef()

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const getContext = () => {
    const workouts = getWorkouts()
    const prs = getPRs()
    return {
      name: settings.name || 'kamaráde',
      streak: getStreak(),
      workoutCount: workouts.length,
      recentWorkouts: workouts.slice(0, 3).map(w => w.name).join(', '),
      prs: Object.entries(prs).slice(0, 5).map(([k, v]) => `${k}: ${v.weight}kg`).join(', ')
    }
  }

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    if (!settings.apiKey) {
      setMessages(p => [...p, { role: 'user', content: msg }, { role: 'assistant', content: '⚠️ Nemám API klíč. Nastav ho prosím v Nastavení (ikonka ⚙️ nahoře vpravo).' }])
      setInput('')
      return
    }
    setMessages(p => [...p, { role: 'user', content: msg }])
    setInput('')
    setLoading(true)
    try {
      const reply = await askCoach(settings.apiKey, msg, getContext())
      setMessages(p => [...p, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: 'Chyba: ' + e.message }])
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 'var(--nav-h)' }}>
      {/* Header */}
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 1 }}>AI COACH</div>
        <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: settings.apiKey ? 'var(--green)' : 'var(--red)' }} />
          {settings.apiKey ? 'Připojeno' : 'Bez API klíče — nastav v ⚙️'}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {messages.map((m, i) => <Bubble key={i} msg={m} />)}
        {loading && (
          <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '14px 14px 14px 4px', width: 'fit-content' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', animation: `pulse 1.2s ${i * 0.2}s infinite` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div style={{ padding: '8px 16px', overflowX: 'auto', display: 'flex', gap: 8, borderTop: '1px solid var(--border)' }}>
        {QUICK_QUESTIONS.map(q => (
          <button key={q} onClick={() => send(q)} style={{
            flexShrink: 0, padding: '6px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: 20, color: 'var(--text2)', fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer'
          }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 16px 12px', display: 'flex', gap: 10, background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <input
          className="input-field"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Zeptej se cokoliv..."
          style={{ flex: 1 }}
        />
        <button onClick={() => send()} disabled={!input.trim() || loading} style={{
          width: 44, height: 44, borderRadius: 'var(--r-sm)', background: input.trim() && !loading ? 'var(--accent)' : 'var(--bg3)',
          border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer'
        }}>
          <Send size={16} color={input.trim() && !loading ? '#080808' : 'var(--text3)'} />
        </button>
      </div>
    </div>
  )
}
