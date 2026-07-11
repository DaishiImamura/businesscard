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
import { ArrowLeft, Save, User, Building, Mail, Phone, Globe, MapPin, AlignLeft, Image as ImageIcon } from 'lucide-react-native';
import { getMyCard, saveMyCard } from '../src/utils/storage';
import { BusinessCardData, CardDesign } from '../src/types/card';
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
      }
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

          {/* デザイン編集 */}
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
});
