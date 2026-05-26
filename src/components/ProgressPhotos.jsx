import { useState, useEffect, useRef } from 'react'
import { getPhotos, addPhoto, deletePhoto, getSettings } from '../utils/storage'
import { analyzePhotoProgress } from '../utils/api'
import { Camera, Trash2, Zap, ChevronLeft, ChevronRight, X } from 'lucide-react'

const compressImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = e => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 800
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = height * MAX / width; width = MAX }
        else { width = width * MAX / height; height = MAX }
      }
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1])
    }
    img.onerror = reject
    img.src = e.target.result
  }
  reader.onerror = reject
  reader.readAsDataURL(file)
})

export default function ProgressPhotos() {
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)
  const [compareIdx, setCompareIdx] = useState(0)
  const [view, setView] = useState('grid') // grid | timeline | compare
  const fileRef = useRef()
  const settings = getSettings()

  useEffect(() => { setPhotos(getPhotos()) }, [])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setLoading(true)
      const base64 = await compressImage(file)
      const note = prompt('Popis (volitelné, např. "Po chest day")') || ''
      addPhoto({ base64, note, mimeType: 'image/jpeg' })
      setPhotos(getPhotos())
    } catch (err) { alert('Chyba při nahrávání fotky') }
    setLoading(false)
    e.target.value = ''
  }

  const analyzeProgress = async () => {
    if (photos.length < 2) { alert('Potřebuješ alespoň 2 fotky k porovnání'); return }
    if (!settings.apiKey) { alert('Nastav svůj API klíč v nastavení (⚙️)'); return }
    const newest = photos[0]
    const older = photos[compareIdx + 1] || photos[photos.length - 1]
    const days = Math.round((new Date(newest.date) - new Date(older.date)) / 86400000)
    setLoading(true)
    setAnalysis('')
    try {
      const result = await analyzePhotoProgress(settings.apiKey, older.base64, newest.base64, Math.abs(days))
      setAnalysis(result)
    } catch (e) { setAnalysis('Chyba: ' + e.message) }
    setLoading(false)
  }

  return (
    <div className="page">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, letterSpacing: 1, marginBottom: 4 }}>PROGRESS</div>
      <div style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 20 }}>{photos.length} fotek</div>

      {/* Upload button */}
      <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={handleUpload} style={{ display: 'none' }} />
      <button onClick={() => fileRef.current.click()} className="btn-primary" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Camera size={18} /> {loading ? 'Nahrávám...' : 'Přidat fotku'}
      </button>

      {/* AI Analysis */}
      {photos.length >= 2 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(232,255,71,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="card-title" style={{ fontSize: 18, marginBottom: 0 }}>AI ANALÝZA</span>
            {photos.length > 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Porovnat s:</span>
                <select value={compareIdx} onChange={e => setCompareIdx(parseInt(e.target.value))}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '4px 8px', borderRadius: 'var(--r-sm)', fontSize: 12 }}>
                  {photos.slice(1).map((p, i) => (
                    <option key={p.id} value={i}>{new Date(p.date).toLocaleDateString('cs', { day: 'numeric', month: 'short' })}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[photos[0], photos[compareIdx + 1] || photos[photos.length - 1]].map((p, i) => p && (
              <div key={p.id} style={{ position: 'relative' }}>
                <img src={`data:image/jpeg;base64,${p.base64}`} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--r-sm)', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: 'white' }}>
                  {i === 0 ? 'Teď' : new Date(p.date).toLocaleDateString('cs', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>

          <button onClick={analyzeProgress} style={{
            width: '100%', padding: '11px', background: loading ? 'var(--bg3)' : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: 'none', borderRadius: 'var(--r-sm)', color: loading ? 'var(--text3)' : '#080808',
            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            <Zap size={16} /> {loading ? 'Analyzuji...' : 'Analyzovat progress'}
          </button>

          {analysis && (
            <div className="fade-in" style={{ marginTop: 12, background: 'var(--bg3)', borderRadius: 'var(--r-sm)', padding: '12px 14px', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--text)' }}>
              {analysis}
            </div>
          )}
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
          <div>Žádné fotky zatím</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Přidej první fotku svého progressu</div>
        </div>
      ) : (
        <>
          <div className="section-label">VŠECHNY FOTKY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {photos.map(p => (
              <div key={p.id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setSelected(p)}>
                <img src={`data:image/jpeg;base64,${p.base64}`} alt="" style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 'var(--r-sm)', display: 'block' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', borderRadius: '0 0 var(--r-sm) var(--r-sm)', padding: '16px 6px 6px', fontSize: 10, color: 'white' }}>
                  {new Date(p.date).toLocaleDateString('cs', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Photo detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{new Date(selected.date).toLocaleDateString('cs', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              {selected.note && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{selected.note}</div>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { if (confirm('Smazat fotku?')) { deletePhoto(selected.id); setPhotos(getPhotos()); setSelected(null) } }}>
                <Trash2 size={18} color="var(--red)" />
              </button>
              <button onClick={() => setSelected(null)}><X size={22} color="var(--text)" /></button>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <img src={`data:image/jpeg;base64,${selected.base64}`} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--r)' }} />
          </div>
        </div>
      )}
    </div>
  )
}
