import { Component, OnDestroy, OnInit, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA, Input, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Subject } from 'rxjs';


@Component({
  selector: 'app-inactivity-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inactivity-modal.component.html',
  styleUrl: './inactivity-modal.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class InactivityModalComponent implements OnInit, OnDestroy {
  private readonly _document = inject(DOCUMENT);
  private readonly _window = this._document.defaultView as Window | null;
  
  isVisible = true;
  private _destroy$ = new Subject<void>();
  private _originalBodyOverflow = '';
  private _originalHtmlOverflow = '';
  private _originalBodyPosition = '';
  private _originalBodyTop = '';
  private _originalBodyWidth = '';
  private _originalBodyHeight = '';
  private _originalHtmlPosition = '';
  private _originalHtmlWidth = '';
  private _originalHtmlHeight = '';
  private _scrollY = 0;

  // Evento emitido cuando el modal se cierra
  // eslint-disable-next-line @angular-eslint/no-output-on-prefix
  @Output() onClose$ = new EventEmitter<void>();
  @Input() buttonLabel = 'Volver';
  @Input() imagePath = 'assets/images/error.svg';
  @Input() alt = 'error image';

  ngOnInit(): void {
    if (!this._window) {
      return;
    }

    // Guardar la posición actual del scroll
    this._scrollY = this._window.scrollY || this._window.pageYOffset || this._document.documentElement.scrollTop;
    
    const body = this._document.body;
    const html = this._document.documentElement;
    
    // Prevenir scroll en el body y html cuando el modal está abierto
    // Usar clases CSS para mayor robustez
    body.classList.add('modal-open');
    html.classList.add('modal-open');
    
    // Guardar valores originales
    this._originalBodyOverflow = body.style.overflow;
    this._originalHtmlOverflow = html.style.overflow;
    this._originalBodyPosition = body.style.position;
    this._originalBodyTop = body.style.top;
    this._originalBodyWidth = body.style.width;
    this._originalBodyHeight = body.style.height;
    this._originalHtmlPosition = html.style.position;
    this._originalHtmlWidth = html.style.width;
    this._originalHtmlHeight = html.style.height;
    
    // Aplicar estilos para prevenir scroll
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${this._scrollY}px`;
    body.style.width = '100%';
    body.style.left = '0';
    html.style.position = 'fixed';
    html.style.width = '100%';
    html.style.height = '100%';
    html.style.top = `-${this._scrollY}px`;
    html.style.left = '0';
  }

  ngOnDestroy(): void {
    if (!this._window) {
      return;
    }

    const body = this._document.body;
    const html = this._document.documentElement;
    
    // Restaurar scroll en el body y html cuando el modal se cierra
    body.classList.remove('modal-open');
    html.classList.remove('modal-open');
    
    // Restaurar valores originales
    body.style.overflow = this._originalBodyOverflow;
    html.style.overflow = this._originalHtmlOverflow;
    body.style.position = this._originalBodyPosition;
    body.style.top = this._originalBodyTop;
    body.style.width = this._originalBodyWidth;
    body.style.height = this._originalBodyHeight;
    body.style.left = '';
    html.style.position = this._originalHtmlPosition;
    html.style.width = this._originalHtmlWidth;
    html.style.height = this._originalHtmlHeight;
    html.style.top = '';
    html.style.left = '';
    
    // Restaurar la posición del scroll
    this._window.scrollTo(0, this._scrollY);
    
    this._destroy$.next();
    this._destroy$.complete();
  }

  onVolver(): void {
    this.onClose$.emit();
  }
}
