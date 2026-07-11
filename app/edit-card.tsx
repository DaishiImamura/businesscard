import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  AlignLeft, 
  Image as ImageIcon,
  Palette,
  Layers,
  Crown,
  Lock
} from 'lucide-react-native';
import { getMyCard, saveMyCard, getPurchasedTemplates, purchaseTemplate } from '../src/utils/storage';
import { BusinessCardData, CardDesign } from '../src/types/card';
import { TEMPLATES } from '../src/types/templates';
import GradientPicker from '../src/components/GradientPicker';

export default function EditCardScreen() {
  const router = useRouter();
  const [card, setCard] = useState<BusinessCardData | null>(null);

  // フォームのステート
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  
  // デザインステート
  const [design, setDesign] = useState<CardDesign>({
    gradientStart: '#4f46e5',
    gradientEnd: '#7c3aed',
    textColor: '#ffffff',
    cardPattern: 'glass',
  });

  // デザインのタブ切り替え ('color': グラデーション, 'template': Canvaテンプレート)
  const [editTab, setEditTab] = useState<'color' | 'template'>('color');
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [purchasedTemplates, setPurchasedTemplates] = useState<string[]>([]);

  // 画像ステート
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [logo, setLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadCardData = async () => {
      const data = await getMyCard();
      if (data) {
        setCard(data);
        setName(data.name);
        setCompany(data.company);
        setRole(data.role);
        setEmail(data.email);
        setPhone(data.phone || '');
        setWebsite(data.website || '');
        setAddress(data.address || '');
        setMemo(data.memo || '');
        setDesign(data.design);
        setAvatar(data.avatar);
        setLogo(data.logo);
        
        setTemplateId(data.templateId);
        if (data.templateId) {
          setEditTab('template');
        }
      }

      // 購入済みテンプレートのロード
      const purchased = await getPurchasedTemplates();
      setPurchasedTemplates(purchased);
    };
    loadCardData();
  }, []);

  const selectImage = async (type: 'avatar' | 'logo') => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('権限エラー', '写真へのアクセス権限が必要です。設定から許可してください。');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : undefined,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedUri = result.assets[0].uri;
      if (type === 'avatar') {
        setAvatar(selectedUri);
      } else {
        setLogo(selectedUri);
      }
    }
  };

  const handleSelectTemplate = async (id: string, isPremium: boolean) => {
    if (!isPremium || purchasedTemplates.includes(id)) {
      setTemplateId(id);
      return;
    }

    const targetTpl = TEMPLATES.find(t => t.id === id);
    if (!targetTpl) return;

    Alert.alert(
      'プレミアムテンプレートのアンロック',
      `「${targetTpl.name}」をアンロックしますか？\n\n価格: ￥${targetTpl.price} (モック決済)`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入してアンロック',
          onPress: async () => {
            const success = await purchaseTemplate(id);
            if (success) {
              const updated = await getPurchasedTemplates();
              setPurchasedTemplates(updated);
              setTemplateId(id);
              Alert.alert('アンロック完了', `「${targetTpl.name}」を使用できます。`);
            } else {
              Alert.alert('エラー', '購入処理に失敗しました。');
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('入力エラー', 'お名前は必須項目です。');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください。');
      return;
    }

    if (!card) return;

    const updatedCard: BusinessCardData = {
      ...card,
      name,
      company,
      role,
      email,
      phone,
      website,
      address,
      memo,
      design,
      avatar,
      logo,
      templateId: editTab === 'template' ? templateId : undefined,
    };

    const success = await saveMyCard(updatedCard);
    if (success) {
      Alert.alert('完了', '名刺を保存しました。', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('エラー', '保存に失敗しました。');
    }
  };

  if (!card) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* カスタムヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>名刺の編集</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Save size={20} color="#818cf8" />
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* 画像選択エリア */}
          <Text style={styles.sectionLabel}>プロフィール・ロゴ画像</Text>
          <View style={styles.imageSelectorContainer}>
            <TouchableOpacity onPress={() => selectImage('avatar')} style={styles.imageBox}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.selectedImageAvatar} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <User size={24} color="#94a3b8" />
                  <Text style={styles.imageBoxLabel}>アバター</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <ImageIcon size={10} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => selectImage('logo')} style={styles.imageBox}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.selectedImageLogo} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Building size={24} color="#94a3b8" />
                  <Text style={styles.imageBoxLabel}>企業ロゴ</Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <ImageIcon size={10} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          {/* デザイン編集セクションのヘッダー */}
          <Text style={styles.sectionLabel}>デザインのカスタマイズ</Text>
          
          {/* タブ切り替えボタン */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, editTab === 'color' && styles.activeTabButton]}
              onPress={() => setEditTab('color')}
            >
              <Palette size={16} color={editTab === 'color' ? '#ffffff' : '#94a3b8'} style={styles.tabIcon} />
              <Text style={[styles.tabButtonText, editTab === 'color' && styles.activeTabButtonText]}>カラー</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, editTab === 'template' && styles.activeTabButton]}
              onPress={() => setEditTab('template')}
            >
              <Layers size={16} color={editTab === 'template' ? '#ffffff' : '#94a3b8'} style={styles.tabIcon} />
              <Text style={[styles.tabButtonText, editTab === 'template' && styles.activeTabButtonText]}>テンプレート</Text>
            </TouchableOpacity>
          </View>

          {editTab === 'color' ? (
            <>
              <GradientPicker
                selectedStart={design.gradientStart}
                selectedEnd={design.gradientEnd}
                onSelect={(start, end) => setDesign({ ...design, gradientStart: start, gradientEnd: end })}
              />

              <View style={styles.patternSection}>
                <Text style={styles.label}>カードの背景スタイル</Text>
                <View style={styles.patternRow}>
                  {(['none', 'mesh', 'dots', 'glass'] as const).map((pat) => {
                    const isSelected = design.cardPattern === pat;
                    return (
                      <TouchableOpacity
                        key={pat}
                        onPress={() => setDesign({ ...design, cardPattern: pat })}
                        style={[styles.patternBtn, isSelected && styles.selectedPatternBtn]}
                      >
                        <Text style={[styles.patternBtnText, isSelected && styles.selectedPatternBtnText]}>
                          {pat === 'none' && 'シンプル'}
                          {pat === 'mesh' && 'メッシュ'}
                          {pat === 'dots' && 'グリッドドット'}
                          {pat === 'glass' && 'グラス風'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.templateSection}>
              <Text style={styles.label}>名刺の背景テンプレート</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
                {TEMPLATES.map((tpl) => {
                  const isSelected = templateId === tpl.id;
                  const isPurchased = !tpl.isPremium || purchasedTemplates.includes(tpl.id);
                  const bgSource = typeof tpl.backgroundImage === 'string' ? { uri: tpl.backgroundImage } : tpl.backgroundImage;

                  return (
                    <TouchableOpacity
                      key={tpl.id}
                      style={[styles.templateCard, isSelected && styles.selectedTemplateCard]}
                      onPress={() => handleSelectTemplate(tpl.id, tpl.isPremium)}
                    >
                      <View style={styles.templatePreviewWrapper}>
                        <Image source={bgSource} style={styles.templatePreviewImage} />
                        
                        {/* 縦・横の向きバッジ */}
                        <View style={styles.orientationBadge}>
                          <Text style={styles.orientationBadgeText}>{tpl.orientation === 'portrait' ? '縦' : '横'}</Text>
                        </View>

                        {/* 未購入プレミアムのロックオーバーレイ */}
                        {!isPurchased && (
                          <View style={styles.lockOverlay}>
                            <Lock size={16} color="#ffffff" />
                            <Text style={styles.lockPrice}>￥{tpl.price}</Text>
                          </View>
                        )}
                        {tpl.isPremium && isPurchased && (
                          <View style={styles.premiumBadge}>
                            <Crown size={10} color="#ffffff" />
                          </View>
                        )}
                      </View>
                      <Text style={styles.templateName} numberOfLines={1}>{tpl.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 基本情報フォーム */}
          <Text style={styles.sectionLabel}>基本情報</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <User size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="お名前 (必須)"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Building size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="会社名 / 所属団体"
                placeholderTextColor="#64748b"
                value={company}
                onChangeText={setCompany}
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <AlignLeft size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="役職"
                placeholderTextColor="#64748b"
                value={role}
                onChangeText={setRole}
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>連絡先</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="メールアドレス (必須)"
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Phone size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="電話番号"
                placeholderTextColor="#64748b"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Globe size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Webサイト URL"
                placeholderTextColor="#64748b"
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <MapPin size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="住所"
                placeholderTextColor="#64748b"
                value={address}
                onChangeText={setAddress}
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>紹介文 / メモ</Text>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="自己紹介やメッセージをここに入力できます (裏面に表示)"
                placeholderTextColor="#64748b"
                value={memo}
                onChangeText={setMemo}
                multiline
                numberOfLines={4}
                keyboardAppearance="dark"
              />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  saveBtnText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  scrollContent: {
    padding: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  imageSelectorContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  imageBox: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBoxLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  selectedImageAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  selectedImageLogo: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  editBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternSection: {
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  patternRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  patternBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedPatternBtn: {
    borderColor: '#818cf8',
    backgroundColor: '#2e3b56',
  },
  patternBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedPatternBtnText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    height: '100%',
  },
  textAreaWrapper: {
    height: 100,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  textArea: {
    textAlignVertical: 'top',
    height: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  activeTabButton: {
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  templateSection: {
    marginVertical: 12,
  },
  templateScroll: {
    paddingVertical: 8,
    gap: 12,
  },
  templateCard: {
    width: 100,
    alignItems: 'center',
  },
  selectedTemplateCard: {
    // 選択時にカード全体をわずかに強調
  },
  templatePreviewWrapper: {
    width: 90,
    height: 140, // 縦向き基準の比率 (縦長に近く見せるためのデモサイズ)
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedTemplateCardImage: {
    borderColor: '#6366f1',
  },
  templatePreviewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedTemplateCard: {
    // 選択されたテンプレートカードのアウター枠線をハイライト
  },
  templatePreviewWrapper: {
    width: 90,
    height: 140,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 重複キーのクリーンアップと整理
  orientationBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  orientationBadgeText: {
    fontSize: 8,
    color: '#e2e8f0',
    fontWeight: 'bold',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  lockPrice: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#eab308', // Amber 500
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  templateName: {
    fontSize: 11,
    color: '#cbd5e1',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
});
