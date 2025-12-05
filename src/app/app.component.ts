import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InactivityService } from './inactivity.service';
import { InactivityModalComponent } from './inactivity-modal/inactivity-modal.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, InactivityModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'shell';
  showInactivityModal = false;
  
  private readonly _inactivityService = inject(InactivityService);
  private readonly _router = inject(Router);
  private readonly _destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit(): void {
    // Suscribirse al servicio de inactividad para mostrar/ocultar el modal
    this._inactivityService.showModal$
      .pipe(takeUntil(this._destroy$))
      .subscribe((show: boolean) => {
        this.showInactivityModal = show;
      });
  }

  navigateTo(route: string) {
    this._router.navigate([route]);
  }

  onCloseInactivityModal(): void {
    this._inactivityService.closeModalAndRedirect();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
