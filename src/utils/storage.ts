import AsyncStorage from '@react-native-async-storage/async-storage';
import { BusinessCardData, DEFAULT_DESIGN } from '../types/card';

const MY_CARD_KEY = '@my_business_card';
const WALLET_CARDS_KEY = '@wallet_business_cards';

// 初期のダミーデータ（名刺入れが空の場合に表示）
const DUMMY_WALLET_CARDS: BusinessCardData[] = [
  {
    id: 'dummy-1',
    name: '山田 太郎',
    company: 'テックソリューション株式会社',
    role: 'リードエンジニア',
    email: 'taro.yamada@example.com',
    phone: '090-1234-5678',
    website: 'https://example.com',
    address: '東京都渋谷区道玄坂1-2-3',
    memo: 'ExpoとReact Nativeのエキスパート。勉強会で知り合った。',
    design: {
      gradientStart: '#06b6d4',
      gradientEnd: '#3b82f6',
      textColor: '#ffffff',
      cardPattern: 'dots',
    },
    isFavorite: true,
    tags: ['仕事', 'エンジニア', 'イベント'],
    createdAt: Date.now() - 86400000 * 5, // 5日前
  },
  {
    id: 'dummy-2',
    name: '佐藤 美咲',
    company: 'クリエイティブデザイン合同会社',
    role: 'UI/UXデザイナー',
    email: 'misaki.sato@example.com',
    phone: '080-9876-5432',
    website: 'https://design-studio.example.com',
    address: '大阪府大阪市北区梅田2-3-4',
    memo: '新しい名刺デザインの相談に乗ってもらった。センスが良い。',
    design: {
      gradientStart: '#f43f5e',
      gradientEnd: '#fb923c',
      textColor: '#ffffff',
      cardPattern: 'glass',
    },
    isFavorite: false,
    tags: ['デザイナー', '仕事'],
    createdAt: Date.now() - 86400000 * 2, // 2日前
  },
];

// --- マイ名刺の操作 ---

export async function getMyCard(): Promise<BusinessCardData | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(MY_CARD_KEY);
    return jsonValue ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Failed to get my card', e);
    return null;
  }
}

export async function saveMyCard(card: BusinessCardData): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(card);
    await AsyncStorage.setItem(MY_CARD_KEY, jsonValue);
    return true;
  } catch (e) {
    console.error('Failed to save my card', e);
    return false;
  }
}

export async function initializeMyCardIfEmpty(): Promise<BusinessCardData> {
  const existing = await getMyCard();
  if (existing) return existing;

  const defaultCard: BusinessCardData = {
    id: 'my-card-id',
    name: 'あなたの名前',
    company: '会社名 / 所属団体',
    role: '役職 / プロフィール',
    email: 'your.email@example.com',
    phone: '',
    website: '',
    address: '',
    memo: '自分自身のデジタル名刺です。編集ボタンからカスタマイズできます。',
    design: DEFAULT_DESIGN,
    isFavorite: false,
    tags: ['自分'],
    createdAt: Date.now(),
  };

  await saveMyCard(defaultCard);
  return defaultCard;
}

// --- 他人の名刺入れ (Wallet) の操作 ---

export async function getWalletCards(): Promise<BusinessCardData[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(WALLET_CARDS_KEY);
    if (jsonValue) {
      return JSON.parse(jsonValue);
    }
    // 空なら初期ダミーデータを作成して返す
    await AsyncStorage.setItem(WALLET_CARDS_KEY, JSON.stringify(DUMMY_WALLET_CARDS));
    return DUMMY_WALLET_CARDS;
  } catch (e) {
    console.error('Failed to get wallet cards', e);
    return [];
  }
}

export async function saveWalletCards(cards: BusinessCardData[]): Promise<boolean> {
  try {
    const jsonValue = JSON.stringify(cards);
    await AsyncStorage.setItem(WALLET_CARDS_KEY, jsonValue);
    return true;
  } catch (e) {
    console.error('Failed to save wallet cards', e);
    return false;
  }
}

export async function addWalletCard(card: Omit<BusinessCardData, 'createdAt'> & { createdAt?: number }): Promise<boolean> {
  try {
    const cards = await getWalletCards();
    // すでに同じIDが存在する場合は上書き、なければ新規追加
    const existingIndex = cards.findIndex(c => c.id === card.id);
    const newCard: BusinessCardData = {
      ...card,
      createdAt: card.createdAt || Date.now(),
    };

    if (existingIndex >= 0) {
      cards[existingIndex] = newCard;
    } else {
      cards.push(newCard);
    }

    return await saveWalletCards(cards);
  } catch (e) {
    console.error('Failed to add wallet card', e);
    return false;
  }
}

export async function deleteWalletCard(id: string): Promise<boolean> {
  try {
    const cards = await getWalletCards();
    const filtered = cards.filter(c => c.id !== id);
    return await saveWalletCards(filtered);
  } catch (e) {
    console.error('Failed to delete wallet card', e);
    return false;
  }
}

export async function toggleFavorite(id: string): Promise<boolean> {
  try {
    const cards = await getWalletCards();
    const updated = cards.map(c => {
      if (c.id === id) {
        return { ...c, isFavorite: !c.isFavorite };
      }
      return c;
    });
    return await saveWalletCards(updated);
  } catch (e) {
    console.error('Failed to toggle favorite', e);
    return false;
  }
}

// --- インポート / エクスポート ---

export interface ExportImportData {
  myCard: BusinessCardData | null;
  walletCards: BusinessCardData[];
}

export async function exportAllData(): Promise<string | null> {
  try {
    const myCard = await getMyCard();
    const walletCards = await getWalletCards();
    const data: ExportImportData = { myCard, walletCards };
    return JSON.stringify(data);
  } catch (e) {
    console.error('Failed to export data', e);
    return null;
  }
}

export async function importAllData(jsonString: string): Promise<boolean> {
  try {
    const data: ExportImportData = JSON.parse(jsonString);
    if (!data) return false;

    if (data.myCard) {
      await saveMyCard(data.myCard);
    }

    if (Array.isArray(data.walletCards)) {
      const currentCards = await getWalletCards();
      // 重複IDをマージ
      const mergedMap = new Map<string, BusinessCardData>();
      currentCards.forEach(c => mergedMap.set(c.id, c));
      data.walletCards.forEach(c => mergedMap.set(c.id, c));
      await saveWalletCards(Array.from(mergedMap.values()));
    }

    return true;
  } catch (e) {
    console.error('Failed to import data', e);
    return false;
  }
}
