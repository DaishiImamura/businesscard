import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { LogIn, Mail, Lock, UserPlus, ShieldAlert, Chrome } from 'lucide-react-native';
import { auth, db } from '../../src/utils/firebase';

// WebBrowserでのOAuthリダイレクトのハンドリングを完了させる
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // =================================================================
  // Google ログイン設定 (Expo Auth Session)
  // ※実機での本番動作には、Google Cloud ConsoleおよびFirebaseコンソールで
  //   取得した各クライアントIDを入力する必要があります。
  // =================================================================
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '206177241132-pup8cnlaofd8r5bp0fpr5a03ee1duale.apps.googleusercontent.com', // 共通のウェブ用クライアントIDのみを使用
  });

  // Google認証レスポンスの監視
  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      const { idToken } = response.authentication;
      handleGoogleSignIn(idToken);
    }
  }, [response]);

  // Googleアカウントによるログイン ＆ 新規ユーザー初期化処理
  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // 初めてログインしたユーザーの場合、Firestoreにユーザープロフィールを作成
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          id: user.uid,
          name: user.displayName || 'Google ユーザー',
          email: user.email?.toLowerCase() || '',
          role: 'user', // デフォルト一般ユーザー
          purchasedTemplates: [],
          createdAt: new Date().toISOString(),
        });
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Google Sign-in failed', error);
      Alert.alert('Googleログインエラー', 'Googleアカウントでの認証に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'ログインに失敗しました。';
      if (error.code === 'auth/invalid-email') {
        errorMsg = '無効なメールアドレスの形式です。';
      } else if (error.code === 'auth/user-disabled') {
        errorMsg = 'このアカウントは無効化されています。';
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMsg = 'メールアドレスまたはパスワードが正しくありません。';
      }
      Alert.alert('ログインエラー', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (type: 'admin' | 'user') => {
    const demoEmail = type === 'admin' ? 'admin@demo.com' : 'user@demo.com';
    const demoPassword = 'password123';

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert(
        'デモログイン情報',
        `デモアカウント (${demoEmail}) が登録されていません。まずは「新規登録」からこのメールアドレスと適当なパスワードでアカウントを作成してください。\n\n※adminで登録したアカウントは、Firebaseコンソールから role を "admin" に書き換えることで管理者機能が有効化されます。`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* ロゴ / ヘッダー */}
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <LogIn size={32} color="#818cf8" />
          </View>
          <Text style={styles.title}>Digital Business Card</Text>
          <Text style={styles.subtitle}>ログインして名刺管理を始めましょう</Text>
        </View>

        {/* 入力フォーム */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="パスワード"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <LogIn size={20} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.loginBtnText}>ログイン</Text>
              </>
            )}
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>または</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google ログインボタン */}
          <TouchableOpacity
            style={[styles.googleBtn, (!request || loading) && styles.disabledBtn]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            {loading ? (
              <ActivityIndicator color="#64748b" />
            ) : (
              <>
                <Chrome size={20} color="#ea4335" style={styles.btnIcon} />
                <Text style={styles.googleBtnText}>Google でサインイン</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* アカウント作成への誘導 */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.push('/signup')}
        >
          <UserPlus size={16} color="#818cf8" style={styles.signupIcon} />
          <Text style={styles.signupLinkText}>新規アカウントを作成する</Text>
        </TouchableOpacity>

        {/* デモログインセクション */}
        <View style={styles.demoSection}>
          <View style={styles.demoHeader}>
            <ShieldAlert size={14} color="#64748b" />
            <Text style={styles.demoTitle}>開発・テスト用かんたんログイン</Text>
          </View>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoAdminBtn]}
              onPress={() => handleDemoLogin('admin')}
            >
              <Text style={styles.demoBtnText}>管理者デモでログイン</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoBtn, styles.demoUserBtn]}
              onPress={() => handleDemoLogin('user')}
            >
              <Text style={styles.demoBtnText}>一般デモでログイン</Text>
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  loginBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  googleBtn: {
    backgroundColor: '#ffffff', // Googleサインイン用白背景
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnIcon: {
    marginRight: 10,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  googleBtnText: {
    color: '#1e293b', // ダークグレーテキスト
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  signupLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 8,
  },
  signupIcon: {
    marginRight: 6,
  },
  signupLinkText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 16,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  demoTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  demoAdminBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  demoUserBtn: {
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    borderColor: 'rgba(129, 140, 248, 0.2)',
  },
  demoBtnText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '600',
  },
});
