// Cache buster utility to ensure latest version is loaded
export const CACHE_BUSTER = {
  version: Date.now(),
  
  // Add version parameter to URLs
  addVersion: (url: string) => {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${CACHE_BUSTER.version}`
  },
  
  // Force reload the page
  forceReload: () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  },
  
  // Clear browser cache (if possible)
  clearCache: () => {
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
  },
  
  // Check if we need to reload (compare with stored version)
  checkForUpdates: () => {
    if (typeof window !== 'undefined') {
      const storedVersion = localStorage.getItem('app-version')
      const currentVersion = CACHE_BUSTER.version.toString()
      
      if (storedVersion !== currentVersion) {
        localStorage.setItem('app-version', currentVersion)
        return true
      }
    }
    return false
  }
}

// Auto-check for updates on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (CACHE_BUSTER.checkForUpdates()) {
      console.log('New version detected, clearing cache...')
      CACHE_BUSTER.clearCache()
    }
  })
}
