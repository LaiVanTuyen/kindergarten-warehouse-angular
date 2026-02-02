import { HttpInterceptorFn } from '@angular/common/http';

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getCookie('XSRF-TOKEN');
  console.log('CSRF Interceptor - Cookie Token:', token); // Debug log

  if (token) {
    req = req.clone({
      setHeaders: {
        'X-XSRF-TOKEN': token,
      },
      setParams: {
        _csrf: token,
      },
    });
    console.log(
      'CSRF Interceptor - Header & Param Added:',
      req.headers.get('X-XSRF-TOKEN')
    ); // Debug log
  } else {
    console.warn('CSRF Interceptor - No XSRF-TOKEN cookie found!');
  }

  return next(req);
};

function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
