import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  testAccessApi,
  getTestAccessToken,
  setTestAccessToken,
  clearTestAccessToken,
} from "../services/api"
import type { TestAccessResponse } from "../types/api"
import { errorStatus } from "../utils/errors"

export interface TestAccessContextValue {
  token: string | null
  authenticated: boolean
  verifying: boolean
  submit: (password: string) => Promise<void>
  exit: () => void
}

const TestAccessContext = createContext<TestAccessContextValue | null>(null)

export function TestAccessProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getTestAccessToken())
  const [authenticated, setAuthenticated] = useState<boolean>(() => Boolean(getTestAccessToken()))
  const [verifying, setVerifying] = useState<boolean>(() => Boolean(getTestAccessToken()))

  useEffect(() => {
    let cancelled = false
    setVerifying(true)
    void testAccessApi
      .verify()
      .then((result: TestAccessResponse) => {
        if (cancelled) return
        if (result.authenticated) {
          setAuthenticated(true)
        } else {
          setTestAccessToken(null)
          setToken(null)
          setAuthenticated(false)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const gateRejection = errorStatus(error) === 401
        if (gateRejection) {
          setTestAccessToken(null)
          setToken(null)
          setAuthenticated(false)
        } else {
          setAuthenticated(true)
        }
      })
      .finally(() => {
        if (!cancelled) setVerifying(false)
      })
    return () => { cancelled = true }
  }, [])

  const submit = useCallback(async (password: string): Promise<void> => {
    const result = await testAccessApi.submit(password)
    if (result.authenticated && (result.token || result.disabled)) {
      const stored = result.token || "gate-disabled"
      setTestAccessToken(stored)
      setToken(stored)
      setAuthenticated(true)
    } else if (!result.authenticated) {
      throw new Error(result.error || "Invalid password")
    }
  }, [])

  const exit = useCallback((): void => {
    clearTestAccessToken()
    setToken(null)
    setAuthenticated(false)
  }, [])

  const value = useMemo<TestAccessContextValue>(
    () => ({ token, authenticated, verifying, submit, exit }),
    [token, authenticated, verifying, submit, exit],
  )

  return <TestAccessContext.Provider value={value}>{children}</TestAccessContext.Provider>
}

export function useTestAccess(): TestAccessContextValue {
  const context = useContext(TestAccessContext)
  if (!context) throw new Error("useTestAccess must be used within a TestAccessProvider")
  return context
}
