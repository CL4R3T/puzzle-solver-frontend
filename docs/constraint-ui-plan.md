# 数独额外约束 UI 方案

## 1. 数据模型

### 1.1 约束选区类型

```typescript
// 约束类别（驱动 UI 渲染差异）
type ConstraintCategory = 'region' | 'path' | 'toggle'

// 约束定义
interface ConstraintDef {
  type: string                    // 后端约束名，如 'cages' / 'diagonals' / 'thermometer'
  label: string                   // 中文名，如 '杀手笼'
  category: ConstraintCategory    // 选区形式
  params: ConstraintParamDef[]    // 参数定义
  defaultColor: string
}

interface ConstraintParamDef {
  key: string                     // 例如 'sum'
  label: string                   // 例如 '目标和'
  type: 'number' | 'boolean' | 'select'
  required: boolean
  defaultValue?: unknown
  options?: { label: string; value: unknown }[]  // type='select' 时
  min?: number                    // type='number' 时
  max?: number
}

// 用户创建的一个约束实例
interface ConstraintInstance {
  id: string                      // uuid
  constraintType: string          // 引用 ConstraintDef.type
  cells: [number, number][]       // 格子列表
  params: Record<string, unknown> // 参数值
  color: string
}
```

### 1.2 预设约束类型

| type | label | category | 选区说明 | 参数 |
|---|---|---|---|---|
| `cages` | 杀手笼 | region | 4-连通区域，无顺序 | `sum: number` (目标和) |
| `diagonals` | 对角线 | toggle | 无选区，布尔开关 | 无 |
| `thermometer` | 温度计 | path | 8-连通有序路径，从球到尖端递增 | 无（严格递增由求解器保证） |
| `palindrome` | 回文线 | path | 8-连通有序路径，两端对称相等 | 无 |

> 约束注册在 `src/api/sudoku.ts` 旁新建 `src/constraints/definitions.ts`，方便后续扩展新约束类型。

---

## 2. 整体布局

```
┌──────────┐  ┌─────────────────────────┐  ┌──────────────────┐
│ 左侧导航  │  │                         │  │  右侧约束侧边栏     │
│ (现有)    │  │      数独盘面            │  │                  │
│          │  │                         │  │  [约束列表]       │
│ - 首页   │  │  ┌─────────────────┐    │  │  - 笼子 A (sum=15)│
│ - 数独   │  │  │  9x9 / NxN 网格  │    │  │  - 笼子 B (sum=7) │
│          │  │  │  含选区高亮覆盖   │    │  │  - 温度计 C       │
│          │  │  └─────────────────┘    │  │                  │
│          │  │                         │  │  [当前选中面板]    │
│          │  │  [选区模式工具条]        │  │  类型/参数/颜色    │
│          │  │  [校验] [求解] [清空]    │  │  [重画] [删除]    │
└──────────┘  └─────────────────────────┘  └──────────────────┘
```

- **左侧**：现有导航栏，不变。
- **中间**：盘面上方新增**选区模式工具条**；盘面格子上叠加选区高亮。
- **右侧**：新增**约束侧边栏**（可收起），包含约束列表和当前选中约束的编辑面板。

---

## 3. 选区工具

### 3.1 模式切换

在盘面上方添加工具条：

```
[指针/输入]  [区域选区]  [路径选区]   |   [对角线约束]  [开启右侧栏]
```

- **指针模式** (`'none'`)：正常输入数字，与现有行为一致。
- **区域模式** (`'region'`)：点击/拖拽选中 4-连通区域。
- **路径模式** (`'path'`)：依次点击格子构建 8-连通有序路径。
- 只能同时启用一个选区模式。

### 3.2 区域选区 (Region — 4-连通)

用于杀手笼等。

**交互逻辑**：
1. 用户切换到「区域选区」模式。
2. **mousedown** 某个格子 → 开始新选区，该格被加入。
3. **mouseenter**（按住拖拽中）→ 若该格与当前选区 4-邻接，则加入；否则忽略。
4. **mouseup** → 选区锁定为当前集合。鼠标不在选区格子上时保持选中，可立即弹出编辑面板。
5. 若选区为空（仅点了一下空白区），视为取消。

**连通性校验**：
- mouseup 时检查选区是否为 4-连通分量（简单的 BFS 即可）。
- 不连通则在盘面下方显示红色提示「选区不连通，请重试」，选区清空。

**视觉反馈**：
- 正在选区中（mousedown → mouseup 期间）：格子显示半透明色预览 + 虚线外框。
- 已有约束实例的格子：显示该约束的分配颜色（背景色填充）。
- 当前选中约束：在颜色填充基础上加粗边框 + 轻微放大。

### 3.3 路径选区 (Path — 8-连通有序)

用于温度计、回文线等。

**交互逻辑**：
1. 用户切换到「路径选区」模式。
2. **mousedown** 某格 → 该格成为路径起点。
3. **mouseenter** 拖拽到相邻格 → 若与最后一个点 8-邻接且未在路径中，追加到路径末尾。
4. **mouseup** → 路径固定，弹出编辑面板。
5. 右键或 Escape 取消当前路径。

**撤销最后一步**：
- 按 Backspace / 点击工具条上「撤销一步」→ 移除路径最后一个点。
- 支持逐步撤销到只剩起点。

**首尾连接**：
- 若用户将终点拖回起点附近（且路径长度 ≥ 2），高亮提示「闭合回路」。
- 闭合与否由约束类型语义决定（一般路径不需要闭合）。

**方向指示**：
- 路径格子上叠加小箭头 SVG，从第 i 个指向第 i+1 个。
- 起点标记为圆形，终点标记为箭头/尖端。

**自交检测**：
- 路径不允许自交（一个格子不能出现两次）。
- 若用户拖到已在路径中的格子，忽略（不追加），显示短暂闪烁提示。

### 3.4 特殊：toggle 类型约束

对角线约束不需要选区，仅需在面板中开启/关闭布尔开关。工具条上放置快捷按钮：

```
[☐ 对角线约束]
```

点击即 toggle，无需进入选区模式。

---

## 4. 约束列表侧边栏

### 4.1 结构

```
┌─────────────────────┐
│ 约束列表        [×] │  ← 标题 + 关闭按钮
├─────────────────────┤
│                     │
│ ● 杀手笼 A          │  ← 约束条目（颜色圆点 + 类型名 + id）
│   sum: 15, 4格      │  ← 摘要
│                     │
│ ● 杀手笼 B          │
│   sum: 7, 2格       │
│                     │
│ ● 温度计 C          │
│   5格, 未闭合        │
│                     │
│ ● 对角线约束         │  ← toggle 类也列在这里
│   已启用 ✓           │
│                     │
├─────────────────────┤
│ [+ 添加约束]        │  ← 底部按钮
└─────────────────────┘
```

- 点击某条目 → 选中该约束（盘面上高亮其格子），并在下方展开编辑面板。
- 再次点击已选中条目 → 取消选中。

### 4.2 编辑面板（侧边栏内嵌或弹出）

选中某约束后，侧边栏下方显示编辑面板：

```
┌─────────────────────┐
│ 编辑：杀手笼 A       │
├─────────────────────┤
│ 约束类型             │
│ [杀手笼 ▾]          │  ← 可切换类型
│                     │
│ 颜色                 │
│ [●] [●] [●] [●]    │  ← 预设色板
│                     │
│ 参数                 │
│ 目标和: [15]         │  ← 动态参数输入
│                     │
│ [重画选区] [删除]    │  ← 操作按钮
│ [保存]              │
└─────────────────────┘
```

**字段说明**：
- **约束类型**：下拉选择，切换类型时若 category 不变则保留选区；若 category 不同则清空选区并提示。
- **颜色**：8 色预设色板。每个约束默认分配一个未使用的颜色。
- **参数**：由 `ConstraintDef.params` 动态渲染。number 用 `<input type="number">`，boolean 用 checkbox，select 用 `<select>`。
- **重画选区**：进入该约束 category 对应的选区模式，清除老选区，重新绘制。
- **删除**：确认后删除该约束实例。
- **保存**：将修改写入 state（实际上 state 实时更新，保存按钮是显式确认）。

> 交互细节：面板中任何字段的修改应立即反映到盘面高亮（颜色变化）和列表中。不需要「保存」按钮——所有改动即时生效。「保存」可改为「完成」仅关闭面板。

---

## 5. 盘面高亮渲染

### 5.1 高亮数据准备

每次渲染前，从 `constraints: ConstraintInstance[]` 中计算每格的高亮状态：

```typescript
interface CellOverlay {
  color: string | null           // 背景填充色
  isSelected: boolean            // 是否属于当前选中约束
  pathInfo?: {                   // 仅 path 类约束
    index: number                // 在路径中的序号 (0-based)
    isStart: boolean
    isEnd: boolean
  }
}
```

计算函数 `computeCellOverlays(boardSize, constraints, activeConstraintId, currentSelection)` 返回 `CellOverlay[][]`。

### 5.2 CSS 实现

```css
.sudoku-cell-wrap.constraint-active {
  z-index: 1;
}
.sudoku-cell-wrap.constraint-active::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--constraint-color);
  opacity: 0.35;
  border-radius: 2px;
}
.sudoku-cell-wrap.constraint-selected {
  box-shadow: 0 0 0 2px var(--constraint-selected-border, #0ea5e9);
  z-index: 2;
}
```

- 每个约束颜色设 CSS 变量 `--constraint-color`。
- 路径方向指示：在格子内用绝对定位的 SVG 三角形。

### 5.3 选区中（草稿）的预览

选区绘制期间（mousedown → mouseup）：
- 草稿格子用半透明灰色叠加。
- 路径草稿显示临时方向箭头。

---

## 6. 组件树与数据流

### 6.1 组件拆分

```
Sudoku.tsx                     ← 状态中心（board, constraints, selectionMode, ...）
├── ConstraintToolbar.tsx      ← 选区模式切换、对角线快捷开关
├── SudokuGrid.tsx             ← 增强：叠加高亮层、处理选区鼠标事件
│   └── SudokuCell.tsx         ← 单格：数字输入 + 高亮 + 路径标记
├── ConstraintSidebar.tsx      ← 右侧侧边栏（可收起）
│   ├── ConstraintList.tsx     ← 约束条目列表
│   └── ConstraintEditor.tsx   ← 当前选中约束的编辑面板
└── (现有) 按钮行、消息区
```

### 6.2 状态管理（全部在 Sudoku.tsx 中以 useState 管理）

```typescript
// 现有
const [board, setBoard] = useState<Board>(emptyBoard(9))
const [appliedSideLength, setAppliedSideLength] = useState<number>(9)
const [appliedShape, setAppliedShape] = useState<BlockShape>({ rows: 3, cols: 3 })
const [message, setMessage] = useState<string>('')
const [messageType, setMessageType] = useState<MessageType>('')
const [loading, setLoading] = useState<boolean>(false)
const [showSettings, setShowSettings] = useState<boolean>(false)

// 新增
const [constraints, setConstraints] = useState<ConstraintInstance[]>([])
const [activeConstraintId, setActiveConstraintId] = useState<string | null>(null)
const [selectionMode, setSelectionMode] = useState<SelectionMode>('none') // 'none' | 'region' | 'path'
const [currentCells, setCurrentCells] = useState<[number, number][]>([])   // 正在绘制的草稿
const [showSidebar, setShowSidebar] = useState<boolean>(false)
```

### 6.3 数据流向

```
用户操作                     → 状态变更                      → UI 响应
────────────────────────────────────────────────────────────────────
点击「区域选区」按钮          selectionMode = 'region'        工具条高亮当前模式按钮
mousedown 格子 (r,c)         currentCells = [[r,c]]         该格显示预览
拖拽到相邻格                  currentCells 追加              新格显示预览
mouseup (提交选区)           currentCells → editor 弹出      预览转为待确认状态
编辑面板填写参数并确认        constraints 新增一项            侧边栏出现新条目 + 盘面着色
点击侧边栏条目               activeConstraintId = id        该约束格子高亮 + 面板加载
修改参数                     constraints 对应项更新           实时反映
点击删除                     constraints 移除一项            侧边栏 + 盘面同步移除
点击「求解」                 组装 params → API 调用           正常流程
```

### 6.4 核心函数

```typescript
// ---- 选区逻辑 ----

function handleCellMouseDown(r: number, c: number) {
  if (selectionMode === 'none') return
  if (selectionMode === 'region') {
    setCurrentCells([[r, c]])
  }
  if (selectionMode === 'path') {
    setCurrentCells(prev => prev.length === 0 ? [[r, c]] : prev)  // 空时初始化
  }
}

function handleCellMouseEnter(r: number, c: number, isMouseDown: boolean) {
  if (!isMouseDown || selectionMode === 'none') return
  if (selectionMode === 'region') {
    // 检查 (r,c) 是否 4-邻接 currentCells 中任意格
    if (isAdjacent4(r, c, currentCells)) {
      setCurrentCells(prev => [...prev, [r, c]])
    }
  }
  if (selectionMode === 'path') {
    const last = currentCells[currentCells.length - 1]
    if (!last) return
    // 检查 (r,c) 是否 8-邻接 last 且不在路径中
    if (isAdjacent8(r, c, last) && !hasCell(currentCells, r, c)) {
      setCurrentCells(prev => [...prev, [r, c]])
    }
  }
}

function handleCellMouseUp() {
  if (selectionMode === 'none' || currentCells.length === 0) return
  if (selectionMode === 'region') {
    // 验证 4-连通性
    if (!isConnected4(currentCells)) {
      setMessage('选区不连通，请重试')
      setMessageType('error')
      setCurrentCells([])
      return
    }
  }
  // 创建新的 ConstraintInstance 草稿（id 为临时 id，参数为空）
  const draft: ConstraintInstance = {
    id: crypto.randomUUID(),
    constraintType: 'cages',  // 根据 selectionMode 预设默认类型
    cells: [...currentCells],
    params: selectionMode === 'region' ? { sum: 0 } : {},
    color: getNextUnusedColor(constraints),
  }
  setConstraints(prev => [...prev, draft])
  setActiveConstraintId(draft.id)
  setCurrentCells([])
  setSelectionMode('none')
  setShowSidebar(true)  // 自动展开侧边栏
}

// ---- 路径撤销 ----

function handlePathUndo() {
  setCurrentCells(prev => prev.slice(0, -1))
}

// ---- 约束增删改 ----

function updateConstraint(id: string, patch: Partial<ConstraintInstance>) {
  setConstraints(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
}

function deleteConstraint(id: string) {
  setConstraints(prev => prev.filter(c => c.id !== id))
  if (activeConstraintId === id) setActiveConstraintId(null)
}

function redrawConstraint(id: string) {
  // 删除旧选区，切换到对应选区模式，将老 cells 加载为 currentCells
  const target = constraints.find(c => c.id === id)
  if (!target) return
  setActiveConstraintId(null)
  setConstraints(prev => prev.filter(c => c.id !== id))
  setCurrentCells(target.cells)
  setSelectionMode(getCategoryForType(target.constraintType) === 'path' ? 'path' : 'region')
}

// ---- API 组装（在 handleSolve / handleValidate 中调用） ----

function buildRequestParams(): Record<string, unknown> {
  const params: Record<string, unknown> = { box_shape: [appliedShape.rows, appliedShape.cols] }
  const cages: { cells: [number, number][]; sum: number }[] = []
  for (const c of constraints) {
    if (c.constraintType === 'cages') {
      cages.push({ cells: c.cells, sum: c.params.sum as number })
    }
    if (c.constraintType === 'diagonals') {
      params.diagonals = true
    }
    // 未来扩展其他类型
  }
  if (cages.length > 0) params.cages = cages
  return params
}

// ---- 辅助 ----

function isAdjacent4(r: number, c: number, cells: [number, number][]): boolean {
  return cells.some(([cr, cc]) => Math.abs(r - cr) + Math.abs(c - cc) === 1)
}

function isAdjacent8(r: number, c: number, target: [number, number]): boolean {
  return Math.max(Math.abs(r - target[0]), Math.abs(c - target[1])) === 1
}

function hasCell(cells: [number, number][], r: number, c: number): boolean {
  return cells.some(([cr, cc]) => cr === r && cc === c)
}

function isConnected4(cells: [number, number][]): boolean {
  if (cells.length <= 1) return true
  const set = new Set(cells.map(([r, c]) => `${r},${c}`))
  const visited = new Set<string>()
  const queue: [number, number][] = [cells[0]]
  visited.add(`${cells[0][0]},${cells[0][1]}`)
  while (queue.length > 0) {
    const [r, c] = queue.shift()!
    for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      const nr = r + dr, nc = c + dc
      const key = `${nr},${nc}`
      if (set.has(key) && !visited.has(key)) {
        visited.add(key)
        queue.push([nr, nc])
      }
    }
  }
  return visited.size === cells.length
}
```

---

## 7. 与后端 API 对接

当前后端 solve/validate 接口已支持通过 `params` 传递额外约束。前端需要做的仅是在调用时正确组装 `params`：

**组装前**：
```typescript
const payload = { board, params: { box_shape: [rows, cols] } }
```

**组装后**（带约束）：
```typescript
const params: Record<string, unknown> = { box_shape: [rows, cols] }
if (diagonalsEnabled) params.diagonals = true
if (cages.length > 0) params.cages = cages.map(c => ({ cells: c.cells, sum: c.params.sum }))
const payload = { board, params }
```

`src/api/sudoku.ts` 中新增：

```typescript
interface SolveParams {
  boxShape?: BoxShape
  diagonals?: boolean
  cages?: { cells: [number, number][]; sum: number }[]
}

export async function solveSudoku(board: Board, params: SolveParams): Promise<SolveResult> {
  const apiParams: Record<string, unknown> = {}
  if (params.boxShape) apiParams.box_shape = params.boxShape
  if (params.diagonals) apiParams.diagonals = true
  if (params.cages) apiParams.cages = params.cages
  const payload = { board, params: apiParams }
  // ... rest unchanged
}
```

---

## 8. 文件变更范围

| 文件 | 动作 | 说明 |
|---|---|---|
| `src/api/sudoku.ts` | 修改 | 支持传递约束参数 |
| `src/constraints/definitions.ts` | **新建** | ConstraintDef 定义表 |
| `src/components/SudokuGrid.tsx` | 修改 | 添加高亮层、选区鼠标事件、路径标记 |
| `src/components/SudokuCell.tsx` | **新建** | 从 SudokuGrid 拆出单格组件 |
| `src/components/Sudoku.tsx` | 修改 | 新增约束状态、选区逻辑、侧边栏集成 |
| `src/components/ConstraintToolbar.tsx` | **新建** | 选区模式工具条 |
| `src/components/ConstraintSidebar.tsx` | **新建** | 右侧侧边栏容器 |
| `src/components/ConstraintList.tsx` | **新建** | 约束条目列表 |
| `src/components/ConstraintEditor.tsx` | **新建** | 单个约束编辑面板 |
| `src/components/Sudoku.css` | 修改 | 高亮、选区、侧边栏样式 |

---

## 9. 分步实施建议

1. **Step 1 — 数据层**：创建 `definitions.ts`，扩展 `sudoku.ts` API 参数。
2. **Step 2 — 盘面选区交互**：增强 `SudokuGrid.tsx`，实现 Region 选区 mousedown/move/up 逻辑和预览渲染。
3. **Step 3 — 路径选区**：在盘面上叠加 Path 选区逻辑（有序、方向箭头）。
4. **Step 4 — 侧边栏 + 列表**：实现 `ConstraintSidebar` + `ConstraintList`，可查看/选中/删除约束。
5. **Step 5 — 编辑面板**：实现 `ConstraintEditor`，类型切换、参数输入、颜色选择、重画。
6. **Step 6 — 联动收尾**：约束数据汇入 solve/validate 请求，端到端测试。
