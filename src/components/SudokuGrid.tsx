import { useCallback } from 'react'

type Board = number[][]

// create an empty board of given size (default 9)
const emptyBoard = (size = 9): Board => Array(size).fill(null).map(() => Array(size).fill(0))

interface CellProps {
  value: number
  onChange: (value: number) => void
  readOnly: boolean
  maxValue: number
}

function Cell({ value, onChange, readOnly, maxValue }: CellProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

interface SudokuGridProps {
  board: Board
  onChange: (board: Board) => void
  readOnly?: boolean
  blockRows?: number
  blockCols?: number
}

export function SudokuGrid({ board, onChange, readOnly = false, blockRows = 3, blockCols = 3 }: SudokuGridProps) {
  const handleCellChange = useCallback(
    (row: number, col: number, value: number) => {
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
