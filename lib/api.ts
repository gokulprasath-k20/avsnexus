const PRODUCTION_URL = 'https://avsnexus.vercel.app';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Server-side rendering: always relative
  if (typeof window === 'undefined') {
    return cleanPath;
  }

  const hostname = window.location.hostname;

  // Localhost dev → relative paths (no CORS issues)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return cleanPath;
  }

  // Capacitor native WebView (capacitor://localhost or ionic://)
  // Must use full production URL
  if (
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:' ||
    hostname === 'localhost' && window.location.port === ''
  ) {
    return `${PRODUCTION_URL}${cleanPath}`;
  }

  // Deployed web (vercel) → relative paths work fine
  return cleanPath;
};
