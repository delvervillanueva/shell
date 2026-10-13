import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookieConsentService } from './cookie-consent.service';

type CookieCategoryKey = 'statistics' | 'marketing';

interface CookieCategory {
  key: CookieCategoryKey;
  title: string;
  description: string;
  enabled: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-cookie-consent-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent-banner.component.html',
  styleUrl: './cookie-consent-banner.component.scss',
})
export class CookieConsentBannerComponent {
  private readonly _consentService = inject(CookieConsentService);

  @Input() policyUrl = '/politica-de-cookies';

  isVisible = !this._consentService.hasConsent();
  isConfiguring = false;

  categories: CookieCategory[] = [
    {
      key: 'statistics',
      title: 'Statistics',
      description:
        'Permiten recopilar información anónima sobre el uso del sitio web para analizar su rendimiento y mejorar la experiencia de los usuarios.',
      enabled: false,
      expanded: false,
    },
    {
      key: 'marketing',
      title: 'Marketing',
      description:
        'Se utilizan para mostrar contenido y publicidad relevantes, así como para medir la efectividad de las campañas de marketing.',
      enabled: false,
      expanded: false,
    },
  ];

  onConfigure(): void {
    this.isConfiguring = true;
  }

  onToggleCategory(category: CookieCategory): void {
    category.enabled = !category.enabled;
  }

  onToggleExpanded(category: CookieCategory): void {
    category.expanded = !category.expanded;
  }

  onAccept(): void {
    this._consentService.acceptAll();
    this.isVisible = false;
  }

  onSave(): void {
    this._consentService.save({
      statistics: this._isEnabled('statistics'),
      marketing: this._isEnabled('marketing'),
    });
    this.isVisible = false;
  }

  private _isEnabled(key: CookieCategoryKey): boolean {
    return this.categories.find((category) => category.key === key)?.enabled ?? false;
  }
}
