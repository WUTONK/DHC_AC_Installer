import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { resolveRoute, ROUTES } from '../routes'

interface NavigateOptions {
  state?: Record<string, unknown>
}

interface NavigationContextType {
  navigate: (pageNameOrPath: string, options?: NavigateOptions) => void
  goHome: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children }) => {
  const routerNavigate = useNavigate()

  const navigate = useCallback(
    (pageNameOrPath: string, options?: NavigateOptions): void => {
      routerNavigate(resolveRoute(pageNameOrPath), { state: options?.state })
    },
    [routerNavigate]
  )

  const goHome = useCallback((): void => {
    routerNavigate(ROUTES.HOME)
  }, [routerNavigate])

  return (
    <NavigationContext.Provider value={{ navigate, goHome }}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}
