const SESSION_KEY = 'gezikoltuk.admin.pass'

export const DEFAULT_ADMIN_PASSWORD = 'bolu2026'

export function expectedAdminPassword(): string {
  const configured = import.meta.env.VITE_ADMIN_PASSWORD?.trim()
  return configured || DEFAULT_ADMIN_PASSWORD
}

export function readStoredAdminPassword(): string | null {
  const value = sessionStorage.getItem(SESSION_KEY)
  return value && value.length > 0 ? value : null
}

export function storeAdminPassword(password: string): void {
  sessionStorage.setItem(SESSION_KEY, password)
}

export function clearStoredAdminPassword(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
