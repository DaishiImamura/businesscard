export interface CardDesign {
  gradientStart: string;
  gradientEnd: string;
  textColor: string;
  cardPattern: 'none' | 'mesh' | 'dots' | 'glass';
}

export interface BusinessCardData {
  id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  memo?: string;
  design: CardDesign;
  avatar?: string; // Base64 or local file URI
  logo?: string; // Base64 or local file URI
  isFavorite: boolean;
  tags: string[];
  createdAt: number;
}

export const DEFAULT_DESIGN: CardDesign = {
  gradientStart: '#4f46e5', // Indigo 600
  gradientEnd: '#7c3aed', // Violet 600
  textColor: '#ffffff',
  cardPattern: 'glass',
};

export const GRADIENT_PRESETS: { name: string; start: string; end: string }[] = [
  { name: 'Sunset Glow', start: '#f43f5e', end: '#fb923c' }, // Rose to Orange
  { name: 'Ocean Breeze', start: '#06b6d4', end: '#3b82f6' }, // Cyan to Blue
  { name: 'Mystic Purple', start: '#4f46e5', end: '#7c3aed' }, // Indigo to Violet
  { name: 'Aurora', start: '#10b981', end: '#06b6d4' }, // Emerald to Cyan
  { name: 'Deep Space', start: '#1e293b', end: '#0f172a' }, // Slate dark
  { name: 'Cyberpunk', start: '#ff007f', end: '#7f00ff' }, // Neon Pink to Violet
];
