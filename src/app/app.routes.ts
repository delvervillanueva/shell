import { loadRemoteModule } from '@angular-architects/module-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'otp',
    loadChildren: () =>
      loadRemoteModule({
        type: 'module',
        remoteEntry: 'http://localhost:4201/remoteEntry.js',
        exposedModule: './Module',
      }).then((m) => m.OtpEntryModule),
  },
  {
    path: 'onboarding',
    loadChildren: () =>
      loadRemoteModule({
        // type: 'module',
        // remoteEntry: 'http://localhost:4202/remoteEntry.js',
        remoteName: 'onboarding',
        exposedModule: './Module',
      }).then((m) => m.OnboardingEntryModule),
  },
];
