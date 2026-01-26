---
name: Quick Notes
icon: StickyNote
category: productivity
tags: [notes, writing, quick]
window: floating
size: [400, 500]
dock: true
---

# Quick Notes

A simple note-taking app with automatic saving. Perfect for jotting down quick thoughts and ideas.

## UI

```tsx App
import { Plus, Trash2, FileText } from 'lucide-react'

export default function App() {
  const [notes, setNotes] = useStorage('notes', [
    { id: 1, text: 'Welcome to Quick Notes!', createdAt: Date.now() }
  ])
  const [activeId, setActiveId] = useState(notes[0]?.id || null)

  const activeNote = notes.find(n => n.id === activeId)

  const createNote = () => {
    const newNote = {
      id: Date.now(),
      text: '',
      createdAt: Date.now()
    }
    setNotes([newNote, ...notes])
    setActiveId(newNote.id)
  }

  const updateNote = (text) => {
    setNotes(notes.map(n =>
      n.id === activeId ? { ...n, text } : n
    ))
  }

  const deleteNote = (id) => {
    const remaining = notes.filter(n => n.id !== id)
    setNotes(remaining)
    if (activeId === id) {
      setActiveId(remaining[0]?.id || null)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-32 border-r border-white/10 flex flex-col">
        {/* New Note Button */}
        <button
          onClick={createNote}
          className="m-2 p-2 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-2 text-sm transition-all"
        >
          <Plus size={16} />
          New
        </button>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto">
          {notes.map(note => (
            <button
              key={note.id}
              onClick={() => setActiveId(note.id)}
              className={cn(
                "w-full p-2 text-left border-b border-white/5 hover:bg-white/5 transition-all",
                activeId === note.id && "bg-white/10"
              )}
            >
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-white/40 flex-shrink-0" />
                <span className="text-xs text-white/60 truncate">
                  {note.text.slice(0, 20) || 'Empty note'}
                </span>
              </div>
              <div className="text-[10px] text-white/30 mt-1 ml-5">
                {formatDate(note.createdAt)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-white/10">
              <span className="text-xs text-white/40">
                {formatDate(activeNote.createdAt)}
              </span>
              <button
                onClick={() => deleteNote(activeNote.id)}
                className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Text Area */}
            <textarea
              value={activeNote.text}
              onChange={(e) => updateNote(e.target.value)}
              placeholder="Start typing..."
              className="flex-1 p-4 bg-transparent resize-none focus:outline-none text-white/90 placeholder:text-white/30"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/30">
            <div className="text-center">
              <FileText size={40} className="mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <button
                onClick={createNote}
                className="mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Create one
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

## Commands

| Command | Description |
|---------|-------------|
| New Note | Create a new note |
| Quick Notes | Open Quick Notes app |
