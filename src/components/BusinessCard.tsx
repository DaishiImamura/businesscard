import React, { useState } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Image, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import QRCode from 'react-native-qrcode-svg';
import { Phone, Mail, Globe, MapPin, Sparkles, RefreshCw } from 'lucide-react-native';
import { BusinessCardData } from '../types/card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEFAULT_CARD_WIDTH = SCREEN_WIDTH - 32;
const DEFAULT_CARD_HEIGHT = DEFAULT_CARD_WIDTH * 0.58;

interface BusinessCardProps {
  data: BusinessCardData;
  onFlip?: (isFlipped: boolean) => void;
  enableParallax?: boolean;
  cardWidth?: number;
}

export default function BusinessCard({
  data,
  onFlip,
  enableParallax = true,
  cardWidth,
}: BusinessCardProps) {
  const [flipped, setFlipped] = useState(false);

  const currentWidth = cardWidth || DEFAULT_CARD_WIDTH;
  const currentHeight = currentWidth * 0.58;
  const scale = currentWidth / DEFAULT_CARD_WIDTH;

  // 3Dフリップ用の共有値 (0: 表, 180: 裏)
  const rotateY = useSharedValue(0);

  // パララックス（傾き）用の共有値
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // 3Dフリップアニメーション
  const toggleFlip = () => {
    const nextFlipped = !flipped;
    setFlipped(nextFlipped);
    if (onFlip) {
      onFlip(nextFlipped);
    }
    rotateY.value = withSpring(nextFlipped ? 180 : 0, {
      damping: 15,
      stiffness: 90,
    });
  };

  // パララックスジェスチャー
  const dragGesture = Gesture.Pan()
    .enabled(enableParallax)
    .onUpdate((event) => {
      // カードの中心からの相対距離をベースに傾き量を計算 (最大±15度)
      const relativeX = (event.x - currentWidth / 2) / (currentWidth / 2);
      const relativeY = (event.y - currentHeight / 2) / (currentHeight / 2);
      tiltX.value = -relativeY * 15; // Y方向のドラッグでX軸回転
      tiltY.value = relativeX * 15;  // X方向のドラッグでY軸回転
    })
    .onEnd(() => {
      // 指を離したら滑らかに元の角度に戻る
      tiltX.value = withSpring(0, { damping: 10 });
      tiltY.value = withSpring(0, { damping: 10 });
    });

  // パララックスとフリップを組み合わせた3D変形スタイル
  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${tiltX.value}deg` },
        { rotateY: `${rotateY.value + tiltY.value}deg` },
      ],
    };
  });

  // 表側の不透明度と背面タッチの無効化
  const frontStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 90, 180], [1, 0, 0]);
    return {
      opacity,
      zIndex: opacity > 0.5 ? 1 : 0,
    };
  });

  // 裏側の不透明度と背面タッチの無効化
  const backStyle = useAnimatedStyle(() => {
    const opacity = interpolate(rotateY.value, [0, 90, 180], [0, 0, 1]);
    return {
      opacity,
      transform: [{ rotateY: '180deg' }],
      zIndex: opacity > 0.5 ? 1 : 0,
    };
  });

  // クイックアクション
  const handlePhonePress = () => {
    if (data.phone) Linking.openURL(`tel:${data.phone}`);
  };

  const handleEmailPress = () => {
    if (data.email) Linking.openURL(`mailto:${data.email}`);
  };

  const handleWebsitePress = () => {
    if (data.website) {
      const url = data.website.startsWith('http') ? data.website : `https://${data.website}`;
      Linking.openURL(url);
    }
  };

  const handleAddressPress = () => {
    if (data.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(data.address)}`;
      Linking.openURL(url);
    }
  };

  // QRコードに埋め込むデータ (URLスキーム: businesscard://scan?data=...)
  // 圧縮やバイナリ化せず、JSON文字列をBase64化してパラメータにのせる
  const qrValue = (() => {
    try {
      const serialized = JSON.stringify({
        id: data.id,
        name: data.name,
        company: data.company,
        role: data.role,
        email: data.email,
        phone: data.phone || '',
        website: data.website || '',
        address: data.address || '',
        memo: data.memo || '',
        design: data.design,
      });
      return `businesscard://scan?data=${encodeURIComponent(serialized)}`;
    } catch {
      return '';
    }
  })();

  const renderPattern = () => {
    const { cardPattern } = data.design;
    if (cardPattern === 'dots') {
      return (
        <View style={styles.patternContainer} pointerEvents="none">
          <View style={styles.dotsPattern} />
        </View>
      );
    }
    if (cardPattern === 'mesh') {
      return (
        <View style={[styles.patternContainer, styles.meshPattern]} pointerEvents="none" />
      );
    }
    return null;
  };

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[styles.cardContainer, { width: currentWidth, height: currentHeight, borderRadius: 20 * scale }, animatedCardStyle]}>
        
        {/* === CARD FRONT === */}
        <Animated.View
          style={[
            styles.cardFace,
            frontStyle,
            {
              backgroundColor: data.design.gradientStart,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 20 * scale,
              padding: 20 * scale,
            },
          ]}
        >
          {/* 背景のグラデーション風デザイン */}
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: data.design.gradientEnd, opacity: 0.75 },
            ]}
          />
          {renderPattern()}

          {/* グラスモルフィズム風の白いぼかし光沢効果 */}
          {data.design.cardPattern === 'glass' && (
            <View style={[styles.glassGlow, { borderRadius: 20 * scale }]} pointerEvents="none" />
          )}

          {/* 表コンテンツ */}
          <View style={styles.cardHeader}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.companyText, { color: data.design.textColor, fontSize: 16 * scale }]}>
                {data.company}
              </Text>
              <Text style={[styles.roleText, { color: data.design.textColor, opacity: 0.8, fontSize: 12 * scale, marginTop: 2 * scale }]}>
                {data.role}
              </Text>
            </View>
            {data.logo ? (
              <Image source={{ uri: data.logo }} style={[styles.logoImage, { width: 32 * scale, height: 32 * scale, borderRadius: 6 * scale }]} />
            ) : (
              <View style={[styles.logoPlaceholder, { borderColor: data.design.textColor, width: 32 * scale, height: 32 * scale, borderRadius: 16 * scale }]}>
                <Sparkles size={16 * scale} color={data.design.textColor} />
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.mainInfo}>
              {data.avatar && (
                <Image source={{ uri: data.avatar }} style={[styles.avatarImage, { width: 50 * scale, height: 50 * scale, borderRadius: 25 * scale, marginRight: 16 * scale }]} />
              )}
              <View style={styles.nameContainer}>
                <Text style={[styles.nameText, { color: data.design.textColor, fontSize: 24 * scale }]}>
                  {data.name}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.contactRow}>
              {data.phone ? (
                <TouchableOpacity onPress={handlePhonePress} style={[styles.contactIcon, { marginTop: 4 * scale }]}>
                  <Phone size={14 * scale} color={data.design.textColor} />
                  <Text style={[styles.contactText, { color: data.design.textColor, fontSize: 11 * scale, marginLeft: 6 * scale }]} numberOfLines={1}>
                    {data.phone}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={handleEmailPress} style={[styles.contactIcon, { marginTop: 4 * scale }]}>
                <Mail size={14 * scale} color={data.design.textColor} />
                <Text style={[styles.contactText, { color: data.design.textColor, fontSize: 11 * scale, marginLeft: 6 * scale }]} numberOfLines={1}>
                  {data.email}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={toggleFlip} style={[styles.flipBtn, { width: 28 * scale, height: 28 * scale, borderRadius: 14 * scale }]}>
              <RefreshCw size={14 * scale} color={data.design.textColor} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* === CARD BACK === */}
        <Animated.View
          style={[
            styles.cardFace,
            backStyle,
            {
              backgroundColor: data.design.gradientStart,
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: 20 * scale,
              padding: 20 * scale,
            },
          ]}
        >
          {/* 背景グラデーション */}
          <View
            style={[
              styles.gradientOverlay,
              { backgroundColor: data.design.gradientEnd, opacity: 0.75 },
            ]}
          />
          {renderPattern()}

          {/* 裏コンテンツ */}
          <View style={styles.backContainer}>
            <View style={[styles.qrSection, { marginRight: 20 * scale }]}>
              {qrValue ? (
                <View style={[styles.qrWrapper, { padding: 8 * scale, borderRadius: 12 * scale }]}>
                  <QRCode value={qrValue} size={90 * scale} backgroundColor="white" quietZone={6 * scale} />
                </View>
              ) : null}
              <Text style={[styles.qrLabel, { color: data.design.textColor, fontSize: 9 * scale, marginTop: 6 * scale }]}>
                スキャンして連絡先を登録
              </Text>
            </View>

            <View style={styles.backInfoSection}>
              <Text style={[styles.backName, { color: data.design.textColor, fontSize: 18 * scale }]}>
                {data.name}
              </Text>
              <Text style={[styles.backRole, { color: data.design.textColor, opacity: 0.8, fontSize: 10 * scale, marginTop: 2 * scale }]}>
                {data.company} / {data.role}
              </Text>

              {/* メモまたはウェブ・SNSリンク */}
              <View style={[styles.backLinks, { marginTop: 8 * scale }]}>
                {data.website ? (
                  <TouchableOpacity onPress={handleWebsitePress} style={[styles.backLinkItem, { marginTop: 3 * scale }]}>
                    <Globe size={12 * scale} color={data.design.textColor} />
                    <Text style={[styles.backLinkText, { color: data.design.textColor, fontSize: 10 * scale, marginLeft: 4 * scale }]} numberOfLines={1}>
                      {data.website}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {data.address ? (
                  <TouchableOpacity onPress={handleAddressPress} style={[styles.backLinkItem, { marginTop: 3 * scale }]}>
                    <MapPin size={12 * scale} color={data.design.textColor} />
                    <Text style={[styles.backLinkText, { color: data.design.textColor, fontSize: 10 * scale, marginLeft: 4 * scale }]} numberOfLines={1}>
                      {data.address}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {data.memo ? (
                  <Text style={[styles.backMemoText, { color: data.design.textColor, fontSize: 9 * scale, marginTop: 6 * scale, lineHeight: 12 * scale }]} numberOfLines={3}>
                    {data.memo}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={toggleFlip}
                style={[
                  styles.flipBtn,
                  styles.flipBtnBack,
                  { width: 28 * scale, height: 28 * scale, borderRadius: 14 * scale, bottom: 0, right: 0 },
                ]}
              >
                <RefreshCw size={14 * scale} color={data.design.textColor} />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    alignSelf: 'center',
    marginVertical: 12,
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  // 背景パターン
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12,
  },
  dotsPattern: {
    flex: 1,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
    backgroundSize: '12px 12px',
  },
  meshPattern: {
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.15) 25%, transparent 25%)',
    backgroundSize: '30px 30px',
  },
  glassGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    // 疑似グラスモルフィズム
  },
  // 表レイアウト
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  companyText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  roleText: {
    fontSize: 12,
    marginTop: 2,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  mainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  nameContainer: {
    flex: 1,
  },
  nameText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  contactRow: {
    flex: 1,
    marginRight: 20,
  },
  contactIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 11,
    marginLeft: 6,
    opacity: 0.85,
    fontWeight: '500',
  },
  flipBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtnBack: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  // 裏レイアウト
  backContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  qrLabel: {
    fontSize: 9,
    marginTop: 6,
    fontWeight: '600',
    opacity: 0.9,
  },
  backInfoSection: {
    flex: 1,
    justifyContent: 'center',
    height: '100%',
  },
  backName: {
    fontSize: 18,
    fontWeight: '700',
  },
  backRole: {
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },
  backLinks: {
    marginTop: 8,
    flex: 1,
    justifyContent: 'flex-start',
  },
  backLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  backLinkText: {
    fontSize: 10,
    marginLeft: 4,
    opacity: 0.85,
  },
  backMemoText: {
    fontSize: 9,
    marginTop: 6,
    fontStyle: 'italic',
    lineHeight: 12,
    opacity: 0.8,
  },
});
