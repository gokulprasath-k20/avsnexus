export const getApiUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  // Ensure we don't double slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // In Capacitor/Production, we need the full URL
  // In local web dev, relative paths work if it's the same origin
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // On localhost web, always prefer relative paths to avoid CORS issues
    // with production API URLs in .env.local
    return cleanPath;
  }
  
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
};
