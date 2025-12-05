import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { InactivityService } from '../inactivity.service';

/**
 * LayoutComponent
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  private readonly _inactivityService = inject(InactivityService);

  async ngOnInit(): Promise<void> {
    this._inactivityService.initialize();
  }
}


