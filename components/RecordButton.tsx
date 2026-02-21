'use client'

import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'
import Link from 'next/link'

export default function RecordButton() {
  return (
    <Link href="/recording">
      <motion.div
        className="relative flex items-center justify-center"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        {/* Outer pulse */}
        <motion.div
          className="absolute w-24 h-24 rounded-full bg-accent-600/10"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Middle pulse */}
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-accent-600/20"
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.3,
          }}
        />

        {/* Inner pulse */}
        <motion.div
          className="absolute w-20 h-20 rounded-full bg-accent-600/15"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.6,
          }}
        />

        {/* Glow */}
        <div className="absolute w-20 h-20 rounded-full bg-accent-600/20 blur-xl" />

        {/* Main button */}
        <motion.div
          className="relative w-20 h-20 rounded-full bg-accent-600 flex items-center justify-center shadow-lg shadow-accent-600/30"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        >
          <Mic size={28} className="text-white" strokeWidth={2} />
        </motion.div>
      </motion.div>
    </Link>
  )
}
