export const environment = {
  production: false,
  apiUrl: '/api/v1',
  // The public MinIO host the browser can reach. Backend returns URLs using its
  // internal docker host (`minio:9000`), which we rewrite to this value via
  // `AuthService.formatAvatarUrl`/`formatAssetUrl`.
  minioInternalHost: 'minio:9000',
  minioPublicHost: 'localhost:9000',
};
