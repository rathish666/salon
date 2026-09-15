import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber: string; // digits only, with country code, e.g. "919876543210"
  message?: string;
  floating?: boolean;
}

export function WhatsAppButton({ phoneNumber, message, floating = false }: WhatsAppButtonProps) {
  const text = message ?? "Hi! I'd like to know more about your services.";
  const href = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;

  if (floating) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-250 hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition-opacity duration-250 hover:opacity-90"
    >
      <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
    </a>
  );
}
