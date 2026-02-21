'use client'

import { useState, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { cn, getTagColor } from '@/lib/utils'

interface TagChipsProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagChips({ tags, onChange }: TagChipsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRemove = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleAdd = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInputValue('')
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    } else if (e.key === 'Escape') {
      setInputValue('')
      setIsAdding(false)
    }
  }

  const startAdding = () => {
    setIsAdding(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => {
        const color = getTagColor(tag)
        return (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {tag}
            <button
              onClick={() => handleRemove(index)}
              aria-label="Remove tag"
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
            >
              <X size={12} />
            </button>
          </span>
        )
      })}

      {isAdding ? (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder="Add tag..."
          className="h-7 w-24 rounded-full bg-zinc-900 border border-zinc-800 px-3 text-xs text-zinc-50 placeholder:text-zinc-500 focus:border-accent-600 focus:outline-none focus:ring-1 focus:ring-accent-600/50"
        />
      ) : (
        <button
          onClick={startAdding}
          aria-label="Add tag"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-zinc-300"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  )
}
