import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, Upload, Trash2, Info, ChevronRight, HelpCircle, FileText, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { exportAllData, importAllData } from '../../src/utils/storage';

export default function SettingsScreen() {
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // バックアップのエクスポート
  const handleExport = async () => {
    try {
      const dataStr = await exportAllData();
      if (!dataStr) {
        Alert.alert('エラー', 'バックアップデータの生成に失敗しました。');
        return;
      }

      await Share.share({
        title: 'デジタル名刺バックアップデータ',
        message: dataStr, // JSON文字列をそのままテキストとして共有
      });
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'エクスポート中に問題が発生しました。');
    }
  };

  // バックアップのインポート
  const handleImport = async () => {
    if (!jsonInput.trim()) {
      Alert.alert('入力エラー', 'バックアップコードを入力してください。');
      return;
    }

    Alert.alert(
      'データの復元',
      'データを復元しますか？既存のマイ名刺および同じIDの名刺データは上書きされます。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '復元する',
          onPress: async () => {
            const success = await importAllData(jsonInput);
            if (success) {
              setJsonInput('');
              setImportModalVisible(false);
              Alert.alert('完了', 'データを正常に復元しました。マイ名刺および名刺入れを確認してください。');
            } else {
              Alert.alert('エラー', 'データの復元に失敗しました。入力コードが正しい形式（JSON）か確認してください。');
            }
          },
        },
      ]
    );
  };

  // 全データ初期化
  const handleReset = () => {
    Alert.alert(
      'データの完全消去',
      'すべての名刺データ（マイ名刺と名刺入れ）を消去して初期化しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '消去する',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('完了', 'すべてのデータを消去しました。アプリを再読み込みしてください。');
            } catch (e) {
              Alert.alert('エラー', '消去に失敗しました。');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.subtitleText}>Settings</Text>
        <Text style={styles.titleText}>設定</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* セクション 1: データ管理 */}
        <Text style={styles.sectionLabel}>データバックアップ</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.itemRow} onPress={handleExport}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Download size={18} color="#3b82f6" />
              </View>
              <View>
                <Text style={styles.itemTitle}>バックアップを書き出す</Text>
                <Text style={styles.itemDesc}>全データを暗号化なしJSONとして共有します</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.itemRow} onPress={() => setImportModalVisible(true)}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Upload size={18} color="#10b981" />
              </View>
              <View>
                <Text style={styles.itemTitle}>バックアップを読み込む</Text>
                <Text style={styles.itemDesc}>保存されたコードからデータを復元します</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* セクション 2: トラブルシューティング */}
        <Text style={styles.sectionLabel}>メンテナンス</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.itemRow} onPress={handleReset}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Trash2 size={18} color="#ef4444" />
              </View>
              <View>
                <Text style={[styles.itemTitle, { color: '#ef4444' }]}>データをすべて消去</Text>
                <Text style={styles.itemDesc}>マイ名刺および名刺入れを完全に初期化します</Text>
              </View>
            </View>
            <ChevronRight size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* セクション 3: アプリについて */}
        <Text style={styles.sectionLabel}>アプリについて</Text>
        <View style={styles.card}>
          <View style={styles.itemRowInfo}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                <Info size={18} color="#94a3b8" />
              </View>
              <View>
                <Text style={styles.itemTitle}>バージョン</Text>
                <Text style={styles.itemDesc}>1.0.0 (Expo SDK 54)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.itemRowInfo}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconBg, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                <HelpCircle size={18} color="#94a3b8" />
              </View>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.itemTitle}>使い方ヘルプ</Text>
                <Text style={styles.itemDesc2}>
                  1. 「マイ名刺」タブで自分の情報を編集します。{'\n'}
                  2. 自分のカードをタップして裏返し、表示されたQRコードを相手に読み取ってもらいます。{'\n'}
                  3. 「スキャン」タブから、相手のQRコードをスキャンすることで名刺入れへ登録できます。
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ================= IMPORT MODAL ================= */}
      <Modal
        visible={importModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <SafeAreaView style={styles.modalContent} edges={['top', 'bottom']}>
            
            {/* ヘッダー */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>バックアップコードの読込</Text>
              <TouchableOpacity
                onPress={() => {
                  setJsonInput('');
                  setImportModalVisible(false);
                }}
                style={styles.closeBtn}
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* ボディ */}
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.modalIconContainer}>
                <FileText size={48} color="#818cf8" />
              </View>
              
              <Text style={styles.modalHintText}>
                エクスポートしたバックアップデータ（JSONテキスト）を下の入力エリアに貼り付けて、「データを復元する」ボタンを押してください。
              </Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="ここにバックアップテキスト(JSON)をペースト"
                  placeholderTextColor="#64748b"
                  value={jsonInput}
                  onChangeText={setJsonInput}
                  multiline
                  numberOfLines={10}
                  keyboardAppearance="dark"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity style={styles.importBtn} onPress={handleImport}>
                <Upload size={18} color="#ffffff" style={styles.importBtnIcon} />
                <Text style={styles.importBtnText}>データを復元する</Text>
              </TouchableOpacity>
            </ScrollView>

          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818cf8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemRowInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  itemDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  itemDesc2: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
  },
  // モーダル
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
  },
  modalScroll: {
    padding: 20,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalHintText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputWrapper: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    height: 200,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    textAlignVertical: 'top',
  },
  importBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  importBtnIcon: {
    marginRight: 6,
  },
  importBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
