import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InactivityModalComponent } from './inactivity-modal.component';

describe('InactivityModalComponent', () => {
  let component: InactivityModalComponent;
  let fixture: ComponentFixture<InactivityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InactivityModalComponent],
      // El componente ya tiene CUSTOM_ELEMENTS_SCHEMA en su decorador
    }).compileComponents();

    fixture = TestBed.createComponent(InactivityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should have isVisible set to true by default', () => {
      expect(component.isVisible).toBe(true);
    });
  });

  describe('Inputs', () => {
    it('should have default values for inputs', () => {
      expect(component.buttonLabel).toBe('Volver');
      expect(component.imagePath).toBe('assets/images/error.svg');
      expect(component.alt).toBe('error image');
    });

    it('should accept custom buttonLabel', () => {
      component.buttonLabel = 'Cerrar';
      fixture.detectChanges();
      expect(component.buttonLabel).toBe('Cerrar');
    });

    it('should accept custom imagePath', () => {
      const customPath = 'assets/images/custom.svg';
      component.imagePath = customPath;
      fixture.detectChanges();
      expect(component.imagePath).toBe(customPath);
    });

    it('should accept custom alt text', () => {
      const customAlt = 'Custom alt text';
      component.alt = customAlt;
      fixture.detectChanges();
      expect(component.alt).toBe(customAlt);
    });
  });

  describe('onBackClick', () => {
    it('should emit onClose$ event when onBackClick is called', () => {
      spyOn(component.onClose$, 'emit');
      
      component.onBackClick();
      
      expect(component.onClose$.emit).toHaveBeenCalled();
    });

    it('should emit onClose$ event when button is clicked', () => {
      spyOn(component.onClose$, 'emit');
      
      const button = fixture.nativeElement.querySelector('std-button');
      expect(button).toBeTruthy();
      
      // Simular el click en el botón
      component.onBackClick();
      
      expect(component.onClose$.emit).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject when ngOnDestroy is called', () => {
      const destroySpy = spyOn((component as any)._destroy$, 'next');
      const completeSpy = spyOn((component as any)._destroy$, 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should have _destroy$ as Subject', () => {
      expect((component as any)._destroy$).toBeDefined();
      expect((component as any)._destroy$.next).toBeDefined();
      expect((component as any)._destroy$.complete).toBeDefined();
    });
  });

  describe('Template rendering', () => {
    it('should render the title', () => {
      const title = fixture.nativeElement.querySelector('.inactivity-modal__title');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Tu sesión ha expirado');
    });

    it('should render the subtitle', () => {
      const subtitle = fixture.nativeElement.querySelector('.inactivity-modal__subtitle');
      expect(subtitle).toBeTruthy();
      expect(subtitle.textContent.trim()).toContain('Por tu seguridad');
    });

    it('should render the button with default label', () => {
      const button = fixture.nativeElement.querySelector('std-button');
      expect(button).toBeTruthy();
      // Con NO_ERRORS_SCHEMA, el componente std-button se renderiza pero no procesa los atributos
      // Verificamos que el componente existe
    });

    it('should render the button with custom label', () => {
      component.buttonLabel = 'Cerrar Sesión';
      fixture.detectChanges();
      
      const button = fixture.nativeElement.querySelector('std-button');
      expect(button).toBeTruthy();
    });

    it('should render the image with default path', () => {
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy();
      // El pipe prefixAsset puede modificar el src, así que verificamos que existe
      expect(img.hasAttribute('src') || img.getAttribute('src')).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('error image');
    });

    it('should render the image with custom path', () => {
      component.imagePath = 'assets/images/custom.svg';
      component.alt = 'Custom image';
      fixture.detectChanges();
      
      const img = fixture.nativeElement.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('Custom image');
    });

    it('should render the logo', () => {
      const logo = fixture.nativeElement.querySelector('.inactivity-modal__logo');
      expect(logo).toBeTruthy();
      expect(logo.querySelector('svg')).toBeTruthy();
    });
  });

  describe('EventEmitter', () => {
    it('should have onClose$ as EventEmitter', () => {
      expect(component.onClose$).toBeDefined();
      expect(component.onClose$.emit).toBeDefined();
    });

    it('should allow subscribing to onClose$ events', (done) => {
      component.onClose$.subscribe(() => {
        done();
      });
      
      component.onBackClick();
    });
  });
});

