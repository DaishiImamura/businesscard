import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { LogIn, Mail, Lock, UserPlus, ShieldAlert } from 'lucide-react-native';
import { auth } from '../../src/utils/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('入力エラー', 'メールアドレスとパスワードを入力してください。');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // ログイン成功時、Auth Gateが検知して自動的にメイン画面へ遷移するため
      // ここでの明示的な router.replace は不要ですが、念のため記述しておきます
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

  // テスト用：ワンタップでかんたんログインできるデモアカウント
  const handleDemoLogin = async (type: 'admin' | 'user') => {
    const demoEmail = type === 'admin' ? 'admin@demo.com' : 'user@demo.com';
    const demoPassword = 'password123';
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, demoEmail, demoPassword);
      router.replace('/(tabs)');
    } catch (error: any) {
      // デモアカウントが存在しない場合は、その場で作ってログインする流れにするため
      // ここでエラーが出た場合は登録画面に促すか、警告を出します
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
    backgroundColor: '#0f172a', // スレートダーク背景
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
  disabledBtn: {
    opacity: 0.7,
  },
  btnIcon: {
    marginRight: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    marginTop: 48,
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
