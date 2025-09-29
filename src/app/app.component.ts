import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
// import { RouterLink } from "../../node_modules/@angular/router/index";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'shell';

  constructor(private router: Router) {}

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
