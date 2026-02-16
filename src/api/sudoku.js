const API_BASE = '/api/sudoku'

/**
 * @param {number[][]} board 9x9 数独棋盘，0 表示空格
 * @returns {Promise<{ success: boolean, solution: number[][]|null, message: string }>}
 */
export async function solveSudoku(board) {
  const res = await fetch(`${API_BASE}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board }),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}

/**
 * @param {number[][]} board 9x9 数独棋盘
 * @returns {Promise<{ valid: boolean, message: string }>}
 */
export async function validateSudoku(board) {
  const res = await fetch(`${API_BASE}/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board }),
  })
  if (!res.ok) throw new Error(`请求失败: ${res.status}`)
  return res.json()
}
