/// <reference types="vite/client" />

/**
 * Helper to resolve static assets correctly across different base paths (e.g. GitHub Pages subpaths or root domains)
 */
export const getAssetUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = (import.meta as any).env?.BASE_URL || '/Civic-Hero/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${cleanPath}`;
};

