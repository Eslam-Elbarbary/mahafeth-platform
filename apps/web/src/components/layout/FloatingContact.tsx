import type { SiteContent } from '@/content/types';

/** WhatsApp + call quick-contact buttons (hidden while a menu/modal locks scrolling). */
export function FloatingContact({ site }: { site: SiteContent }) {
  const { floatingContact: fc, contact } = site;
  return (
    <nav className="floating-contact" aria-label={fc.label}>
      <a
        className="floating-contact__button floating-contact__button--wa"
        href={`https://wa.me/${contact.whatsapp}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={fc.whatsapp.aria}
        title={fc.whatsapp.label}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          <path d="M20.52 3.48A11.9 11.9 0 0 0 12.05 0C5.47 0 .11 5.35.1 11.93c0 2.1.55 4.16 1.6 5.97L0 24l6.25-1.64a11.94 11.94 0 0 0 5.79 1.48h.01C18.63 23.84 24 18.49 24 11.91c0-3.19-1.24-6.19-3.48-8.43Zm-8.47 18.34a9.89 9.89 0 0 1-5.04-1.38l-.36-.21-3.71.97.99-3.62-.24-.37a9.86 9.86 0 0 1-1.51-5.28c0-5.47 4.46-9.92 9.94-9.92a9.88 9.88 0 0 1 7.04 2.91 9.87 9.87 0 0 1 2.91 7.04c0 5.47-4.47 9.92-9.95 9.92Zm5.44-7.43c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15s-.77.97-.94 1.17c-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.47-1.76-1.64-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37s-1.04 1.02-1.04 2.49 1.06 2.89 1.21 3.09c.15.2 2.09 3.19 5.06 4.47.7.3 1.25.48 1.67.62.7.22 1.34.19 1.85.11.56-.08 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.42-.07-.12-.27-.19-.57-.34Z" />
        </svg>
        <span className="floating-contact__label">{fc.whatsapp.label}</span>
      </a>
      <a
        className="floating-contact__button floating-contact__button--call"
        href={`tel:${contact.phone}`}
        aria-label={fc.call.aria}
        title={fc.call.label}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.79a2 2 0 0 1-.45 2.11L8.09 9.89a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.89.33 1.83.56 2.79.69A2 2 0 0 1 22 16.92Z" />
        </svg>
        <span className="floating-contact__label">{fc.call.label}</span>
      </a>
    </nav>
  );
}
