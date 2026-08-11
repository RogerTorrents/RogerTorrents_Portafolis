import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { SessioService } from './sessio.service';

/**
 * Afegeix `Authorization: Bearer <accessToken>` a totes les crides cap a
 * `geoexplorer-api`. Si una crida privada torna 401 (access token caducat),
 * intenta refrescar-lo un cop via `SessioService.refrescarToken()` i
 * reintenta la petició original amb el token nou.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);

  const sessio = inject(SessioService);
  const accessToken = sessio.obtenirAccessToken();
  const peticio = accessToken ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }) : req;

  return next(peticio).pipe(
    catchError((error: unknown) => {
      const esNoAutoritzat = error instanceof HttpErrorResponse && error.status === 401;
      const esPeticioAuth = req.url.includes('/auth/');
      if (!esNoAutoritzat || esPeticioAuth || !accessToken) return throwError(() => error);

      return sessio.refrescarToken().pipe(
        switchMap(nouAccessToken => {
          if (!nouAccessToken) return throwError(() => error);
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${nouAccessToken}` } }));
        }),
      );
    }),
  );
};
