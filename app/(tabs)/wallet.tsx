import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Star, Trash2, Plus, X, Tag, Maximize2 } from 'lucide-react-native';
import { getWalletCards, toggleFavorite, deleteWalletCard } from '../../src/utils/storage';
import { BusinessCardData } from '../../src/types/card';
import BusinessCard from '../../src/components/BusinessCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<BusinessCardData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 横向き全画面表示時のカード幅の計算
  const landscapeCardHeight = SCREEN_WIDTH - 24; // 回転後の高さ ＝ 画面の横幅から余白を引いたもの
  const landscapeCardWidth = landscapeCardHeight / 0.58;
  const maxLandscapeCardWidth = SCREEN_HEIGHT - 160; // 画面の高さをはみ出さないように制限
  const finalLandscapeWidth = Math.min(landscapeCardWidth, maxLandscapeCardWidth);

  // 詳細表示用のモーダル管理
  const [detailCard, setDetailCard] = useState<BusinessCardData | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 画面フォーカス時に再ロード
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      const loadCards = async () => {
        const loaded = await getWalletCards();
        if (isActive) {
          setCards(loaded);
        }
      };
      loadCards();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const refreshData = async () => {
    const loaded = await getWalletCards();
    setCards(loaded);
    // 詳細表示中のカードも最新状態に更新
    if (detailCard) {
      const updated = loaded.find(c => c.id === detailCard.id);
      setDetailCard(updated || null);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const success = await toggleFavorite(id);
    if (success) {
      await refreshData();
    }
  };

  const handleDelete = async (cardToDelete: BusinessCardData) => {
    Alert.alert(
      '名刺の削除',
      `${cardToDelete.name} さんの名刺を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteWalletCard(cardToDelete.id);
            if (success) {
              setIsDetailVisible(false);
              setDetailCard(null);
              await refreshData();
            }
          },
        },
      ]
    );
  };

  const openDetails = (card: BusinessCardData) => {
    setDetailCard(card);
    setIsDetailVisible(true);
  };

  // タグ一覧の抽出
  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || []))).filter(Boolean);

  // フィルタリング処理
  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.memo && card.memo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag ? card.tags.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <Text style={styles.subtitleText}>Wallet</Text>
          <Text style={styles.titleText}>名刺入れ</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/add-card')}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* 検索バー */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="名前、会社、役職、メモから検索"
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
            keyboardAppearance="dark"
          />
        </View>
      </View>

      {/* タグフィルター (水平スクロール) */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTag, !selectedTag && styles.selectedFilterTag]}
            onPress={() => setSelectedTag(null)}
          >
            <Text style={[styles.filterTagText, !selectedTag && styles.selectedFilterTagText]}>
              すべて ({cards.length})
            </Text>
          </TouchableOpacity>
          {allTags.map((tag) => {
            const count = cards.filter((c) => c.tags.includes(tag)).length;
            const isSelected = selectedTag === tag;
            return (
              <TouchableOpacity
                key={tag}
                style={[styles.filterTag, isSelected && styles.selectedFilterTag]}
                onPress={() => setSelectedTag(tag)}
              >
                <Tag size={10} color={isSelected ? '#ffffff' : '#64748b'} style={styles.tagIcon} />
                <Text style={[styles.filterTagText, isSelected && styles.selectedFilterTagText]}>
                  {tag} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 名刺リスト */}
      {filteredCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>該当する名刺が見つかりません</Text>
          <Text style={styles.emptySubText}>手動追加するか、QRコードをスキャンして登録してください。</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openDetails(item)}
              style={styles.cardItem}
            >
              {/* 名刺風ミニプレビュー */}
              <View
                style={[
                  styles.miniCard,
                  { backgroundColor: item.design.gradientStart }
                ]}
              >
                <View
                  style={[
                    styles.miniCardOverlay,
                    { backgroundColor: item.design.gradientEnd }
                  ]}
                />
                <Text style={styles.miniCardCompany} numberOfLines={1}>
                  {item.company}
                </Text>
                <Text style={styles.miniCardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.miniCardRole} numberOfLines={1}>
                  {item.role}
                </Text>
              </View>

              {/* 右側テキストとスター */}
              <View style={styles.cardInfo}>
                <View style={styles.cardMeta}>
                  <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
                  {item.tags.length > 0 && (
                    <View style={styles.tagBadgeContainer}>
                      {item.tags.slice(0, 2).map((t, idx) => (
                        <View key={idx} style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleToggleFavorite(item.id)}
                  style={styles.favoriteBtn}
                >
                  <Star
                    size={20}
                    color={item.isFavorite ? '#fbbf24' : '#475569'}
                    fill={item.isFavorite ? '#fbbf24' : 'transparent'}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={isDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailVisible(false)}
      >
        <View style={styles.modalBg}>
          <SafeAreaView style={styles.modalContent} edges={['top', 'bottom']}>
            
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => handleToggleFavorite(detailCard?.id || '')}
                style={styles.modalHeaderBtn}
              >
                <Star
                  size={20}
                  color={detailCard?.isFavorite ? '#fbbf24' : '#ffffff'}
                  fill={detailCard?.isFavorite ? '#fbbf24' : 'transparent'}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>名刺詳細</Text>
              <TouchableOpacity
                onPress={() => setIsDetailVisible(false)}
                style={[styles.modalHeaderBtn, styles.closeBtn]}
              >
                <X size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {detailCard && (
                <>
                  <Text style={styles.modalHint}>タップして裏返す / ドラッグして傾ける</Text>
                  
                  <View style={styles.modalCardWrapper}>
                    <BusinessCard data={detailCard} enableParallax={true} />
                    <TouchableOpacity
                      style={styles.expandIconBtn}
                      onPress={() => setIsExpanded(true)}
                      activeOpacity={0.8}
                    >
                      <Maximize2 size={16} color="#ffffff" />
                      <Text style={styles.expandIconBtnText}>拡大表示</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailCardInfoContainer}>
                    <Text style={styles.detailLabel}>メモ・登録情報</Text>
                    <View style={styles.detailCardInfo}>
                      <Text style={styles.detailInfoText}>
                        {detailCard.memo ? detailCard.memo : 'メモはありません。'}
                      </Text>
                      <Text style={styles.detailDateText}>
                        登録日: {new Date(detailCard.createdAt).toLocaleDateString('ja-JP')}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDelete(detailCard)}
                    >
                      <Trash2 size={16} color="#ef4444" style={styles.deleteIcon} />
                      <Text style={styles.deleteBtnText}>この名刺を削除する</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>

          </SafeAreaView>
        </View>
      </Modal>

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
                  {detailCard && (
                    <BusinessCard
                      data={detailCard}
                      enableParallax={true}
                      cardWidth={finalLandscapeWidth}
                      rotateMode="90"
                    />
                  )}
                  <Text style={[styles.expandedHintText, { marginTop: 24 }]}>タップして裏返せます</Text>
                </View>
              </TouchableWithoutFeedback>

            </SafeAreaView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={{ height: 80 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  subtitleText: {
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  searchBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.02)',
  },
  selectedFilterTag: {
    backgroundColor: '#6366f1',
  },
  tagIcon: {
    marginRight: 4,
  },
  filterTagText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  selectedFilterTagText: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  cardItem: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    alignItems: 'center',
  },
  miniCard: {
    width: 100,
    height: 60,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  miniCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  miniCardCompany: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
    opacity: 0.8,
  },
  miniCardName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  miniCardRole: {
    fontSize: 6,
    color: '#ffffff',
    opacity: 0.8,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 14,
  },
  cardMeta: {
    flex: 1,
    marginRight: 10,
  },
  cardEmail: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  tagBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagBadge: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  tagBadgeText: {
    color: '#818cf8',
    fontSize: 8,
    fontWeight: '700',
  },
  favoriteBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  // モーダルのスタイル
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalHeaderBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    backgroundColor: '#ef4444',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 16,
    alignItems: 'center',
  },
  modalHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  modalCardWrapper: {
    marginVertical: 10,
  },
  detailCardInfoContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  detailCardInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
  },
  detailInfoText: {
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 20,
  },
  detailDateText: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 12,
    textAlign: 'right',
  },
  deleteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteIcon: {
    marginRight: 6,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
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
    alignSelf: 'center',
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
