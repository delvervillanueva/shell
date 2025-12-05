import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { InactivityService } from '../inactivity.service';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;
  let inactivityService: jasmine.SpyObj<InactivityService>;

  beforeEach(async () => {
    const inactivityServiceSpy = jasmine.createSpyObj('InactivityService', ['initialize']);

    await TestBed.configureTestingModule({
      imports: [LayoutComponent],
      providers: [
        { provide: InactivityService, useValue: inactivityServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    inactivityService = TestBed.inject(InactivityService) as jasmine.SpyObj<InactivityService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize the inactivity service', async () => {
      await component.ngOnInit();
      
      expect(inactivityService.initialize).toHaveBeenCalled();
    });

    it('should call initialize only once', async () => {
      await component.ngOnInit();
      
      expect(inactivityService.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service injection', () => {
    it('should inject InactivityService', () => {
      expect((component as any)._inactivityService).toBeDefined();
      expect((component as any)._inactivityService).toBe(inactivityService);
    });
  });
});


