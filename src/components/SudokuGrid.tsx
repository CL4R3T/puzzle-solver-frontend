import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { SudokuCell, type CellOverlay } from './SudokuCell'
import type { ConstraintInstance } from '../constraints/definitions'
import { getCategoryForType } from '../constraints/definitions'

type Board = number[][]

export type SelectionMode = 'none' | 'region' | 'path'

const emptyBoard = (size = 9): Board => Array(size).fill(null).map(() => Array(size).fill(0))

interface PathLine {
  cells: [number, number][]
  color: string
  isActive: boolean
  isPreview: boolean
}

interface SudokuGridProps {
  board: Board
  onChange: (board: Board) => void
  readOnly?: boolean
  blockRows?: number
  blockCols?: number
  constraints?: ConstraintInstance[]
  activeConstraintId?: string | null
  selectionMode?: SelectionMode
  currentCells?: [number, number][]
  onCellMouseDown?: (r: number, c: number) => void
  onCellMouseEnter?: (r: number, c: number) => void
  onCellMouseUp?: () => void
}

export function SudokuGrid({
  board,
  onChange,
  readOnly = false,
  blockRows = 3,
  blockCols = 3,
  constraints = [],
  activeConstraintId = null,
  selectionMode = 'none',
  currentCells = [],
  onCellMouseDown,
  onCellMouseEnter,
  onCellMouseUp,
}: SudokuGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [cellCenters, setCellCenters] = useState<Map<string, { cx: number; cy: number }>>(new Map())
  const gridReadOnly = readOnly || selectionMode !== 'none'

  const handleCellChange = useCallback(
    (row: number, col: number, value: number) => {
      const next = board.map((r, i) =>
        i === row ? r.map((v, j) => (j === col ? value : v)) : r
      )
      onChange(next)
    },
    [board, onChange]
  )

  // measure cell positions relative to grid
  const recalcCenters = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return
    const gridRect = grid.getBoundingClientRect()
    const wraps = grid.querySelectorAll('.sudoku-cell-wrap')
    const map = new Map<string, { cx: number; cy: number }>()
    wraps.forEach((el) => {
      const r = (el as HTMLElement).dataset.row
      const c = (el as HTMLElement).dataset.col
      if (r === undefined || c === undefined) return
      const rect = el.getBoundingClientRect()
      map.set(`${r},${c}`, {
        cx: rect.left - gridRect.left + rect.width / 2,
        cy: rect.top - gridRect.top + rect.height / 2,
      })
    })
    setCellCenters(map)
  }, [])

  useLayoutEffect(() => {
    recalcCenters()
    const obs = new ResizeObserver(recalcCenters)
    if (gridRef.current) obs.observe(gridRef.current)
    return () => obs.disconnect()
  }, [board.length, blockRows, blockCols, recalcCenters])

  // partition constraints into region (fill) and path (line) types
  const { overlays, pathLines } = useMemo(() => {
    const size = board.length
    const result: CellOverlay[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({
        color: null,
        isSelected: false,
        isPreview: false,
        pathIndex: -1,
        isPathStart: false,
        isPathEnd: false,
        isPathCell: false,
      }))
    )
    const lines: PathLine[] = []

    for (const c of constraints) {
      const isActive = c.id === activeConstraintId
      const category = getCategoryForType(c.constraintType)

      if (category === 'path') {
        lines.push({ cells: c.cells, color: c.color, isActive, isPreview: false })
        for (let i = 0; i < c.cells.length; i++) {
          const [r, cCol] = c.cells[i]
          result[r][cCol] = {
            color: c.color,
            isSelected: isActive,
            isPreview: false,
            pathIndex: i,
            isPathStart: i === 0,
            isPathEnd: i === c.cells.length - 1,
            isPathCell: true,
          }
        }
      } else {
        // region / toggle
        for (let i = 0; i < c.cells.length; i++) {
          const [r, cCol] = c.cells[i]
          result[r][cCol] = {
            color: c.color,
            isSelected: isActive,
            isPreview: false,
            pathIndex: -1,
            isPathStart: false,
            isPathEnd: false,
            isPathCell: false,
          }
        }
      }
    }

    // currentCells preview
    if (currentCells.length > 0) {
      if (selectionMode === 'path') {
        lines.push({ cells: currentCells, color: '#f1f5f9', isActive: false, isPreview: true })
        for (let idx = 0; idx < currentCells.length; idx++) {
          const [r, c] = currentCells[idx]
          result[r][c] = {
            color: null,
            isSelected: false,
            isPreview: true,
            pathIndex: idx,
            isPathStart: idx === 0,
            isPathEnd: idx === currentCells.length - 1 && idx > 0,
            isPathCell: true,
          }
        }
      } else {
        for (const [r, c] of currentCells) {
          result[r][c] = {
            color: null,
            isSelected: false,
            isPreview: true,
            pathIndex: -1,
            isPathStart: false,
            isPathEnd: false,
            isPathCell: false,
          }
        }
      }
    }

    return { overlays: result, pathLines: lines }
  }, [board.length, constraints, activeConstraintId, currentCells, selectionMode])

  const isSelecting = selectionMode !== 'none'

  return (
    <div
      ref={gridRef}
      className={`sudoku-grid${isSelecting ? ' selecting' : ''}`}
      role="grid"
      aria-label="数独棋盘"
      onMouseUp={onCellMouseUp}
      onMouseLeave={onCellMouseUp}
    >
      {board.map((row, i) => (
        <div key={i} className="sudoku-row">
          {row.map((val, j) => {
            const overlay = overlays[i]?.[j] ?? {
              color: null, isSelected: false, isPreview: false,
              pathIndex: -1, isPathStart: false, isPathEnd: false, isPathCell: false,
            }
            const hasRegionFill = overlay.color && !overlay.isPathCell && !overlay.isPreview
            return (
              <div
                key={j}
                data-row={i}
                data-col={j}
                className={`sudoku-cell-wrap ${((i + 1) % blockRows === 0 && i < board.length - 1) ? 'border-bottom' : ''} ${((j + 1) % blockCols === 0 && j < board.length - 1) ? 'border-right' : ''}`}
                style={hasRegionFill
                  ? ({ '--constraint-color': overlay.color } as React.CSSProperties)
                  : undefined}
              >
                <SudokuCell
                  value={val}
                  onChange={(v) => handleCellChange(i, j, v)}
                  readOnly={gridReadOnly}
                  maxValue={board.length}
                  overlay={overlay}
                  onMouseDown={() => onCellMouseDown?.(i, j)}
                  onMouseEnter={() => onCellMouseEnter?.(i, j)}
                />
              </div>
            )
          })}
        </div>
      ))}

      {pathLines.length > 0 && (
        <svg className="path-overlay-svg">
          {pathLines.map((line, li) => {
            const points = line.cells
              .map(([r, c]) => cellCenters.get(`${r},${c}`))
              .filter(Boolean) as { cx: number; cy: number }[]
            if (points.length < 2) return null
            return (
              <g key={li}>
                <polyline
                  points={points.map(p => `${p.cx},${p.cy}`).join(' ')}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.isActive ? 4 : 3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={line.isPreview ? 0.7 : 0.85}
                />
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.cx}
                    cy={p.cy}
                    r={i === 0 ? 5 : i === points.length - 1 ? 4 : 3}
                    fill={line.isPreview ? '#cbd5e1' : line.color}
                    stroke={line.isActive ? '#fff' : line.isPreview ? '#475569' : 'rgba(255,255,255,0.5)'}
                    strokeWidth={1.5}
                  />
                ))}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

export { emptyBoard }
