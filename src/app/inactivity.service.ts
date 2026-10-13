import { Injectable, inject, OnDestroy, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Subject, fromEvent, merge } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { InactivityModalComponent } from './inactivity-modal/inactivity-modal.component';


/**
 * Servicio global para manejar la inactividad del usuario.
 * Muestra un modal y redirige a la página de inicio después de 15 minutos de inactividad.
 * Funciona globalmente para todas las páginas y microfrontends.
 */
@Injectable({
  providedIn: 'root',
})
export class InactivityService implements OnDestroy {
  private readonly _router = inject(Router);
  private readonly _document = inject(DOCUMENT);
  private readonly _appRef = inject(ApplicationRef);
  private readonly _injector = inject(EnvironmentInjector);
  
  //private readonly _invactivityTimeout = 1 * 60 * 1000;
  private readonly _invactivityTimeout = 10 * 1000;
  private readonly _storageKey = 'lastActivityTimestamp';
  private readonly _storageEventKey = 'inactivityCheck';
  
  private _inactivityTimer: any = null;
  private _destroy$ = new Subject<void>();
  private _isInitialized = false;
  private _modalComponentRef: ComponentRef<InactivityModalComponent> | null = null;

  /**
   * Inicializa el servicio de inactividad
   */
  initialize(): void {
    if (this._isInitialized) {
      return;
    }

    this._isInitialized = true;
    this._setupActivityListeners();
    this._setupStorageSync();
    this._resetInactivityTimer();
  }

  /**
   * Configura los listeners de eventos de actividad
   */
  private _setupActivityListeners(): void {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'keydown',
    ];

    const activityObservables = activityEvents.map((event) =>
      fromEvent(this._document, event, { passive: true })
    );

    merge(...activityObservables)
      .pipe(
        debounceTime(1000),
        takeUntil(this._destroy$)
      )
      .subscribe(() => {
        this._onUserActivity();
      });


    fromEvent(this._document, 'visibilitychange')
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        if (!this._document.hidden) {
          this._checkLastActivity();
        }
      });
  }

  /**
   * Configura la sincronización entre pestañas usando localStorage
   */
  private _setupStorageSync(): void {
    fromEvent<StorageEvent>(window, 'storage')
      .pipe(takeUntil(this._destroy$))
      .subscribe((event) => {
        if (event.key === this._storageKey) {
          this._checkLastActivity();
        } else if (event.key === this._storageEventKey) {
          this._handleInactivity();
        }
      });
  }

  /**
   * Maneja la actividad del usuario
   */
  private _onUserActivity(): void {
    const now = Date.now();
    
    try {
      localStorage.setItem(this._storageKey, now.toString());
    } catch (e) {
    }

    this._resetInactivityTimer();
  }

  /**
   * Reinicia el temporizador de inactividad
   */
  private _resetInactivityTimer(): void {
    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
    }

    this._inactivityTimer = setTimeout(() => {
      this._handleInactivity();
    }, this._invactivityTimeout);
  }

  /**
   * Verifica la última actividad desde localStorage
   * Útil cuando la pestaña vuelve a ser visible
   */
  private _checkLastActivity(): void {
    try {
      const lastActivityStr = localStorage.getItem(this._storageKey);
      if (!lastActivityStr) {
        this._resetInactivityTimer();
        return;
      }

      const lastActivity = parseInt(lastActivityStr, 10);
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;

      if (timeSinceActivity >= this._invactivityTimeout) {
        this._handleInactivity();
      } else {
        const remainingTime = this._invactivityTimeout - timeSinceActivity;
        if (this._inactivityTimer) {
          clearTimeout(this._inactivityTimer);
        }
        this._inactivityTimer = setTimeout(() => {
          this._handleInactivity();
        }, remainingTime);
      }
    } catch (e) {
      this._resetInactivityTimer();
    }
  }

  /**
   * Maneja el evento de inactividad
   * Crea y muestra el modal dinámicamente antes de redirigir
   */
  private _handleInactivity(): void {
    try {
      localStorage.setItem(this._storageEventKey, Date.now().toString());
      localStorage.removeItem(this._storageEventKey);
    } catch (e) {
    }

    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }

    this._showModal();
  }

  /**
   * Crea y muestra el modal de inactividad dinámicamente
   */
  private _showModal(): void {
    if (this._modalComponentRef) {
      return;
    }

    this._modalComponentRef = createComponent(InactivityModalComponent, {
      environmentInjector: this._injector,
    });

    const modalElement = this._modalComponentRef.location.nativeElement;
    const modalRoot = this._document.getElementById('modal-root');

    if (modalRoot) {
      modalRoot.appendChild(modalElement);
    } else {
      this._document.body.appendChild(modalElement);
    }

    this._appRef.attachView(this._modalComponentRef.hostView);

    this._modalComponentRef.instance.onClose$
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        this._closeModal();
        this._router.navigate(['/'], { replaceUrl: true });
      });
  }

  /**
   * Cierra y destruye el modal
   */
  private _closeModal(): void {
    if (this._modalComponentRef) {
      this._appRef.detachView(this._modalComponentRef.hostView);
      this._modalComponentRef.destroy();
      this._modalComponentRef = null;
    }
  }

  /**
   * Reinicia manualmente el temporizador de inactividad
   * Útil para acciones específicas que quieras considerar como actividad
   */
  resetTimer(): void {
    this._onUserActivity();
  }

  /**
   * Limpia recursos al destruir el servicio
   */
  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();

    if (this._inactivityTimer) {
      clearTimeout(this._inactivityTimer);
      this._inactivityTimer = null;
    }

    this._closeModal();
  }
}
