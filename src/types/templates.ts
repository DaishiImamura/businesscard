export interface TextLayout {
  fontSize: number;
  color: string;
  fontFamily?: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  textAlign?: 'left' | 'right' | 'center';
}

export interface BusinessCardTemplate {
  id: string;
  name: string;
  orientation: 'landscape' | 'portrait';
  backgroundImage: any; // require()による画像またはURL文字列
  isPremium: boolean;
  price: number;
  layouts: {
    name: TextLayout;
    role: TextLayout;
    company: TextLayout;
    phone?: TextLayout;
    email?: TextLayout;
    website?: TextLayout;
    address?: TextLayout;
  };
}

// デザイン座標定義の基準サイズ：
// 横型 (landscape): 幅 350, 高さ 203
// 縦型 (portrait): 幅 203, 高さ 350
export const TEMPLATES: BusinessCardTemplate[] = [
  {
    id: 'gold_luxury',
    name: 'ゴールド・ラグジュアリー',
    orientation: 'landscape',
    backgroundImage: require('../../assets/templates/gold_luxury.png'),
    isPremium: true,
    price: 120,
    layouts: {
      name: { top: 95, left: 30, fontSize: 22, color: '#ffffff' },
      role: { top: 128, left: 32, fontSize: 12, color: '#94a3b8' },
      company: { top: 35, left: 30, fontSize: 13, color: '#fbbf24' },
      phone: { top: 165, left: 30, fontSize: 10, color: '#e2e8f0' },
      email: { top: 165, left: 160, fontSize: 10, color: '#e2e8f0' }
    }
  },
  {
    id: 'neon_curves',
    name: 'フューチャー・ネオン',
    orientation: 'landscape',
    backgroundImage: require('../../assets/templates/neon_curves.png'),
    isPremium: true,
    price: 200,
    layouts: {
      name: { top: 60, left: 40, fontSize: 24, color: '#ffffff' },
      role: { top: 92, left: 40, fontSize: 12, color: '#a78bfa' },
      company: { top: 35, right: 40, fontSize: 14, color: '#ec4899', textAlign: 'right' },
      email: { bottom: 30, left: 40, fontSize: 10, color: '#cbd5e1' },
      phone: { bottom: 30, right: 40, fontSize: 10, color: '#cbd5e1', textAlign: 'right' }
    }
  },
  {
    id: 'white_marble',
    name: 'ホワイト・マーブル',
    orientation: 'portrait',
    backgroundImage: require('../../assets/templates/white_marble.png'),
    isPremium: true,
    price: 150,
    layouts: {
      name: { top: 180, left: 0, right: 0, fontSize: 20, color: '#1e293b', textAlign: 'center' },
      role: { top: 212, left: 0, right: 0, fontSize: 11, color: '#64748b', textAlign: 'center' },
      company: { top: 50, left: 0, right: 0, fontSize: 12, color: '#1e293b', textAlign: 'center' },
      phone: { bottom: 60, left: 24, fontSize: 10, color: '#475569' },
      email: { bottom: 40, left: 24, fontSize: 10, color: '#475569' }
    }
  }
];
