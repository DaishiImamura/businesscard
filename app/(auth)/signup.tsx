import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { UserPlus, User, Mail, Lock, LogIn } from 'lucide-react-native';
import { auth, db } from '../../src/utils/firebase';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('入力エラー', 'すべての項目を入力してください。');
      return;
    }

    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で設定してください。');
      return;
    }

    setLoading(true);
    try {
      // 1. Firebase Authにアカウント作成
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      // 2. Firestoreにユーザー初期データを登録 (デフォルトは role: "user")
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'user', // デフォルト権限
        purchasedTemplates: [], // 初期状態は未購入
        createdAt: new Date().toISOString(),
      });

      Alert.alert('登録完了', 'アカウントの作成に成功しました！', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'アカウントの作成に失敗しました。';
      if (error.code === 'auth/email-already-in-use') {
        errorMsg = 'このメールアドレスは既に登録されています。';
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = '無効なメールアドレスの形式です。';
      } else if (error.code === 'auth/weak-password') {
        errorMsg = 'パスワードが簡単すぎます。文字数を増やすか複雑にしてください。';
      }
      Alert.alert('登録エラー', errorMsg);
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
            <UserPlus size={32} color="#818cf8" />
          </View>
          <Text style={styles.title}>新規アカウント作成</Text>
          <Text style={styles.subtitle}>情報を入力してアカウントを作成してください</Text>
        </View>

        {/* 入力フォーム */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <User size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="お名前"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

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
              placeholder="パスワード（6文字以上）"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
          </View>

          <TouchableOpacity 
            style={[styles.signupBtn, loading && styles.disabledBtn]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <UserPlus size={20} color="#ffffff" style={styles.btnIcon} />
                <Text style={styles.signupBtnText}>アカウント作成</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ログイン画面への誘導 */}
        <TouchableOpacity 
          style={styles.loginLink} 
          onPress={() => router.push('/login')}
        >
          <LogIn size={16} color="#818cf8" style={styles.loginIcon} />
          <Text style={styles.loginLinkText}>既にアカウントをお持ちの方（ログイン）</Text>
        </TouchableOpacity>

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
  signupBtn: {
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
  signupBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  loginIcon: {
    marginRight: 6,
  },
  loginLinkText: {
    color: '#818cf8',
    fontSize: 14,
    fontWeight: '600',
  },
});
