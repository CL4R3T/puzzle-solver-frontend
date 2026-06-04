import React from 'react'

export interface CellOverlay {
  color: string | null
  isSelected: boolean
  isPreview: boolean
  pathIndex: number
  isPathStart: boolean
  isPathEnd: boolean
  isPathCell: boolean
}

interface SudokuCellProps {
  value: number
  onChange: (value: number) => void
  readOnly: boolean
  maxValue: number
  overlay: CellOverlay
  onMouseDown: () => void
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
}

export function SudokuCell({
  value,
  onChange,
  readOnly,
  maxValue,
  overlay,
  onMouseDown,
  onMouseEnter,
  onMouseMove,
}: SudokuCellProps) {
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

  const classList = ['sudoku-cell']
  if (readOnly) classList.push('read-only')

  const innerClassList = ['sudoku-cell-inner']
  if (overlay.isPreview && !overlay.isPathCell) innerClassList.push('preview')
  if (overlay.isSelected) innerClassList.push('constraint-selected')

  const showFill = overlay.color && !overlay.isPreview && !overlay.isPathCell
  const showRegionPreview = overlay.isPreview && !overlay.isPathCell

  return (
    <div
      className={innerClassList.join(' ')}
      style={
        showFill
          ? ({ '--constraint-color': overlay.color } as React.CSSProperties)
          : undefined
      }
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
    >
      {showFill && <div className="cell-overlay" />}
      {showRegionPreview && <div className="cell-preview" />}
      {overlay.pathIndex >= 0 && (
        <span className="path-index">{overlay.pathIndex + 1}</span>
      )}
      <input
        type="text"
        inputMode="numeric"
        maxLength={String(maxValue).length}
        value={value === 0 ? '' : String(value)}
        onChange={handleChange}
        readOnly={readOnly}
        className={classList.join(' ')}
        aria-label="数独格子"
      />
    </div>
  )
}
