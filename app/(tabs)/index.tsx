import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Share, Dimensions, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit3, Share2, Sparkles, Maximize2, X } from 'lucide-react-native';
import BusinessCard from '../../src/components/BusinessCard';
import { getMyCard, initializeMyCardIfEmpty } from '../../src/utils/storage';
import { BusinessCardData } from '../../src/types/card';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MyCardScreen() {
  const router = useRouter();
  const [myCard, setMyCard] = useState<BusinessCardData | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 横向き全画面表示時のカード幅の計算
  const landscapeCardHeight = SCREEN_WIDTH - 24; // 回転後の高さ ＝ 画面の横幅から余白を引いたもの
  const landscapeCardWidth = landscapeCardHeight / 0.58;
  const maxLandscapeCardWidth = SCREEN_HEIGHT - 160; // 画面の高さをはみ出さないように制限
  const finalLandscapeWidth = Math.min(landscapeCardWidth, maxLandscapeCardWidth);

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

        <Text style={styles.hintText}>
          {isFlipped ? 'QRコードを相手に見せてスキャンしてもらえます' : 'カードをタップして裏返すか、ドラッグして傾きを楽しめます'}
        </Text>

        <View style={styles.cardWrapper}>
          <BusinessCard
            data={myCard}
            onFlip={(flipped) => setIsFlipped(flipped)}
            enableParallax={true}
          />
          <TouchableOpacity
            style={styles.expandIconBtn}
            onPress={() => setIsExpanded(true)}
            activeOpacity={0.8}
          >
            <Maximize2 size={16} color="#ffffff" />
            <Text style={styles.expandIconBtnText}>拡大表示</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>デジタル名刺の魅力</Text>
          <Text style={styles.infoBody}>
            この名刺の裏面には、あなたの情報を内包したQRコードが自動生成されています。
            他のユーザーがこのアプリの「スキャン」タブからこのQRコードを読み取るだけで、名刺入れに瞬時にあなたが追加されます。
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        visible={isExpanded}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsExpanded(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsExpanded(false)}>
          <View style={styles.expandedModalBg}>
            <SafeAreaView style={styles.expandedModalContent} edges={['top', 'bottom']}>
              
              <TouchableOpacity
                onPress={() => setIsExpanded(false)}
                style={styles.expandedCloseBtn}
              >
                <X size={24} color="#ffffff" />
              </TouchableOpacity>

              <TouchableWithoutFeedback>
                <View style={[styles.expandedCardWrapper, { height: finalLandscapeWidth, justifyContent: 'center' }]}>
                  <BusinessCard
                    data={myCard}
                    enableParallax={true}
                    cardWidth={finalLandscapeWidth}
                    rotateMode="90"
                  />
                  <Text style={[styles.expandedHintText, { marginTop: 24 }]}>タップして裏返せます</Text>
                </View>
              </TouchableWithoutFeedback>

            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  expandIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  expandIconBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  expandedModalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  expandedCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  expandedHintText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
