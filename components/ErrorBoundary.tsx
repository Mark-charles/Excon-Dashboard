"use client"

import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = { hasError: boolean; error?: Error }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-6 m-4 rounded border border-red-700 bg-red-900/30 text-red-100">
          <h2 className="text-lg font-semibold mb-2">Something went wrong.</h2>
          <pre className="text-xs opacity-80 whitespace-pre-wrap">{this.state.error?.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

