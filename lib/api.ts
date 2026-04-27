export const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Ensure we don't double slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In Capacitor/Production, we need the full URL
  // In local web dev, relative paths work if it's the same origin
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // If we're on localhost web, keep relative for easy dev
    // UNLESS we want to test against the production API
    if (baseUrl && !baseUrl.includes('localhost')) {
        return `${baseUrl}${cleanPath}`;
    }
    return cleanPath;
  }
  
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};
