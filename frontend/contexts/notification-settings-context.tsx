"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react"

interface NotificationSettingsContextType {
  showBell: boolean
  isMounted: boolean
  setShowBell: (value: boolean) => void
}

const NotificationSettingsContext = createContext<NotificationSettingsContextType | undefined>(undefined)

const STORAGE_KEY = "notification-settings"

interface StoredSettings {
  showBell: boolean
}

export function NotificationSettingsProvider({ children }: { children: ReactNode }) {
  const [showBell, setShowBellState] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const settings: StoredSettings = JSON.parse(stored)
        if (typeof settings.showBell === "boolean") {
          setShowBellState(settings.showBell)
        }
      } catch {
        // Ignore parse errors
      }
    }
    setMounted(true)
  }, [])

  const setShowBell = (value: boolean) => {
    setShowBellState(value)
    const settings: StoredSettings = { showBell: value }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<NotificationSettingsContextType>(() => ({
    showBell,
    isMounted: mounted,
    setShowBell,
  }), [showBell, mounted])

  return (
    <NotificationSettingsContext.Provider value={contextValue}>
      {children}
    </NotificationSettingsContext.Provider>
  )
}

export function useNotificationSettings() {
  const context = useContext(NotificationSettingsContext)
  if (context === undefined) {
    throw new Error("useNotificationSettings must be used within a NotificationSettingsProvider")
  }
  return context
}
