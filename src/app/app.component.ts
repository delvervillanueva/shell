import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, RouterLink } from '@angular/router';
import { CookieConsentBannerComponent } from './cookie-consent/cookie-consent-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CookieConsentBannerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'shell';
  private readonly _router = inject(Router);

  navigateTo(route: string) {
    this._router.navigate([route]);
  }

}
