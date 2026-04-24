export const environment = {
  production: true,
  apiUrl: 'https://api.programmingwithtuyen.com/api/v1',
  // In prod the backend should already return public URLs, so internal/public
  // are identical. Keeping the fields ensures `formatAssetUrl` is a no-op
  // instead of a string replace that could mangle a real URL.
  minioInternalHost: '',
  minioPublicHost: '',
};
