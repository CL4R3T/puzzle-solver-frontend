const API_BASE = '/api/puzzle/sudoku'

type Board = number[][]
type BoxShape = [number, number]

export interface SolveResult {
  success: boolean
  solution: Board | null
  message: string
  solve_time_ms: number | null
  steps: Record<string, unknown>[] | null
}

export interface ValidateResult {
  valid: boolean
  unique_solution: boolean | null
  message: string
}

export interface SolveParams {
  boxShape?: BoxShape
  diagonals?: boolean
  cages?: { cells: [number, number][]; sum: number }[]
}

function buildParams(params: SolveParams): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  if (params.boxShape) p.box_shape = params.boxShape
  if (params.diagonals) p.diagonals = true
  if (params.cages && params.cages.length > 0) p.cages = params.cages
  return p
}

export async function solveSudoku(board: Board, params: SolveParams = {}): Promise<SolveResult> {
  const payload = { board, params: buildParams(params) }
  const res = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}

export async function validateSudoku(board: Board, params: SolveParams = {}): Promise<ValidateResult> {
  const payload = { board, params: buildParams(params) }
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}
