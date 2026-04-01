import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './GridGame.css'

// ═══════════════════════════════════════════════════════════════════════════════
//  PATTERN GENERATION  — scales to any grid size
// ═══════════════════════════════════════════════════════════════════════════════

function buildGrid(rows, cols, pattern) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill('green'))

  if (pattern === 1) {
    // Pattern 1: Blue tiles at every (3,3) intersection
    // Red tiles form a diagonal cross pattern between them
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue // player start always safe
        if (r % 3 === 1 && c % 3 === 1) {
          grid[r][c] = 'blue'
        } else if (
          (r % 3 === 0 && c % 3 === 2 && r > 0) ||
          (r % 3 === 2 && c % 3 === 0 && c > 0)
        ) {
          grid[r][c] = 'red'
        }
      }
    }
  } else {
    // Pattern 2: Harder — blue tiles at (4,4) intervals
    // Red tiles form horizontal barriers with narrow gaps
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === 0 && c === 0) continue
        if (r % 4 === 2 && c % 4 === 2) {
          grid[r][c] = 'blue'
        } else if (r % 3 === 1 && c % 5 !== 2 && r > 0) {
          grid[r][c] = 'red'
        } else if (r % 5 === 3 && c % 3 !== 1 && c > 0) {
          grid[r][c] = 'red'
        }
      }
    }
  }
  return grid
}

function countBlue(grid) {
  return grid.reduce((n, row) => n + row.filter(c => c === 'blue').length, 0)
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUDIO  — Web Audio API beeps (no external files needed)
// ═══════════════════════════════════════════════════════════════════════════════

function createAudio() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const play = (freq, type, duration, gainVal = 0.3) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(gainVal, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    }
    return {
      collect: () => { play(600, 'sine', 0.12); setTimeout(() => play(900, 'sine', 0.12), 60) },
      danger:  () => { play(150, 'sawtooth', 0.25, 0.4) },
      win:     () => {
        [523, 659, 784, 1047].forEach((f, i) =>
          setTimeout(() => play(f, 'sine', 0.3), i * 120))
      },
      lose:    () => { play(220, 'sawtooth', 0.4, 0.5); setTimeout(() => play(150, 'sawtooth', 0.4, 0.5), 200) },
      tick:    () => play(880, 'square', 0.05, 0.08),
    }
  } catch {
    return { collect: ()=>{}, danger: ()=>{}, win: ()=>{}, lose: ()=>{}, tick: ()=>{} }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_LIVES = 5
const TIME_LIMIT = 30

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function GridGame() {
  const navigate = useNavigate()
  const audioRef = useRef(null)

  // ── Config (setup screen) ───────────────────────────────────────────────────
  const [rows, setRows] = useState(12)
  const [cols, setCols] = useState(12)
  const [startPattern, setStartPattern] = useState(1)

  // ── Game state ──────────────────────────────────────────────────────────────
  const [phase, setPhase]       = useState('setup') // setup|playing|transition|win|lose
  const [grid, setGrid]         = useState([])
  const [pattern, setPattern]   = useState(1)
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 })
  const [lives, setLives]       = useState(MAX_LIVES)
  const [score, setScore]       = useState(0)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [blinkCells, setBlinkCells] = useState(new Set())
  const [collectAnim, setCollectAnim] = useState(null) // { r, c }
  const [scorePopups, setScorePopups] = useState([]) // [{id, r, c}]
  const [endMsg, setEndMsg]     = useState('')

  // ── Stable refs ─────────────────────────────────────────────────────────────
  const gridRef    = useRef([])
  const playerRef  = useRef({ r: 0, c: 0 })
  const livesRef   = useRef(MAX_LIVES)
  const phaseRef   = useRef('setup')
  const patternRef = useRef(1)
  const rowsRef    = useRef(12)
  const colsRef    = useRef(12)
  const timerRef   = useRef(null)
  const lockRef    = useRef(false) // prevent move spam

  const sync = (g, p, pl, lv, pat, r, c, ph) => {
    if (g  !== undefined) { setGrid(g);       gridRef.current = g }
    if (p  !== undefined) { setPlayerPos(p);  playerRef.current = p }
    if (lv !== undefined) { setLives(lv);     livesRef.current = lv }
    if (pat!== undefined) { setPattern(pat);  patternRef.current = pat }
    if (r  !== undefined) { rowsRef.current = r }
    if (c  !== undefined) { colsRef.current = c }
    if (ph !== undefined) { setPhase(ph);     phaseRef.current = ph }
  }

  // ── Init audio on first interaction ─────────────────────────────────────────
  const getAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = createAudio()
    return audioRef.current
  }, [])

  // ── Start / Restart ─────────────────────────────────────────────────────────
  const startGame = useCallback((pat, r, c) => {
    clearInterval(timerRef.current)
    const g = buildGrid(r, c, pat)
    sync(g, {r:0,c:0}, MAX_LIVES, undefined, pat, r, c, 'playing')
    setScore(0)
    setTimeLeft(TIME_LIMIT)
    setBlinkCells(new Set())
    setScorePopups([])
    setCollectAnim(null)
    setEndMsg('')
    lockRef.current = false
  }, [])

  // ── Timer ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          getAudio().lose()
          setPhase('lose')
          phaseRef.current = 'lose'
          setEndMsg("Time's up! The arena claims another victim.")
          return 0
        }
        if (t <= 10) getAudio().tick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [phase, getAudio])

  // ── Move player ──────────────────────────────────────────────────────────────
  const move = useCallback((dr, dc) => {
    if (phaseRef.current !== 'playing' || lockRef.current) return
    const { r, c } = playerRef.current
    const g = gridRef.current
    const R = g.length, C = g[0]?.length || 0
    const nr = r + dr, nc = c + dc
    if (nr < 0 || nr >= R || nc < 0 || nc >= C) return

    lockRef.current = true
    setTimeout(() => { lockRef.current = false }, 90)

    const cell = g[nr][nc]
    setPlayerPos({ r: nr, c: nc })
    playerRef.current = { r: nr, c: nc }

    if (cell === 'red') {
      getAudio().danger()
      const key = `${nr},${nc}`
      setBlinkCells(prev => new Set([...prev, key]))
      setTimeout(() => setBlinkCells(prev => { const s = new Set(prev); s.delete(key); return s }), 700)

      const newLives = livesRef.current - 1
      livesRef.current = newLives
      setLives(newLives)

      if (newLives <= 0) {
        clearInterval(timerRef.current)
        getAudio().lose()
        setPhase('lose')
        phaseRef.current = 'lose'
        setEndMsg('All lives lost. The arena has spoken.')
      }

    } else if (cell === 'blue') {
      getAudio().collect()

      const newGrid = g.map(row => [...row])
      newGrid[nr][nc] = 'collected'
      setGrid(newGrid)
      gridRef.current = newGrid

      // Score popup
      const popId = Date.now()
      setScorePopups(prev => [...prev, { id: popId, r: nr, c: nc }])
      setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== popId)), 700)

      setScore(s => s + 10)

      const rem = countBlue(newGrid)
      if (rem === 0) {
        clearInterval(timerRef.current)
        const pat = patternRef.current

        if (pat === 1) {
          // Auto-transition to Pattern 2
          setPhase('transition')
          phaseRef.current = 'transition'
          setEndMsg('Pattern 1 Complete! Level 2 incoming...')
          getAudio().win()
          setTimeout(() => {
            startGame(2, rowsRef.current, colsRef.current)
          }, 2200)
        } else {
          getAudio().win()
          setPhase('win')
          phaseRef.current = 'win'
          setEndMsg('All tiles collected! You conquered the arena! 🏆')
        }
      }
    }
  }, [getAudio, startGame])

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const MAP = {
      ArrowUp:[-1,0], w:[-1,0], W:[-1,0],
      ArrowDown:[1,0], s:[1,0], S:[1,0],
      ArrowLeft:[0,-1], a:[0,-1], A:[0,-1],
      ArrowRight:[0,1], d:[0,1], D:[0,1],
    }
    const h = (e) => {
      if (MAP[e.key]) { e.preventDefault(); move(...MAP[e.key]) }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [move])

  // ── Compute cell px size ─────────────────────────────────────────────────────
  const winW = typeof window !== 'undefined' ? window.innerWidth  : 1280
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800
  const maxGridW = Math.min(winW * 0.88, 920)
  const maxGridH = winH * 0.55
  const cellSize = Math.max(16, Math.min(48,
    Math.floor(Math.min(maxGridW / cols, maxGridH / rows))
  ))

  // ═══════════════════════════════════════════════════════════════════════════
  //  SETUP SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  if (phase === 'setup') {
    return (
      <div className="gg-root">
        <div className="gg-setup-bg" />
        <div className="gg-setup-wrap">
          <button className="gg-back" onClick={() => navigate('/')}>← Back to Games</button>

          <div className="gg-setup-header">
            <div className="gg-setup-chip">CHALLENGE MODE</div>
            <h1 className="gg-setup-title">Grid<br/>Challenge</h1>
            <p className="gg-setup-desc">
              Navigate the arena. Collect every blue tile. Survive the red zones.<br/>
              Complete Pattern 1 to unlock Pattern 2.
            </p>
          </div>

          <div className="gg-setup-body">
            {/* Grid size */}
            <div className="gg-section">
              <div className="gg-section-label">GRID SIZE</div>
              <div className="gg-grid-inputs">
                <div className="gg-input-wrap">
                  <label>ROWS</label>
                  <div className="gg-number-ctrl">
                    <button onClick={() => setRows(r => Math.max(10, r - 1))}>−</button>
                    <span>{rows}</span>
                    <button onClick={() => setRows(r => Math.min(30, r + 1))}>+</button>
                  </div>
                </div>
                <div className="gg-input-sep">×</div>
                <div className="gg-input-wrap">
                  <label>COLS</label>
                  <div className="gg-number-ctrl">
                    <button onClick={() => setCols(c => Math.max(10, c - 1))}>−</button>
                    <span>{cols}</span>
                    <button onClick={() => setCols(c => Math.min(30, c + 1))}>+</button>
                  </div>
                </div>
              </div>
              <p className="gg-min-note">Minimum 10 × 10 &nbsp;·&nbsp; Max 30 × 30</p>
            </div>

            {/* Pattern select */}
            <div className="gg-section">
              <div className="gg-section-label">STARTING PATTERN</div>
              <div className="gg-patterns">
                <button
                  className={`gg-pat ${startPattern === 1 ? 'active' : ''}`}
                  onClick={() => setStartPattern(1)}
                >
                  <div className="gg-pat-preview gg-pat-preview--1">
                    {Array.from({length:9},(_,i)=>(
                      <div key={i} className={`gg-pp-cell ${i===4?'blue':i%4===0?'red':'green'}`}/>
                    ))}
                  </div>
                  <div className="gg-pat-info">
                    <span className="gg-pat-num">01</span>
                    <span className="gg-pat-name">Classic Grid</span>
                    <span className="gg-pat-diff gg-diff-easy">● BEGINNER</span>
                  </div>
                </button>
                <button
                  className={`gg-pat ${startPattern === 2 ? 'active' : ''}`}
                  onClick={() => setStartPattern(2)}
                >
                  <div className="gg-pat-preview gg-pat-preview--2">
                    {Array.from({length:9},(_,i)=>(
                      <div key={i} className={`gg-pp-cell ${i===8?'blue':i===1||i===7?'red':i===3||i===5?'red':'green'}`}/>
                    ))}
                  </div>
                  <div className="gg-pat-info">
                    <span className="gg-pat-num">02</span>
                    <span className="gg-pat-name">Corridor Rush</span>
                    <span className="gg-pat-diff gg-diff-hard">● ADVANCED</span>
                  </div>
                </button>
              </div>
            </div>

            <button
              className="gg-start-btn"
              onClick={() => startGame(startPattern, rows, cols)}
            >
              START GAME
            </button>
          </div>

          {/* Legend */}
          <div className="gg-legend">
            {[
              { cls:'blue',   label:'Blue Tile',  desc:'Collect for +10 pts' },
              { cls:'red',    label:'Red Tile',   desc:'Blinks — lose 1 life' },
              { cls:'green',  label:'Safe Zone',  desc:'Move freely' },
              { cls:'player', label:'You',        desc:'Arrow keys / WASD' },
            ].map(({ cls, label, desc }) => (
              <div key={cls} className="gg-legend-row">
                <div className={`gg-legend-swatch ${cls}`} />
                <div><strong>{label}</strong> — {desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  GAME SCREEN
  // ═══════════════════════════════════════════════════════════════════════════

  const isEnd = phase === 'win' || phase === 'lose'
  const isTransition = phase === 'transition'
  const blueTotal = countBlue(grid)
  const timerPct = (timeLeft / TIME_LIMIT) * 100
  const timerUrgent = timeLeft <= 10

  return (
    <div className="gg-root gg-game">
      <div className="gg-game-bg" />

      {/* ── HUD ───────────────────────────────────────────────────────── */}
      <div className="gg-hud">
        <div className="gg-hud-left">
          <button className="gg-hud-back" onClick={() => { clearInterval(timerRef.current); setPhase('setup') }}>
            ← Setup
          </button>
          <div className="gg-hud-pat-badge">PATTERN {pattern}</div>
          <div className="gg-hud-grid-info">{rows} × {cols}</div>
        </div>

        {/* Timer */}
        <div className="gg-hud-center">
          <div className={`gg-timer-ring ${timerUrgent ? 'urgent' : ''}`}>
            <svg viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" />
              <circle
                cx="30" cy="30" r="26"
                className="gg-timer-progress"
                style={{ strokeDashoffset: `${163.36 * (1 - timerPct / 100)}` }}
              />
            </svg>
            <span className="gg-timer-num">{String(timeLeft).padStart(2,'0')}</span>
          </div>
        </div>

        <div className="gg-hud-right">
          <div className="gg-hud-stat">
            <span className="gg-hud-label">SCORE</span>
            <span className="gg-score">{score}</span>
          </div>
          <div className="gg-hud-stat">
            <span className="gg-hud-label">LEFT</span>
            <span className="gg-blue-count">{blueTotal} 🔵</span>
          </div>
        </div>
      </div>

      {/* Hearts row */}
      <div className="gg-hearts-row">
        {Array.from({length: MAX_LIVES}).map((_, i) => (
          <span key={i} className={`gg-heart ${i < lives ? 'alive' : 'dead'}`}>♥</span>
        ))}
      </div>

      {/* Timer bar */}
      <div className="gg-timer-bar-wrap">
        <div
          className={`gg-timer-bar ${timerUrgent ? 'urgent' : ''}`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* ── Transition banner ─────────────────────────────────────── */}
      {isTransition && (
        <div className="gg-transition-banner">
          <span className="gg-transition-icon">⭐</span>
          {endMsg}
          <span className="gg-transition-icon">⭐</span>
        </div>
      )}

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div className="gg-grid-wrap">
        <div
          className="gg-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
            gap: '2px',
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPos.r === r && playerPos.c === c
              const isBlinking = blinkCells.has(`${r},${c}`)
              const hasPopup = scorePopups.some(p => p.r === r && p.c === c)

              return (
                <div
                  key={`${r},${c}`}
                  className={[
                    'gg-cell',
                    `gg-cell--${cell}`,
                    isPlayer    ? 'gg-cell--player'  : '',
                    isBlinking  ? 'gg-cell--blink'   : '',
                  ].filter(Boolean).join(' ')}
                  style={{ width: cellSize, height: cellSize, fontSize: cellSize * 0.4 }}
                >
                  {hasPopup && <span className="gg-popup">+10</span>}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Mobile D-pad ──────────────────────────────────────────── */}
      <div className="gg-dpad">
        <div className="gg-dpad-row">
          <button className="gg-dpad-btn" onTouchStart={e=>{e.preventDefault();move(-1,0)}} onClick={()=>move(-1,0)}>▲</button>
        </div>
        <div className="gg-dpad-row">
          <button className="gg-dpad-btn" onTouchStart={e=>{e.preventDefault();move(0,-1)}} onClick={()=>move(0,-1)}>◀</button>
          <div className="gg-dpad-center" />
          <button className="gg-dpad-btn" onTouchStart={e=>{e.preventDefault();move(0,1)}} onClick={()=>move(0,1)}>▶</button>
        </div>
        <div className="gg-dpad-row">
          <button className="gg-dpad-btn" onTouchStart={e=>{e.preventDefault();move(1,0)}} onClick={()=>move(1,0)}>▼</button>
        </div>
      </div>

      {/* ── Win / Lose overlay ────────────────────────────────────── */}
      {isEnd && (
        <div className={`gg-overlay gg-overlay--${phase}`}>
          <div className="gg-overlay-card">
            <div className="gg-overlay-emoji">{phase === 'win' ? '🏆' : '💀'}</div>
            <h2 className="gg-overlay-title">
              {phase === 'win' ? 'VICTORY' : 'GAME OVER'}
            </h2>
            <p className="gg-overlay-msg">{endMsg}</p>
            <div className="gg-overlay-scoreboard">
              <div className="gg-ob-stat">
                <span>Score</span>
                <strong>{score}</strong>
              </div>
              <div className="gg-ob-divider" />
              <div className="gg-ob-stat">
                <span>Lives Left</span>
                <strong>{lives} ♥</strong>
              </div>
              <div className="gg-ob-divider" />
              <div className="gg-ob-stat">
                <span>Time Left</span>
                <strong>{timeLeft}s</strong>
              </div>
            </div>
            <div className="gg-overlay-btns">
              <button className="gg-ob-btn primary" onClick={() => startGame(1, rows, cols)}>
                Play Again
              </button>
              <button className="gg-ob-btn" onClick={() => setPhase('setup')}>
                Settings
              </button>
              <button className="gg-ob-btn" onClick={() => navigate('/')}>
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
