const API_BASE = '/api/puzzle/sudoku'

type Board = number[][]
type BoxShape = [number, number]

interface SolveResult {
  success: boolean
  solution: Board | null
  message: string
  solve_time_ms: number | null
  steps: Record<string, unknown>[] | null
}

interface ValidateResult {
  valid: boolean
  unique_solution: boolean | null
  message: string
}

export async function solveSudoku(board: Board, boxShape?: BoxShape): Promise<SolveResult> {
  const payload: Record<string, unknown> = { board, params: {} }
  if (boxShape) (payload.params as Record<string, unknown>).box_shape = boxShape
  const res = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}

export async function validateSudoku(board: Board, boxShape?: BoxShape): Promise<ValidateResult> {
  const payload: Record<string, unknown> = { board, params: {} }
  if (boxShape) (payload.params as Record<string, unknown>).box_shape = boxShape
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}
