// src/constants/pricing-tier.ts
export interface Tier {
  name: string;
  id: 'starter' | 'pro' | 'advanced';
  icon: string;
  description: string;
  features: string[];
  featured: boolean;
  // Conservez une structure similaire si vous avez des tarifs mensuels/annuels
  stripePriceIds: { month: string; year: string }; // Stripe Price IDs
  // Ou si chaque 'Tier' a un seul Price ID principal pour le checkout
  // stripePriceId: string;
}

export const PricingTier: Tier[] = [
  {
    name: 'Starter',
    id: 'starter',
    icon: '/assets/icons/price-tiers/free-icon.svg',
    description: 'Ideal for individuals who want to get started with simple design tasks.',
    features: ['1 workspace', 'Limited collaboration', 'Export to PNG and SVG'],
    featured: false,
    stripePriceIds: { month: 'price_1RR9JFQozR9XtQ8yAFIUibpV', year: 'price_1RR9MyQozR9XtQ8y3hPQjZBu' },
  },
  {
    name: 'Pro',
    id: 'pro',
    icon: '/assets/icons/price-tiers/basic-icon.svg',
    description: 'Enhanced design tools for scaling teams who need more flexibility.',
    features: ['Integrations', 'Unlimited workspaces', 'Advanced editing tools', 'Everything in Starter'],
    featured: true,
    stripePriceIds: { month: 'price_1RR9JqQozR9XtQ8y5MLMlGEg', year: 'price_1RR9NUQozR9XtQ8yftA2Yzpo' },
  },
  {
    name: 'Advanced',
    id: 'advanced',
    icon: '/assets/icons/price-tiers/pro-icon.svg',
    description: 'Powerful tools designed for extensive collaboration and customization.',
    features: [
      'Single sign on (SSO)',
      'Advanced version control',
      'Assets library',
      'Guest accounts',
      'Everything in Pro',
    ],
    featured: false,
    stripePriceIds: { month: 'price_1RR9K4QozR9XtQ8yr3zEp5jQ', year: 'price_1RR9NwQozR9XtQ8yIul7ubzq' },
  },
];
