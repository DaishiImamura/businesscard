import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit3, Share2, Sparkles } from 'lucide-react-native';
import BusinessCard from '../../src/components/BusinessCard';
import { getMyCard, initializeMyCardIfEmpty } from '../../src/utils/storage';
import { BusinessCardData } from '../../src/types/card';

export default function MyCardScreen() {
  const router = useRouter();
  const [myCard, setMyCard] = useState<BusinessCardData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // 画面フォーカス時にデータを再読み込み
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadCard = async () => {
        const card = await initializeMyCardIfEmpty();
        if (isActive) {
          setMyCard(card);
        }
      };
      loadCard();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleShare = async () => {
    if (!myCard) return;
    try {
      const serialized = JSON.stringify({
        id: myCard.id,
        name: myCard.name,
        company: myCard.company,
        role: myCard.role,
        email: myCard.email,
        phone: myCard.phone || '',
        website: myCard.website || '',
        address: myCard.address || '',
        memo: myCard.memo || '',
        design: myCard.design,
      });
      const url = `businesscard://scan?data=${encodeURIComponent(serialized)}`;
      
      await Share.share({
        title: `${myCard.name}の名刺`,
        message: `デジタル名刺を共有します。\n名前: ${myCard.name}\n会社名: ${myCard.company}\n\nアプリで読み取るリンク:\n${url}`,
      });
    } catch (error) {
      console.error('Sharing failed', error);
    }
  };

  if (!myCard) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>名刺を読み込み中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ヘッダー */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Digital Card</Text>
            <Text style={styles.titleText}>マイ名刺</Text>
          </View>
          <View style={styles.badge}>
            <Sparkles size={14} color="#818cf8" />
            <Text style={styles.badgeText}>Active</Text>
          </View>
        </View>

        {/* インタラクティブ説明 */}
        <Text style={styles.hintText}>
          {isFlipped ? 'QRコードを相手に見せてスキャンしてもらえます' : 'カードをタップして裏返すか、ドラッグして傾きを楽しめます'}
        </Text>

        {/* 3D名刺表示 */}
        <View style={styles.cardWrapper}>
          <BusinessCard
            data={myCard}
            onFlip={(flipped) => setIsFlipped(flipped)}
            enableParallax={true}
          />
        </View>

        {/* アクションボタン */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.btn, styles.primaryBtn]}
            onPress={() => router.push('/edit-card')}
          >
            <Edit3 size={18} color="#ffffff" style={styles.btnIcon} />
            <Text style={styles.btnText}>名刺を編集する</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={handleShare}
          >
            <Share2 size={18} color="#818cf8" style={styles.btnIcon} />
            <Text style={[styles.btnText, styles.secondaryBtnText]}>リンクで共有する</Text>
          </TouchableOpacity>
        </View>

        {/* 機能アピール領域 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>デジタル名刺の魅力</Text>
          <Text style={styles.infoBody}>
            この名刺の裏面には、あなたの情報を内包したQRコードが自動生成されています。
            他のユーザーがこのアプリの「スキャン」タブからこのQRコードを読み取るだけで、名刺入れに瞬時にあなたが追加されます。
          </Text>
        </View>

        <View style={{ height: 100 }} /> {/* タブバーにかぶらないように余白 */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // スレートダーク背景
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  welcomeText: {
    fontSize: 12,
    color: '#818cf8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  badgeText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  hintText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  cardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  actionSection: {
    gap: 12,
    marginTop: 24,
  },
  btn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtn: {
    backgroundColor: '#6366f1', // インディゴ
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  btnIcon: {
    marginRight: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtnText: {
    color: '#818cf8',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    marginTop: 28,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoBody: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
  },
});
