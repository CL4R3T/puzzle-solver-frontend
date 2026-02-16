import { useState, useCallback } from 'react'
import { SudokuGrid, emptyBoard } from './components/SudokuGrid'
import { solveSudoku, validateSudoku } from './api/sudoku'
import './App.css'

export default function App() {
  const [board, setBoard] = useState(emptyBoard())
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('') // 'success' | 'error' | ''
  const [loading, setLoading] = useState(false)

  const handleClear = useCallback(() => {
    setBoard(emptyBoard())
    setMessage('')
    setMessageType('')
  }, [])

  const handleValidate = useCallback(async () => {
    setMessage('')
    setMessageType('')
    setLoading(true)
    try {
      const data = await validateSudoku(board)
      setMessage(data.message)
      setMessageType(data.valid ? 'success' : 'error')
    } catch (err) {
      setMessage(err.message || '请求失败，请确认后端已启动 (http://127.0.0.1:8000)')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }, [board])

  const handleSolve = useCallback(async () => {
    setMessage('')
    setMessageType('')
    setLoading(true)
    try {
      const data = await solveSudoku(board)
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
  }, [board])

  return (
    <div className="app">
      <header className="app-header">
        <h1>数独求解器</h1>
        <p className="subtitle">填写部分数字后点击「校验」或「求解」</p>
      </header>

      <main className="app-main">
        <SudokuGrid board={board} onChange={setBoard} readOnly={false} />

        <div className="actions">
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
      </main>
    </div>
  )
}
