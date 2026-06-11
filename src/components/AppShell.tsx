'use client'
import { useState, createContext, useContext } from 'react'
import { useCrypto } from '@/hooks/useCrypto'
import type { CryptoData } from '@/hooks/useCrypto'

interface AppContextType {
  cryptoId: string
  setCryptoId: (id: string) => void
  cryptoData: CryptoData | null
  cryptoLoading: boolean
}

const AppContext = createContext<AppContextType>({
  cryptoId: 'bitcoin',
  setCryptoId: () => {},
  cryptoData: null,
  cryptoLoading: true,
})

export function useApp() { return useContext(AppContext) }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [cryptoId, setCryptoId] = useState('bitcoin')
  const { data, loading } = useCrypto(cryptoId)

  return (
    <AppContext.Provider value={{ cryptoId, setCryptoId, cryptoData: data, cryptoLoading: loading }}>
      {children}
    </AppContext.Provider>
  )
}