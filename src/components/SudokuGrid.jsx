import { useCallback } from 'react'

const emptyBoard = () => Array(9).fill(null).map(() => Array(9).fill(0))

function Cell({ value, onChange, readOnly }) {
  const handleChange = (e) => {
    const v = e.target.value
    if (v === '') {
      onChange(0)
      return
    }
    const n = parseInt(v, 10)
    if (n >= 1 && n <= 9) onChange(n)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={1}
      value={value === 0 ? '' : String(value)}
      onChange={handleChange}
      readOnly={readOnly}
      className={`sudoku-cell ${readOnly ? 'read-only' : ''}`}
      aria-label="数独格子"
    />
  )
}

export function SudokuGrid({ board, onChange, readOnly = false }) {
  const handleCellChange = useCallback(
    (row, col, value) => {
      const next = board.map((r, i) =>
        i === row ? r.map((v, j) => (j === col ? value : v)) : r
      )
      onChange(next)
    },
    [board, onChange]
  )

  return (
    <div className="sudoku-grid" role="grid" aria-label="数独棋盘">
      {board.map((row, i) => (
        <div key={i} className="sudoku-row">
          {row.map((val, j) => (
            <div
              key={j}
              className={`sudoku-cell-wrap ${(i % 3 === 2 && i < 8) ? 'border-bottom' : ''} ${(j % 3 === 2 && j < 8) ? 'border-right' : ''}`}
            >
              <Cell
                value={val}
                onChange={(v) => handleCellChange(i, j, v)}
                readOnly={readOnly}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export { emptyBoard }
