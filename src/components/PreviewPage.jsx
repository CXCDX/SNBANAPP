import { useState, useEffect } from 'react'
import { AD_FORMATS, getPlatformLabel } from '../utils/formats'

const PLATFORM_ORDER = ['instagram', 'social', 'google', 'sharkninja', 'trendyol', 'hepsiburada', 'amazon_tr']

export default function PreviewPage({ previewId }) {
  const [data, setData] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [showRevisionInput, setShowRevisionInput] = useState(false)
  const [comment, setComment] = useState('')
  const [approved, setApproved] = useState(false)
  const [revisionSent, setRevisionSent] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`banner-preview-${previewId}`)
      if (!raw) { setNotFound(true); return }
      const parsed = JSON.parse(raw)
      setData(parsed)
      // Check if already has feedback
      if (parsed.feedback) {
        if (parsed.feedback.type === 'approved') setApproved(true)
        if (parsed.feedback.type === 'revision') setRevisionSent(true)
      }
    } catch {
      setNotFound(true)
    }
  }, [previewId])

  const handleApprove = () => {
    const updated = { ...data, feedback: { type: 'approved', date: new Date().toISOString() } }
    localStorage.setItem(`banner-preview-${previewId}`, JSON.stringify(updated))
    setData(updated)
    setApproved(true)
    setShowRevisionInput(false)
  }

  const handleSendRevision = () => {
    if (!comment.trim()) return
    const updated = {
      ...data,
      feedback: { type: 'revision', comment: comment.trim(), date: new Date().toISOString() },
    }
    localStorage.setItem(`banner-preview-${previewId}`, JSON.stringify(updated))
    setData(updated)
    setRevisionSent(true)
    setShowRevisionInput(false)
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <p className="font-mono text-[14px] text-ink mb-2">Preview bulunamadı</p>
          <p className="font-mono text-[12px] text-secondary">
            Bu link geçersiz veya tarayıcı verileri temizlenmiş olabilir.
          </p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="font-mono text-[12px] text-secondary">Yükleniyor...</p>
      </div>
    )
  }

  // Group thumbnails by platform
  const grouped = {}
  for (const platform of PLATFORM_ORDER) {
    const formats = AD_FORMATS.filter(f => f.platform === platform)
    const withThumbs = formats.filter(f => data.thumbnails[f.id])
    if (withThumbs.length > 0) {
      grouped[platform] = withThumbs
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div
        className="sticky top-0 z-10 bg-bg flex items-center justify-between px-8 py-4"
        style={{ borderBottom: '1px solid #E0E0DC' }}
      >
        <div>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', fontWeight: 700, color: '#0A0A0A' }}>
            {data.brand || 'SharkNinja'} — Banner Preview
          </h1>
          <p className="font-mono text-[11px] text-secondary mt-0.5">
            {new Date(data.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}&middot;{' '}{Object.keys(data.thumbnails).length} format
          </p>
        </div>

        <div className="flex items-center gap-3">
          {approved && (
            <span className="font-mono text-[11px] px-3 py-1.5" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
              Onaylandı
            </span>
          )}
          {revisionSent && !approved && (
            <span className="font-mono text-[11px] px-3 py-1.5" style={{ background: '#FFF3E0', color: '#E65100' }}>
              Revizyon istendi
            </span>
          )}
          {!approved && !revisionSent && (
            <>
              <button
                onClick={handleApprove}
                className="font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 cursor-pointer transition-all"
                style={{ background: '#2E7D32', color: '#FFFFFF', border: '1px solid #2E7D32' }}
              >
                Onayla
              </button>
              <button
                onClick={() => setShowRevisionInput(!showRevisionInput)}
                className="font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 cursor-pointer transition-all"
                style={{ background: 'transparent', color: '#0A0A0A', border: '1px solid #E0E0DC' }}
              >
                Revizyon İste
              </button>
            </>
          )}
        </div>
      </div>

      {/* Revision comment input */}
      {showRevisionInput && (
        <div className="px-8 py-4" style={{ background: '#FAFAF8', borderBottom: '1px solid #E0E0DC' }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Revizyon notunuz..."
            className="w-full font-mono text-[12px] text-ink bg-surface p-3 resize-y"
            style={{ border: '1px solid #E0E0DC', minHeight: '80px', outline: 'none' }}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSendRevision}
              disabled={!comment.trim()}
              className="font-mono text-[11px] uppercase tracking-[0.1em] px-4 py-1.5 cursor-pointer transition-all disabled:opacity-30"
              style={{ background: '#0A0A0A', color: '#FAFAF8', border: '1px solid #0A0A0A' }}
            >
              Gönder
            </button>
          </div>
        </div>
      )}

      {/* Revision feedback display */}
      {data.feedback?.type === 'revision' && (
        <div className="px-8 py-3" style={{ background: '#FFF3E0', borderBottom: '1px solid #E0E0DC' }}>
          <p className="font-mono text-[11px] text-secondary mb-1">Revizyon notu:</p>
          <p className="font-mono text-[12px] text-ink">{data.feedback.comment}</p>
        </div>
      )}

      {/* Banner grid by platform */}
      <div className="px-8 py-6 space-y-8">
        {Object.entries(grouped).map(([platform, formats]) => (
          <section key={platform}>
            <h2
              className="font-mono uppercase tracking-[0.12em] text-secondary mb-4"
              style={{ fontSize: '11px', letterSpacing: '0.12em' }}
            >
              {getPlatformLabel(platform)}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formats.map(format => (
                <div key={format.id} className="group">
                  <div
                    className="w-full overflow-hidden"
                    style={{ border: '1px solid #E0E0DC' }}
                  >
                    <img
                      src={data.thumbnails[format.id]}
                      alt={format.name}
                      className="w-full block"
                      style={{
                        aspectRatio: `${format.width}/${format.height}`,
                        objectFit: 'cover',
                        maxHeight: '260px',
                      }}
                    />
                  </div>
                  <p className="font-mono text-ink mt-1" style={{ fontSize: '11px' }}>
                    {format.name}
                  </p>
                  <p className="font-mono text-secondary" style={{ fontSize: '11px' }}>
                    {format.width}&times;{format.height}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
