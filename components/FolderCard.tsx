'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FolderOpen } from 'lucide-react'
import type { Folder } from '@/types'

interface FolderCardProps {
  folder: Folder
  noteCount: number
  index?: number
}

export default function FolderCard({ folder, noteCount, index = 0 }: FolderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileTap={{ scale: 0.98 }}
      whileHover={{ scale: 1.01 }}
    >
      <Link href={`/folders/${folder.id}`}>
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-200 border-l-4"
          style={{ borderLeftColor: folder.color }}
        >
          <div className="flex items-center gap-3">
            <FolderOpen size={18} style={{ color: folder.color }} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-50 truncate">
                {folder.name}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {noteCount} {noteCount === 1 ? 'note' : 'notes'}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
