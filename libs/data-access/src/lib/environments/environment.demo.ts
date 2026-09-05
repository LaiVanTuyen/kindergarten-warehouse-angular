export const environment = {
  production: true,
  // Same-origin. Nginx của Portal/Admin proxy `/api` tới backend demo nằm
  // trong docker network, nên FE không biết và không cần biết host của BE.
  // Đổi hostname, hay chuyển cả stack từ máy local sang VPS, đều không phải
  // build lại frontend.
  apiUrl: '/api/v1',
  // Backend demo chạy với MINIO_PUBLIC_ENDPOINT rỗng, nên MinioStorageService
  // đã trả sẵn đường dẫn tương đối `/warehouse-demo-bucket/<key>`. Không còn
  // host nội bộ nào để viết lại ⇒ `AuthService.formatAssetUrl` thành no-op.
  minioInternalHost: '',
  minioPublicHost: '',
};
