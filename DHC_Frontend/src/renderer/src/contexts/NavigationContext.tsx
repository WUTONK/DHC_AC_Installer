import React, { createContext, useContext, ReactNode } from 'react'

interface NavigationContextType {
  navigate: (page: string) => void
  goHome: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

interface NavigationProviderProps {
  children: ReactNode
  onNavigate: (page: string) => void
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children, onNavigate }) => {
  const navigate = (page: string): void => {
    onNavigate(page)
  }

  const goHome = (): void => {
    onNavigate('Home')
  }

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

