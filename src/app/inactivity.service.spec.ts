import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, EnvironmentInjector, createComponent } from '@angular/core';
import { Subject } from 'rxjs';
import { InactivityService } from './inactivity.service';
import { InactivityModalComponent } from './inactivity-modal/inactivity-modal.component';

describe('InactivityService', () => {
  let service: InactivityService;
  let router: jasmine.SpyObj<Router>;
  let document: jasmine.SpyObj<Document>;
  let appRef: ApplicationRef;
  let injector: EnvironmentInjector;
  let mockModalComponentRef: jasmine.SpyObj<ComponentRef<InactivityModalComponent>>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    // Crear un mock de document que sea un EventTarget válido
    const documentSpy = jasmine.createSpyObj('Document', ['getElementById', 'addEventListener', 'removeEventListener', 'dispatchEvent'], {
      body: jasmine.createSpyObj('Body', ['appendChild']),
      hidden: false,
    });
    
    // fromEvent necesita addEventListener y removeEventListener para funcionar
    // Necesitamos hacer que estos métodos funcionen como EventTarget
    const eventListeners: { [key: string]: EventListener[] } = {};
    documentSpy.addEventListener = jasmine.createSpy('addEventListener').and.callFake((event: string, listener: EventListener) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(listener);
    });
    documentSpy.removeEventListener = jasmine.createSpy('removeEventListener').and.callFake((event: string, listener: EventListener) => {
      if (eventListeners[event]) {
        const index = eventListeners[event].indexOf(listener);
        if (index > -1) {
          eventListeners[event].splice(index, 1);
        }
      }
    });
    documentSpy.dispatchEvent = jasmine.createSpy('dispatchEvent').and.callFake((event: Event) => {
      const eventType = event.type;
      if (eventListeners[eventType]) {
        eventListeners[eventType].forEach(listener => {
          try {
            listener(event);
          } catch (e) {
            // Ignorar errores en listeners
          }
        });
      }
      return true;
    });

    const mockModalInstance = {
      closeModal: new Subject<void>(),
      get onClose$() {
        return this.closeModal.asObservable();
      },
    };

    // Crear un elemento mock para el nativeElement
    const mockNativeElement = {
      tagName: 'DIV',
      appendChild: jasmine.createSpy('appendChild'),
      removeChild: jasmine.createSpy('removeChild'),
    } as any;

    mockModalComponentRef = jasmine.createSpyObj('ComponentRef', ['destroy'], {
      location: {
        nativeElement: mockNativeElement,
      },
      hostView: {},
      instance: mockModalInstance,
    });

    TestBed.configureTestingModule({
      providers: [
        InactivityService,
        { provide: Router, useValue: routerSpy },
        { provide: DOCUMENT, useValue: documentSpy },
      ],
    });

    service = TestBed.inject(InactivityService);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    document = TestBed.inject(DOCUMENT) as jasmine.SpyObj<Document>;
    appRef = TestBed.inject(ApplicationRef);
    injector = TestBed.inject(EnvironmentInjector);

    // Limpiar localStorage antes de cada test
    localStorage.clear();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    localStorage.clear();
    if (service) {
      service.ngOnDestroy();
    }
  });

  describe('initialize', () => {
    it('should initialize the service and set up listeners', () => {
      spyOn(service as any, '_setupActivityListeners');
      spyOn(service as any, '_setupStorageSync');
      spyOn(service as any, '_resetInactivityTimer');

      service.initialize();

      expect((service as any)._isInitialized).toBe(true);
      expect((service as any)._setupActivityListeners).toHaveBeenCalled();
      expect((service as any)._setupStorageSync).toHaveBeenCalled();
      expect((service as any)._resetInactivityTimer).toHaveBeenCalled();
    });

    it('should not initialize twice if already initialized', () => {
      spyOn(service as any, '_setupActivityListeners');
      spyOn(service as any, '_setupStorageSync');
      spyOn(service as any, '_resetInactivityTimer');

      service.initialize();
      service.initialize();

      expect((service as any)._setupActivityListeners).toHaveBeenCalledTimes(1);
      expect((service as any)._setupStorageSync).toHaveBeenCalledTimes(1);
      expect((service as any)._resetInactivityTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('_setupActivityListeners', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should listen to activity events and reset timer on activity', (done) => {
      spyOn(service as any, '_onUserActivity');

      const mouseEvent = new MouseEvent('mousedown', { bubbles: true });
      document.dispatchEvent(mouseEvent);

      setTimeout(() => {
        expect((service as any)._onUserActivity).toHaveBeenCalled();
        done();
      }, 1100);
    });

    it('should check last activity when tab becomes visible', (done) => {
      spyOn(service as any, '_checkLastActivity');
      
      const visibilityEvent = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', {
        value: false,
        writable: true,
        configurable: true,
      });
      document.dispatchEvent(visibilityEvent);

      setTimeout(() => {
        expect((service as any)._checkLastActivity).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('_setupStorageSync', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should check last activity when storage key changes', (done) => {
      spyOn(service as any, '_checkLastActivity');

      const storageEvent = new StorageEvent('storage', {
        key: (service as any)._storageKey,
        newValue: Date.now().toString(),
      });
      window.dispatchEvent(storageEvent);

      setTimeout(() => {
        expect((service as any)._checkLastActivity).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle inactivity when storage event key changes', (done) => {
      spyOn(service as any, '_handleInactivity');

      const storageEvent = new StorageEvent('storage', {
        key: (service as any)._storageEventKey,
        newValue: Date.now().toString(),
      });
      window.dispatchEvent(storageEvent);

      setTimeout(() => {
        expect((service as any)._handleInactivity).toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('_onUserActivity', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should update localStorage with current timestamp', () => {
      const setItemSpy = spyOn(localStorage, 'setItem');
      const now = Date.now();

      (service as any)._onUserActivity();

      expect(setItemSpy).toHaveBeenCalledWith(
        (service as any)._storageKey,
        jasmine.any(String)
      );
    });

    it('should reset inactivity timer', () => {
      spyOn(service as any, '_resetInactivityTimer');

      (service as any)._onUserActivity();

      expect((service as any)._resetInactivityTimer).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage quota exceeded');
      spyOn(service as any, '_resetInactivityTimer');

      expect(() => (service as any)._onUserActivity()).not.toThrow();
      expect((service as any)._resetInactivityTimer).toHaveBeenCalled();
    });
  });

  describe('_resetInactivityTimer', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should clear existing timer before setting new one', () => {
      const clearTimeoutSpy = spyOn(window, 'clearTimeout');
      (service as any)._inactivityTimer = setTimeout(() => {
        // Timer mock
      }, 1000);

      (service as any)._resetInactivityTimer();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should set new inactivity timer', () => {
      spyOn(window, 'setTimeout').and.callThrough();
      spyOn(service as any, '_handleInactivity');

      (service as any)._resetInactivityTimer();

      expect(window.setTimeout).toHaveBeenCalled();
    });

    it('should call _handleInactivity after timeout', () => {
      spyOn(service as any, '_handleInactivity');

      (service as any)._resetInactivityTimer();
      jasmine.clock().tick((service as any)._invactivityTimeout + 100);

      expect((service as any)._handleInactivity).toHaveBeenCalled();
    });
  });

  describe('_checkLastActivity', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should reset timer if no last activity found', () => {
      spyOn(service as any, '_resetInactivityTimer');
      localStorage.removeItem((service as any)._storageKey);

      (service as any)._checkLastActivity();

      expect((service as any)._resetInactivityTimer).toHaveBeenCalled();
    });

    it('should handle inactivity if time since activity exceeds timeout', () => {
      spyOn(service as any, '_handleInactivity');
      const oldTimestamp = Date.now() - (service as any)._invactivityTimeout - 1000;
      localStorage.setItem((service as any)._storageKey, oldTimestamp.toString());

      (service as any)._checkLastActivity();

      expect((service as any)._handleInactivity).toHaveBeenCalled();
    });

    it('should set timer with remaining time if activity was recent', () => {
      spyOn(window, 'setTimeout').and.callThrough();
      const recentTimestamp = Date.now() - 5000; // 5 seconds ago
      localStorage.setItem((service as any)._storageKey, recentTimestamp.toString());

      (service as any)._checkLastActivity();

      expect(window.setTimeout).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'getItem').and.throwError('Storage error');
      spyOn(service as any, '_resetInactivityTimer');

      (service as any)._checkLastActivity();

      expect((service as any)._resetInactivityTimer).toHaveBeenCalled();
    });
  });

  describe('_handleInactivity', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should set and remove storage event key', () => {
      spyOn(service as any, '_showModal');
      const setItemSpy = spyOn(localStorage, 'setItem');
      const removeItemSpy = spyOn(localStorage, 'removeItem');

      (service as any)._handleInactivity();

      expect(setItemSpy).toHaveBeenCalledWith(
        (service as any)._storageEventKey,
        jasmine.any(String)
      );
      expect(removeItemSpy).toHaveBeenCalledWith((service as any)._storageEventKey);
    });

    it('should clear inactivity timer', () => {
      spyOn(service as any, '_showModal');
      const clearTimeoutSpy = spyOn(window, 'clearTimeout');
      (service as any)._inactivityTimer = setTimeout(() => {
        // Timer mock
      }, 1000);

      (service as any)._handleInactivity();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect((service as any)._inactivityTimer).toBeNull();
    });

    it('should show modal', () => {
      spyOn(service as any, '_showModal');

      (service as any)._handleInactivity();

      expect((service as any)._showModal).toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      spyOn(localStorage, 'setItem').and.throwError('Storage error');
      spyOn(service as any, '_showModal');

      expect(() => (service as any)._handleInactivity()).not.toThrow();
      expect((service as any)._showModal).toHaveBeenCalled();
    });
  });

  describe('_showModal', () => {
    beforeEach(() => {
      service.initialize();
      // Reset modal component ref antes de cada test
      (service as any)._modalComponentRef = null;
    });

    it('should not create modal if one already exists', () => {
      (service as any)._modalComponentRef = mockModalComponentRef;
      const createComponentSpy = spyOn(require('@angular/core'), 'createComponent' as any);

      (service as any)._showModal();

      expect(createComponentSpy).not.toHaveBeenCalled();
    });

    it('should create modal component when modal root exists', () => {
      const mockModalRoot = {
        id: 'modal-root',
        appendChild: jasmine.createSpy('appendChild'),
      } as any;
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(mockModalRoot);
      const appendChildSpy = spyOn(mockModalRoot, 'appendChild');
      const attachViewSpy = spyOn(appRef, 'attachView');
      const createComponentSpy = spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      expect(createComponentSpy).toHaveBeenCalledWith(InactivityModalComponent, {
        environmentInjector: injector,
      });
      expect(appendChildSpy).toHaveBeenCalledWith(mockModalComponentRef.location.nativeElement);
      expect(attachViewSpy).toHaveBeenCalledWith(mockModalComponentRef.hostView);
      expect((service as any)._modalComponentRef).toBe(mockModalComponentRef);
    });

    it('should append to body when modal root does not exist', () => {
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(null);
      const appendChildSpy = spyOn(document.body, 'appendChild');
      const attachViewSpy = spyOn(appRef, 'attachView');
      const createComponentSpy = spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      expect(createComponentSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockModalComponentRef.location.nativeElement);
      expect(attachViewSpy).toHaveBeenCalledWith(mockModalComponentRef.hostView);
      expect((service as any)._modalComponentRef).toBe(mockModalComponentRef);
    });

    it('should subscribe to modal close event and navigate when onClose$ emits', () => {
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(null);
      spyOn(service as any, '_closeModal');
      spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      // Simular el cierre del modal emitiendo el evento onClose$
      (mockModalComponentRef.instance as any).closeModal.next();

      expect((service as any)._closeModal).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/'], { replaceUrl: true });
    });

    it('should use modal-root container when available', () => {
      const mockModalRoot = {
        id: 'modal-root',
        appendChild: jasmine.createSpy('appendChild'),
      } as any;
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(mockModalRoot);
      const appendChildSpy = spyOn(mockModalRoot, 'appendChild');
      const bodyAppendChildSpy = spyOn(document.body, 'appendChild');
      spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      expect(document.getElementById).toHaveBeenCalledWith('modal-root');
      expect(appendChildSpy).toHaveBeenCalled();
      expect(bodyAppendChildSpy).not.toHaveBeenCalled();
    });

    it('should use body container when modal-root does not exist', () => {
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(null);
      const appendChildSpy = spyOn(document.body, 'appendChild');
      spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      expect(document.getElementById).toHaveBeenCalledWith('modal-root');
      expect(appendChildSpy).toHaveBeenCalledWith(mockModalComponentRef.location.nativeElement);
    });

    it('should attach view to application ref after appending to DOM', () => {
      document.getElementById = jasmine.createSpy('getElementById').and.returnValue(null);
      const attachViewSpy = spyOn(appRef, 'attachView');
      spyOn(require('@angular/core'), 'createComponent' as any).and.returnValue(mockModalComponentRef);

      (service as any)._showModal();

      expect(attachViewSpy).toHaveBeenCalledWith(mockModalComponentRef.hostView);
    });
  });

  describe('_closeModal', () => {
    beforeEach(() => {
      service.initialize();
      (service as any)._modalComponentRef = mockModalComponentRef;
    });

    it('should detach view and destroy modal component', () => {
      const detachViewSpy = spyOn(appRef, 'detachView');
      
      (service as any)._closeModal();

      expect(detachViewSpy).toHaveBeenCalledWith(mockModalComponentRef.hostView);
      expect(mockModalComponentRef.destroy).toHaveBeenCalled();
      expect((service as any)._modalComponentRef).toBeNull();
    });

    it('should not throw if modal component ref is null', () => {
      (service as any)._modalComponentRef = null;

      expect(() => (service as any)._closeModal()).not.toThrow();
    });
  });

  describe('resetTimer', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should call _onUserActivity', () => {
      spyOn(service as any, '_onUserActivity');

      service.resetTimer();

      expect((service as any)._onUserActivity).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      service.initialize();
      (service as any)._inactivityTimer = setTimeout(() => {
        // Timer mock
      }, 1000);
      (service as any)._modalComponentRef = mockModalComponentRef;
    });

    it('should complete destroy subject', () => {
      const destroySpy = spyOn((service as any)._destroy$, 'next');
      const completeSpy = spyOn((service as any)._destroy$, 'complete');

      service.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should clear inactivity timer', () => {
      const clearTimeoutSpy = spyOn(window, 'clearTimeout');

      service.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect((service as any)._inactivityTimer).toBeNull();
    });

    it('should close modal', () => {
      spyOn(service as any, '_closeModal');

      service.ngOnDestroy();

      expect((service as any)._closeModal).toHaveBeenCalled();
    });

    it('should handle case when timer is null', () => {
      (service as any)._inactivityTimer = null;

      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });
});
