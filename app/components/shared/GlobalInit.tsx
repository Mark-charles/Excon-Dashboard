'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandling } from '../../../app/utils/loggingUtils'

export default function GlobalInit() {
  useEffect(() => {
    setupGlobalErrorHandling()
  }, [])
  return null
}

