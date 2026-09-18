/// <reference types="vite/client" />

/**
 * Helper to resolve static assets correctly across different base paths (e.g. GitHub Pages subpaths or root domains)
 */
export const getAssetUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const unsplashMap: Record<string, string> = {
    'issues/garbage.jpg': 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=800&q=80',
    'issues/garbage_after.jpg': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80',
    'issues/waterleak.jpg': 'https://images.unsplash.com/photo-1542034026-613d2f2b38f8?auto=format&fit=crop&w=800&q=80',
    'issues/waterleak_after.jpg': 'https://images.unsplash.com/photo-1587574293144-884ee2ec8b6b?auto=format&fit=crop&w=800&q=80',
    'issues/streetlight.jpg': 'https://images.unsplash.com/photo-1520188981452-4468f760eb80?auto=format&fit=crop&w=800&q=80',
    'issues/streetlight_after.jpg': 'https://images.unsplash.com/photo-1509395176047-4a66953fd231?auto=format&fit=crop&w=800&q=80',
    'issues/drain.jpg': 'https://images.unsplash.com/photo-1579785864149-a1705e4d2716?auto=format&fit=crop&w=800&q=80',
    'issues/drain_after.jpg': 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80',
  };

  if (unsplashMap[path]) {
    return unsplashMap[path];
  }

  const base = (import.meta as any).env?.BASE_URL || '/Civic-Hero/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${cleanPath}`;
};
