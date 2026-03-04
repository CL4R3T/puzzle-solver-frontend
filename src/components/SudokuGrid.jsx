import { useCallback } from 'react'

// create an empty board of given size (default 9)
const emptyBoard = (size = 9) => Array(size).fill(null).map(() => Array(size).fill(0))

function Cell({ value, onChange, readOnly, maxValue }) {
  const handleChange = (e) => {
    const v = e.target.value
    if (v === '') {
      onChange(0)
      return
    }
    const n = parseInt(v, 10)
    if (n >= 1 && n <= maxValue) onChange(n)
    if (n > maxValue) onChange(maxValue)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={String(maxValue).length}
      value={value === 0 ? '' : String(value)}
      onChange={handleChange}
      readOnly={readOnly}
      className={`sudoku-cell ${readOnly ? 'read-only' : ''}`}
      aria-label="数独格子"
    />
  )
}

export function SudokuGrid({ board, onChange, readOnly = false, blockRows = 3, blockCols = 3 }) {
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
              className={`sudoku-cell-wrap ${((i + 1) % blockRows === 0 && i < board.length - 1) ? 'border-bottom' : ''} ${((j + 1) % blockCols === 0 && j < board.length - 1) ? 'border-right' : ''}`}
            >
              <Cell
                value={val}
                onChange={(v) => handleCellChange(i, j, v)}
                readOnly={readOnly}
                maxValue={board.length}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export { emptyBoard }
