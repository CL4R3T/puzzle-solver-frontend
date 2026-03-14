const API_BASE = '/api/sudoku'

type Board = number[][]
type BlockShape = [number, number]

interface SolveResult {
  success: boolean
  solution: Board | null
  message: string
}

interface ValidateResult {
  valid: boolean
  message: string
}

/**
 * @param board 数独棋盘，0 表示空格
 * @param blockShape 宫的形状 [rows, cols]
 * @returns Promise<SolveResult>
 */
export async function solveSudoku(board: Board, blockShape?: BlockShape): Promise<SolveResult> {
  const payload: any = { board }
  if (blockShape) payload.block_shape = blockShape
  const res = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}

/**
 * @param board 数独棋盘
 * @param blockShape 宫的形状 [rows, cols]
 * @returns Promise<ValidateResult>
 */
export async function validateSudoku(board: Board, blockShape?: BlockShape): Promise<ValidateResult> {
  const payload: any = { board }
  if (blockShape) payload.block_shape = blockShape
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}
