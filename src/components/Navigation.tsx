import type { CSSProperties } from 'react'
import { CheckSquare2, Layers3, LayoutDashboard, NotebookPen } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', Icon: CheckSquare2 },
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
  { id: 'library', label: 'Library', Icon: Layers3 },
] as const

type Tab = typeof tabs[number]['id']

export function Navigation({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  return <nav className="bottom-nav glass" aria-label="Main navigation"
    style={{ '--nav-index': tabs.findIndex(item => item.id === tab) } as CSSProperties}>
    <span className="nav-indicator" aria-hidden="true"/>
    {tabs.map(({ id, label, Icon }) => <button key={id} type="button" aria-label={label}
      aria-current={tab === id ? 'page' : undefined} className={tab === id ? 'active' : ''}
      onClick={() => onChange(id)}>
      <Icon size={20} aria-hidden="true"/><span className="nav-label" aria-hidden="true">{label}</span>
    </button>)}
  </nav>
}
