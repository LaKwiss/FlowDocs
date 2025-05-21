// src/components/shared/status/status.tsx
import { Check, CircleMinus, Clock4, Pause, SquarePen, AlertTriangle, XCircle, Info } from 'lucide-react';
import { ReactNode } from 'react';
import Stripe from 'stripe';

interface Props {
  statusLabel: string; // Ce sera le texte à afficher
  stripeStatus?: Stripe.Subscription.Status | Stripe.Invoice.Status | string; // Pour la logique de couleur/icône
}

interface StatusDisplayInfo {
  color: string;
  icon: ReactNode;
}

// Adaptez les couleurs et icônes pour les statuts Stripe
const statusDisplayConfig: Record<string, StatusDisplayInfo> = {
  // Subscription statuses
  active: { color: '#25F497', icon: <Check size={16} /> },
  trialing: { color: '#E0E0EB', icon: <Clock4 size={16} /> },
  past_due: { color: '#F42566', icon: <AlertTriangle size={16} /> },
  canceled: { color: '#797C7C', icon: <XCircle size={16} /> },
  unpaid: { color: '#F79636', icon: <AlertTriangle size={16} /> },
  incomplete: { color: '#F79636', icon: <Info size={16} /> },
  incomplete_expired: { color: '#F42566', icon: <XCircle size={16} /> },
  paused: { color: '#F79636', icon: <Pause size={16} /> },
  // Invoice statuses
  draft: { color: '#797C7C', icon: <SquarePen size={16} /> },
  open: { color: '#F79636', icon: <Clock4 size={16} /> }, // Due
  paid: { color: '#25F497', icon: <Check size={16} /> },
  uncollectible: { color: '#F42566', icon: <CircleMinus size={16} /> },
  void: { color: '#797C7C', icon: <CircleMinus size={16} /> },
  // Default
  default: { color: '#E0E0EB', icon: <Info size={16} /> },
};

export function Status({ statusLabel, stripeStatus }: Props) {
  const displayInfo = (stripeStatus && statusDisplayConfig[stripeStatus]) || statusDisplayConfig.default;
  const textColorStyle = displayInfo.color.startsWith('#') ? { color: displayInfo.color } : {};

  return (
    <div
      className={`self-end flex items-center gap-2 border rounded-xxs border-border py-1 px-2 w-fit @4xs:text-nowrap text-wrap`}
      style={textColorStyle} // Appliquer la couleur dynamiquement
    >
      {displayInfo.icon}
      {statusLabel}
    </div>
  );
}
