import { useCallback, useEffect, useState } from 'react'
import { SudokuGrid, emptyBoard } from './SudokuGrid'
import { solveSudoku, validateSudoku } from '../api/sudoku'
import './Sudoku.css'

export default function Sudoku() {
  const [board, setBoard] = useState(emptyBoard(9))
  const [appliedSideLength, setAppliedSideLength] = useState(9)
  const [appliedShape, setAppliedShape] = useState({ rows: 3, cols: 3 })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error' | ''
  const [loading, setLoading] = useState(false)

  // settings dialog state
  const [showSettings, setShowSettings] = useState(false)
  const [sideLength, setSideLength] = useState(9)
  const [shapeOptions, setShapeOptions] = useState([])
  const [selectedShape, setSelectedShape] = useState(null)
  const [sideLengthError, setSideLengthError] = useState('')

  const isPrime = (n) => {
    if (n < 2) return false
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false
    }
    return true
  }

  const computeShapes = (n) => {
    const opts = []
    for (let i = 1; i <= n; i++) {
      if (n % i === 0) {
        const rows = i
        const cols = n / i
        if (rows === 1 || cols === 1) continue
        opts.push({ rows, cols })
      }
    }
    return opts
  }

  const applySettings = () => {
    if (sideLengthError || !selectedShape) return
    const size = sideLength
    if (size === appliedSideLength) {
      setAppliedShape(selectedShape)
      setShowSettings(false)
      return
    }

    setBoard(Array(size).fill(null).map(() => Array(size).fill(0)))
    setAppliedSideLength(size)
    setAppliedShape(selectedShape)
    setShowSettings(false)
  }

  const handleSideLengthChange = (e) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v)) {
      setSideLength(e.target.value)
      setSideLengthError('')
      return
    }

    setSideLength(v)

    if (v < 4 || v > 16) {
      setSideLengthError('边长必须在 4 到 16 之间')
      return
    }
    if (isPrime(v)) {
      setSideLengthError('边长不能为质数')
      return
    }

    setSideLengthError('')
    const opts = computeShapes(v)
    setShapeOptions(opts)
    if (!opts.some(o => o.rows === (selectedShape?.rows || 0) && o.cols === (selectedShape?.cols || 0))) {
      setSelectedShape(opts[0] || null)
    }
  }

  useEffect(() => {
    const opts = computeShapes(sideLength)
    setShapeOptions(opts)
    setSelectedShape(opts[0] || null)
  }, [])

  const handleClear = useCallback(() => {
    setBoard(emptyBoard(appliedSideLength))
    setMessage('')
    setMessageType('')
  }, [appliedSideLength])

  const handleValidate = useCallback(async () => {
    setMessage('')
    setMessageType('')
    setLoading(true)
    try {
      const data = await validateSudoku(board, [appliedShape.rows, appliedShape.cols])
      setMessage(data.message)
      setMessageType(data.valid ? 'success' : 'error')
    } catch (err) {
      setMessage(err.message || '请求失败，请确认后端已启动 (http://127.0.0.1:8000)')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }, [board, appliedShape])

  const handleSolve = useCallback(async () => {
    setMessage('')
    setMessageType('')
    setLoading(true)
    try {
      const data = await solveSudoku(board, [appliedShape.rows, appliedShape.cols])
      setMessage(data.message)
      setMessageType(data.success ? 'success' : 'error')
      if (data.success && data.solution) {
        setBoard(data.solution)
      }
    } catch (err) {
      setMessage(err.message || '请求失败，请确认后端已启动 (http://127.0.0.1:8000)')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }, [board, appliedShape])

  return (
    <div className="app">
      <header className="app-header">
        <h1>数独求解器</h1>
        <p className="subtitle">填写部分数字后点击「校验」或「求解」</p>
      </header>

      <main className="app-main">
        <SudokuGrid
          board={board}
          onChange={setBoard}
          readOnly={false}
          blockRows={appliedShape.rows}
          blockCols={appliedShape.cols}
        />

        <div className="actions">
          <button type="button" onClick={() => setShowSettings(true)} disabled={loading}>
            设置
          </button>
          <button type="button" onClick={handleClear} disabled={loading}>
            清空
          </button>
          <button type="button" onClick={handleValidate} disabled={loading}>
            {loading ? '校验中…' : '校验'}
          </button>
          <button type="button" onClick={handleSolve} disabled={loading}>
            {loading ? '求解中…' : '求解'}
          </button>
        </div>

        {message && (
          <div className={`message message-${messageType}`} role="status">
            {message}
          </div>
        )}

        {showSettings && (
          <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>设置数独盘面</h2>

              <div className="modal-row">
                <label htmlFor="side-length">边长</label>
                <input
                  id="side-length"
                  type="number"
                  min="4"
                  max="16"
                  value={sideLength}
                  onChange={handleSideLengthChange}
                />
              </div>
              {sideLengthError && (
                <div className="modal-error" role="alert" style={{ color: 'red', fontSize: '0.9rem' }}>
                  {sideLengthError}
                </div>
              )}

              <div className="modal-row">
                <label htmlFor="shape-select">宫的形状</label>
                <select
                  id="shape-select"
                  value={selectedShape ? `${selectedShape.rows}x${selectedShape.cols}` : ''}
                  onChange={(e) => {
                    const [r, c] = e.target.value.split('x').map(Number)
                    setSelectedShape({ rows: r, cols: c })
                  }}
                >
                  {shapeOptions.map(opt => (
                    <option key={`${opt.rows}x${opt.cols}`} value={`${opt.rows}x${opt.cols}`}>{opt.rows} × {opt.cols}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowSettings(false)}>
                  取消
                </button>
                <button type="button" onClick={applySettings} disabled={!!sideLengthError || !selectedShape}>
                  确定
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
