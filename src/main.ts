import { initFederation } from '@angular-architects/module-federation';

initFederation({
  onboarding: 'http://localhost:4202/remoteEntry.js',
  otp: 'http://localhost:4201/remoteEntry.js',
})
  .catch((err) => console.error(err))
  .then(() => import('./bootstrap'))
  .catch((err) => console.error(err));

// import('./bootstrap')
// 	.catch(err => console.error(err));
