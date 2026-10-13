import { Component, signal, computed, HostListener, ElementRef, OnInit } from '@angular/core'; // v21
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, state, style, animate, transition, keyframes } from '@angular/animations';
import emailjs from '@emailjs/browser';

// ─── CONFIG EMAILJS ─────────────────────────────────────────────────────────
// 1. Crée un compte sur https://www.emailjs.com (gratuit, 200 emails/mois)
// 2. Ajoute un Email Service (Gmail, Outlook...)
// 3. Crée 2 templates (voir instructions ci-dessous)
// 4. Remplace les valeurs ici
const EMAILJS_PUBLIC_KEY  = '6oZOy9HrIucymnprP';
const EMAILJS_SERVICE_ID  = 'service_3gue00f';
const TEMPLATE_TO_ME      = 'template_925lxgx';
const TEMPLATE_TO_HER     = 'template_jzisuh6';

const MY_EMAIL = 'eliphazguetin@gmail.com';
// ────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
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
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
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
export class App implements OnInit {

  // Pages : form → invite → sending → oui
  step = signal<'form' | 'invite' | 'sending' | 'oui'>('form');

  // Données du formulaire
  prenom  = '';
  numero  = '';
  email   = '';
  formError = '';

  // Invitation
  heartState   = signal<'normal' | 'beat'>('normal');
  showConfetti = signal(false);

  // Fuite du bouton Non
  noBtnX = signal(0);
  noBtnY = signal(0);

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

  ngOnInit() {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  // ── FORMULAIRE ──────────────────────────────────────────────────────────────

  submitForm() {
    this.formError = '';
    if (!this.prenom.trim()) {
      this.formError = 'Entre ton prénom pour continuer';
      return;
    }
    if (!this.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      this.formError = 'Adresse email invalide';
      return;
    }
    if (!this.numero.trim() || !/^[\d\s\+\-\(\)]{6,15}$/.test(this.numero.trim())) {
      this.formError = 'Numéro de téléphone invalide';
      return;
    }
    this.step.set('invite');
  }

  // ── FUITE DU BOUTON NON ────────────────────────────────────────────────────

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
    const repulseRadius = 120;

    if (distance < repulseRadius) {
      const force = (repulseRadius - distance) / repulseRadius;
      const escapeDistance = 160 * force;
      const angle = Math.atan2(dy, dx);
      const escapeX = -Math.cos(angle) * escapeDistance;
      const escapeY = -Math.sin(angle) * escapeDistance;
      const margin = 20;

      this.noBtnX.set(this.clamp(
        this.noBtnX() + (escapeX - this.noBtnX()) * 0.3,
        -(btnCenterX - rect.width  / 2 - margin),
        window.innerWidth  - btnCenterX - rect.width  / 2 - margin
      ));
      this.noBtnY.set(this.clamp(
        this.noBtnY() + (escapeY - this.noBtnY()) * 0.3,
        -(btnCenterY - rect.height / 2 - margin),
        window.innerHeight - btnCenterY - rect.height / 2 - margin
      ));
    }
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
  }

  // ── ACCEPTER ───────────────────────────────────────────────────────────────

  async accept() {
    this.step.set('sending');

    try {
      // Email à toi : elle a dit oui !
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_ME, {
        to_email:    MY_EMAIL,
        from_name:   this.prenom,
        from_email:  this.email,
        phone:       this.numero,
        message:     `${this.prenom} a dit OUI pour le rendez-vous de vendredi !`,
      });

      // Email à elle : confirmation
      await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_TO_HER, {
        to_email:    this.email,
        from_name:   this.prenom,
        from_email:  this.email,
        phone:       this.numero,
        message:     `C'est officiel ${this.prenom} alias Juliette, rendez-vous vendredi ! Je te recontacte très vite.`,
      });

    } catch (err) {
      console.error('EmailJS error:', err);
      // On affiche quand même la page de confirmation
    }

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
