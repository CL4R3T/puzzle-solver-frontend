import { useState } from 'react'
import './Layout.css'

const puzzleTypes = [
  { id: 'home', name: '首页', icon: '⌂' },
  { id: 'sudoku', name: '数独求解器', icon: '⊞' },
]

export default function Layout({ children, activePuzzle, onNavigate }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>谜题求解器</h2>
        </div>
        <nav className="sidebar-nav">
          {puzzleTypes.map(puzzle => (
            <button
              key={puzzle.id}
              className={`nav-item ${activePuzzle === puzzle.id ? 'active' : ''}`}
              onClick={() => onNavigate(puzzle.id)}
            >
              <span className="nav-icon">{puzzle.icon}</span>
              <span className="nav-name">{puzzle.name}</span>
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export function usePuzzleNavigation() {
  const [activePuzzle, setActivePuzzle] = useState('home')
  const navigate = (id) => setActivePuzzle(id)
  return { activePuzzle, navigate }
}