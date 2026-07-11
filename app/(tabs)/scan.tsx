import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Button, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, RefreshCw, X, ShieldAlert } from 'lucide-react-native';
import { addWalletCard } from '../../src/utils/storage';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const isScanningRef = useRef(true);

  // 画面フォーカス時にスキャンを有効化し、画面から外れるときはロックする
  useFocusEffect(
    React.useCallback(() => {
      isScanningRef.current = true;
      setScanned(false);
      return () => {
        isScanningRef.current = false;
        setScanned(true);
      };
    }, [])
  );

  // カメラ権限が読み込み中の場合
  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>カメラ権限を確認中...</Text>
      </View>
    );
  }

  // カメラ権限が許可されていない場合
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <ShieldAlert size={60} color="#ef4444" style={styles.permissionIcon} />
          <Text style={styles.permissionTitle}>カメラのアクセス権限が必要です</Text>
          <Text style={styles.permissionDesc}>
            QRコードをスキャンして名刺情報を読み取るために、カメラへのアクセスを許可してください。
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>アクセスを許可する</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (!isScanningRef.current) return;
    isScanningRef.current = false;
    setScanned(true);

    try {
      // データの検証 (フォーマット: businesscard://scan?data=...)
      if (!data.startsWith('businesscard://scan?data=')) {
        Alert.alert(
          'エラー',
          '無効なQRコードです。デジタル名刺アプリで生成されたQRコードをスキャンしてください。',
          [{ text: '再試行', onPress: () => { isScanningRef.current = true; setScanned(false); } }]
        );
        return;
      }

      // Base64またはシリアライズされたデータを抽出
      const url = new URL(data);
      const dataParam = url.searchParams.get('data');
      if (!dataParam) {
        throw new Error('No data param found');
      }

      const decodedData = decodeURIComponent(dataParam);
      const cardInfo = JSON.parse(decodedData);

      if (!cardInfo.id || !cardInfo.name || !cardInfo.email) {
        throw new Error('Invalid card data structure');
      }

      // 相手の名前と会社を表示して登録確認
      Alert.alert(
        '名刺を検出しました',
        `${cardInfo.name} さん（${cardInfo.company || '会社名なし'}）\nを名刺入れに登録しますか？`,
        [
          {
            text: 'キャンセル',
            style: 'cancel',
            onPress: () => {
              isScanningRef.current = true;
              setScanned(false);
            },
          },
          {
            text: '登録する',
            onPress: async () => {
              // 登録処理
              const originalTags = cardInfo.tags || [];
              const success = await addWalletCard({
                ...cardInfo,
                id: cardInfo.id, // そのまま元のIDを維持
                isFavorite: false,
                tags: originalTags.includes('自分') ? ['スキャン'] : [...originalTags, 'スキャン'], // スキャンタグを補完
              });

              if (success) {
                Alert.alert('登録完了', `${cardInfo.name} さんの名刺を登録しました。`, [
                  {
                    text: '名刺入れを見る',
                    onPress: () => {
                      router.push('/wallet');
                    },
                  },
                  {
                    text: '続けてスキャン',
                    onPress: () => {
                      isScanningRef.current = true;
                      setScanned(false);
                    },
                  },
                ]);
              } else {
                Alert.alert('エラー', '登録に失敗しました。', [
                  { text: 'OK', onPress: () => { isScanningRef.current = true; setScanned(false); } },
                ]);
              }
            },
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('読み取りエラー', 'QRコードの解析に失敗しました。', [
        { text: '再試行', onPress: () => { isScanningRef.current = true; setScanned(false); } },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.subtitleText}>QR Scanner</Text>
        <Text style={styles.titleText}>名刺スキャン</Text>
      </View>

      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          {/* スキャン枠のアニメーション風の目印 */}
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.focusedContainer}>
                {/* 四隅のコーナーインジケータ */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>
        </CameraView>
      </View>

      {/* スキャン済みのリセットUI */}
      {scanned && (
        <View style={styles.resetContainer}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setScanned(false)}>
            <RefreshCw size={16} color="#ffffff" style={styles.resetIcon} />
            <Text style={styles.resetBtnText}>スキャンを再開</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          相手のアプリに表示されている「QRコード」をこの枠内に収まるようにかざしてください。
        </Text>
      </View>

      <View style={{ height: 80 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
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
  scannerWrapper: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  // 権限エラーUI
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionDesc: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  permissionBtn: {
    height: 50,
    paddingHorizontal: 24,
    borderRadius: 14,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  // スキャナー枠
  overlay: {
    flex: 1,
  },
  unfocusedContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  middleContainer: {
    flexDirection: 'row',
    height: 240,
  },
  focusedContainer: {
    width: 240,
    height: 240,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#818cf8',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  resetContainer: {
    position: 'absolute',
    bottom: 140,
    alignSelf: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  resetIcon: {
    marginRight: 6,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  hintContainer: {
    paddingHorizontal: 30,
    marginVertical: 14,
  },
  hintText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
