import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './GameSelection.css'

const GAMES = [
  {
    id: 'shooter',
    title: 'Sharp Shooter',
    subtitle: 'PRECISION · ACTION',
    tag: 'MULTIPLAYER',
    image: '/assets/shooter.jpg',
    players: '2–4 Players',
    rating: '4.9',
    accent: '#ff2d55',
    accentDark: '#8b0021',
    desc: 'Two teams. One arena. Precision separates survivors from casualties in this high-stakes tactical shooter.',
  },
  {
    id: 'redlight',
    title: 'Red Light\nGreen Light',
    subtitle: 'REFLEX · SURVIVAL',
    tag: 'ELIMINATION',
    image: '/assets/red_light_green_light.jpg',
    players: '2–8 Players',
    rating: '4.8',
    accent: '#00e676',
    accentDark: '#004d25',
    desc: 'Move on green. Freeze on red. One twitch at the wrong moment ends everything.',
  },
  {
    id: 'color',
    title: 'Find the Color',
    subtitle: 'SPEED · PUZZLE',
    tag: 'RACING',
    image: '/assets/find_the_color.jpg',
    players: '1–6 Players',
    rating: '4.7',
    accent: '#ff9f00',
    accentDark: '#7a3d00',
    desc: 'Explosive comic-burst chaos. Hunt the hidden hue before time detonates around you.',
  },
  {
    id: 'lava',
    title: 'Escape the Lava',
    subtitle: 'STRATEGY · ADVENTURE',
    tag: 'SURVIVAL',
    image: '/assets/escape_the_lava.jpg',
    players: '1–4 Players',
    rating: '5.0',
    accent: '#ff6b1a',
    accentDark: '#6b1a00',
    desc: 'The earth burns beneath you. Collect every diamond as the lava swallows the world.',
  },
]

const PLACEHOLDER_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

function StarRating({ value }) {
  return (
    <span className="gs-stars">
      {'★'.repeat(Math.round(value))}{'☆'.repeat(5 - Math.round(value))}
    </span>
  )
}

export default function GameSelection() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState(null)
  const [dir, setDir] = useState(1) // 1 = forward, -1 = back
  const [videoOpen, setVideoOpen] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const touchStartX = useRef(null)
  const navigate = useNavigate()
  const game = GAMES[current]

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const goTo = useCallback((idx) => {
    if (transitioning) return
    const next = (idx + GAMES.length) % GAMES.length
    if (next === current) return
    const d = next > current || (current === GAMES.length - 1 && next === 0) ? 1 : -1
    setDir(d)
    setPrev(current)
    setTransitioning(true)
    setTimeout(() => {
      setCurrent(next)
      setPrev(null)
      setTransitioning(false)
    }, 480)
  }, [current, transitioning])

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])
  const goNext = useCallback(() => goTo(current + 1), [current, goTo])

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (videoOpen) { if (e.key === 'Escape') setVideoOpen(false); return }
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'Enter') setVideoOpen(true)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goPrev, goNext, videoOpen])

  // Touch swipe
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 45) dx > 0 ? goNext() : goPrev()
    touchStartX.current = null
  }

  return (
    <div
      className={`gs-root ${loaded ? 'gs-loaded' : ''}`}
      style={{ '--accent': game.accent, '--accent-dark': game.accentDark }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Full-screen cinematic background */}
      <div className="gs-bg-layer">
        {GAMES.map((g, i) => (
          <div
            key={g.id}
            className={`gs-bg-img ${i === current ? 'gs-bg-img--active' : ''}`}
            style={{ backgroundImage: `url(${g.image})` }}
          />
        ))}
        <div className="gs-bg-vignette" />
        <div className="gs-bg-gradient" />
        <div className="gs-bg-noise" />
      </div>

      {/* Header */}
      <header className="gs-header">
        <div className="gs-logo">
          <span>F</span><span>O</span><span>G</span>
          <span className="gs-logo-dot">●</span>
          <span className="gs-logo-sub">GAME ARENA</span>
        </div>
        <nav className="gs-nav">
          <button className="gs-nav-link gs-nav-link--active">Games</button>
          <button className="gs-nav-link" onClick={() => navigate('/grid-game')}>Grid Challenge</button>
        </nav>
      </header>

      {/* Main layout */}
      <main className="gs-main">
        {/* Left: Meta info */}
        <div className="gs-meta" key={`meta-${current}`}>
          <div className="gs-tag">{game.tag}</div>
          <h1 className="gs-title">{game.title}</h1>
          <p className="gs-subtitle">{game.subtitle}</p>
          <p className="gs-desc">{game.desc}</p>

          <div className="gs-stats">
            <div className="gs-stat">
              <span className="gs-stat-label">PLAYERS</span>
              <span className="gs-stat-val">{game.players}</span>
            </div>
            <div className="gs-stat-divider" />
            <div className="gs-stat">
              <span className="gs-stat-label">RATING</span>
              <span className="gs-stat-val">{game.rating} <StarRating value={parseFloat(game.rating)} /></span>
            </div>
          </div>

          <div className="gs-actions">
            <button className="gs-btn-play" onClick={() => setVideoOpen(true)}>
              <span className="gs-btn-play-icon">▶</span>
              Watch Preview
            </button>
            <button className="gs-btn-secondary" onClick={() => navigate('/grid-game')}>
              Play Grid Game
            </button>
          </div>
        </div>

        {/* Right: Carousel */}
        <div className="gs-carousel-area">
          <button className="gs-arrow gs-arrow--left" onClick={goPrev} aria-label="Previous">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="gs-carousel">
            {GAMES.map((g, i) => {
              let offset = i - current
              if (offset > GAMES.length / 2) offset -= GAMES.length
              if (offset < -GAMES.length / 2) offset += GAMES.length
              if (Math.abs(offset) > 2) return null

              const isActive = offset === 0

              return (
                <div
                  key={g.id}
                  className={`gs-card ${isActive ? 'gs-card--active' : ''} gs-card--offset-${offset < 0 ? 'neg' : 'pos'}${Math.abs(offset)}`}
                  style={{
                    '--card-accent': g.accent,
                    zIndex: 10 - Math.abs(offset),
                    transform: isActive
                      ? 'translateX(0) scale(1) rotateY(0deg)'
                      : `translateX(${offset * 56}%) scale(${1 - Math.abs(offset) * 0.12}) rotateY(${offset * -15}deg)`,
                    opacity: isActive ? 1 : 1 - Math.abs(offset) * 0.45,
                    filter: isActive ? 'none' : `brightness(${1 - Math.abs(offset) * 0.4})`,
                  }}
                  onClick={() => isActive ? setVideoOpen(true) : goTo(i)}
                >
                  <div className="gs-card-img-wrap">
                    <img src={g.image} alt={g.title} draggable={false} />
                    <div className="gs-card-overlay" />
                    {isActive && <div className="gs-card-active-glow" />}
                  </div>

                  {isActive && (
                    <div className="gs-card-play-badge">
                      <span>▶</span>
                    </div>
                  )}

                  <div className="gs-card-footer">
                    <span className="gs-card-tag">{g.tag}</span>
                    <h3 className="gs-card-name">{g.title.replace('\n', ' ')}</h3>
                  </div>
                </div>
              )
            })}
          </div>

          <button className="gs-arrow gs-arrow--right" onClick={goNext} aria-label="Next">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </main>

      {/* Bottom dots */}
      <div className="gs-dots">
        {GAMES.map((_, i) => (
          <button
            key={i}
            className={`gs-dot ${i === current ? 'gs-dot--active' : ''}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>

      {/* Video Modal */}
      {videoOpen && (
        <div className="gs-modal-bg" onClick={() => setVideoOpen(false)}>
          <div className="gs-modal" onClick={e => e.stopPropagation()}>
            <div className="gs-modal-bar">
              <div className="gs-modal-info">
                <span className="gs-modal-tag" style={{ color: game.accent }}>{game.tag}</span>
                <span className="gs-modal-title">{game.title.replace('\n', ' ')}</span>
              </div>
              <button className="gs-modal-x" onClick={() => setVideoOpen(false)}>✕</button>
            </div>
            <video
              className="gs-modal-video"
              src={PLACEHOLDER_VIDEO}
              autoPlay
              controls
              poster={game.image}
            />
          </div>
        </div>
      )}
    </div>
  )
}
