/**
 * Clears all auth-related state from browser storage.
 * Useful for debugging auth issues or when session gets corrupted.
 */
export function clearAuthState() {
  try {
    // Clear localStorage items related to auth
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key?.includes("better-auth") ||
        key?.includes("convex") ||
        key?.includes("session")
      ) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    // Clear sessionStorage
    sessionStorage.clear();

    return true;
  } catch {
    return false;
  }
}

/**
 * Force redirect to login after clearing auth state.
 * Call this when auth is completely broken.
 */
export function forceLogout() {
  clearAuthState();
  window.location.href = "/login";
}
