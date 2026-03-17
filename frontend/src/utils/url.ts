const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export const getBackendBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl || !ABSOLUTE_URL_PATTERN.test(apiUrl)) {
    return '';
  }

  return apiUrl.replace(/\/api\/?$/, '');
};

export const getAssetUrl = (assetPath?: string | null): string | null => {
  if (!assetPath) {
    return null;
  }

  if (ABSOLUTE_URL_PATTERN.test(assetPath)) {
    return assetPath;
  }

  return `${getBackendBaseUrl()}${assetPath}`;
};
