import { Component, signal, computed, HostListener, ElementRef } from '@angular/core'; // v21
import { CommonModule } from '@angular/common';
import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  animations: [
    trigger('heartbeat', [
      state('normal', style({ transform: 'scale(1)' })),
      state('beat',   style({ transform: 'scale(1.3)' })),
      transition('normal <=> beat', animate('200ms ease-in-out'))
    ]),
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('700ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-40px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ]),
    trigger('popIn', [
      transition(':enter', [
        animate('500ms ease-out', keyframes([
          style({ opacity: 0, transform: 'scale(0.3)', offset: 0 }),
          style({ opacity: 1, transform: 'scale(1.1)', offset: 0.7 }),
          style({ opacity: 1, transform: 'scale(1)',   offset: 1 })
        ]))
      ])
    ])
  ]
})
export class App {
  step         = signal<'invite' | 'oui'>('invite');
  heartState   = signal<'normal' | 'beat'>('normal');
  showConfetti = signal(false);

  // Position du bouton "Non" (déplacement par rapport à sa position initiale)
  noBtnX = signal(0);
  noBtnY = signal(0);

  // Icônes Font Awesome pour les confettis
  confettiIcons = [
    'fa-solid fa-heart',
    'fa-solid fa-star',
    'fa-solid fa-sparkles',
    'fa-solid fa-music',
    'fa-solid fa-bolt',
    'fa-solid fa-circle',
    'fa-solid fa-diamond',
    'fa-solid fa-crown'
  ];

  constructor(private el: ElementRef) {}

  /**
   * Détecte la position de la souris sur toute la page.
   * Si la souris s'approche du bouton "Non", on le déplace à l'opposé.
   */
  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.step() !== 'invite') return;

    const btn = this.el.nativeElement.querySelector('.btn-no') as HTMLElement;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width  / 2;
    const btnCenterY = rect.top  + rect.height / 2;

    const dx = event.clientX - btnCenterX;
    const dy = event.clientY - btnCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Zone de répulsion : 120px autour du centre du bouton
    const repulseRadius = 120;

    if (distance < repulseRadius) {
      const force = (repulseRadius - distance) / repulseRadius; // 0→1 quand on se rapproche
      const escapeDistance = 160 * force;

      // Direction opposée à la souris
      const angle = Math.atan2(dy, dx);
      const escapeX = -Math.cos(angle) * escapeDistance;
      const escapeY = -Math.sin(angle) * escapeDistance;

      // Limites de l'écran
      const margin = 20;
      const newX = this.clamp(
        this.noBtnX() + (escapeX - this.noBtnX()) * 0.3,
        -(btnCenterX - rect.width / 2 - margin),
        window.innerWidth - btnCenterX - rect.width / 2 - margin
      );
      const newY = this.clamp(
        this.noBtnY() + (escapeY - this.noBtnY()) * 0.3,
        -(btnCenterY - rect.height / 2 - margin),
        window.innerHeight - btnCenterY - rect.height / 2 - margin
      );

      this.noBtnX.set(newX);
      this.noBtnY.set(newY);
    }
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
  }

  accept() {
    this.showConfetti.set(true);
    this.step.set('oui');
    this.startHeartbeat();
  }

  startHeartbeat() {
    setInterval(() => {
      this.heartState.set('beat');
      setTimeout(() => this.heartState.set('normal'), 200);
    }, 1000);
  }
}
