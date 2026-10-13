import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface CookieConsent {
  statistics: boolean;
  marketing: boolean;
  version: number;
  date: string;
}

/**
 * Servicio global para manejar el consentimiento de cookies.
 * El shell guarda la decisión en una cookie compartida y emite un evento
 * en window para que los microfrontends puedan reaccionar sin depender del shell.
 */
@Injectable({
  providedIn: 'root',
})
export class CookieConsentService {
  private readonly _document = inject(DOCUMENT);

  // Subir la versión obliga a volver a pedir consentimiento (p.ej. cambio de política)
  private readonly _version = 1;
  private readonly _cookieName = 'cookie_consent';
  private readonly _maxAgeDays = 180;
  static readonly CHANGE_EVENT = 'cookie-consent-changed';

  private readonly _consent$ = new BehaviorSubject<CookieConsent | null>(this._read());
  readonly consent$ = this._consent$.asObservable();

  get consent(): CookieConsent | null {
    return this._consent$.value;
  }

  /**
   * Indica si se debe mostrar el banner
   */
  hasConsent(): boolean {
    return this._consent$.value !== null;
  }

  acceptAll(): void {
    this._save({ statistics: true, marketing: true });
  }

  save(preferences: Pick<CookieConsent, 'statistics' | 'marketing'>): void {
    this._save(preferences);
  }

  /**
   * Elimina el consentimiento para volver a mostrar el banner
   */
  reset(): void {
    this._document.cookie = `${this._cookieName}=; path=/; max-age=0; SameSite=Lax`;
    this._consent$.next(null);
  }

  private _save(preferences: Pick<CookieConsent, 'statistics' | 'marketing'>): void {
    const consent: CookieConsent = {
      statistics: preferences.statistics,
      marketing: preferences.marketing,
      version: this._version,
      date: new Date().toISOString(),
    };

    const value = encodeURIComponent(JSON.stringify(consent));
    const maxAge = this._maxAgeDays * 24 * 60 * 60;
    this._document.cookie = `${this._cookieName}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;

    this._consent$.next(consent);
    this._document.defaultView?.dispatchEvent(
      new CustomEvent<CookieConsent>(CookieConsentService.CHANGE_EVENT, { detail: consent })
    );
  }

  private _read(): CookieConsent | null {
    try {
      const raw = this._document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${this._cookieName}=`))
        ?.split('=')[1];

      if (!raw) {
        return null;
      }

      const consent = JSON.parse(decodeURIComponent(raw)) as CookieConsent;
      return consent.version === this._version ? consent : null;
    } catch (e) {
      return null;
    }
  }
}
