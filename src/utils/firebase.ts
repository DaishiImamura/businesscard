import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =================================================================
// Firebase 設定
// ※アプリを本番環境で起動する場合は、ご自身のFirebaseプロジェクトの
//   「ウェブアプリ設定」から取得した実際のキー群に書き換えてください。
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBrbrQFLQgxaicI3jIt4vSkr2G2eNnPDA4",
  authDomain: "businesscard-a7ce5.firebaseapp.com",
  projectId: "businesscard-a7ce5",
  storageBucket: "businesscard-a7ce5.firebasestorage.app",
  messagingSenderId: "403382464198",
  appId: "1:403382464198:web:a895601529f9e14a34b1c7"
};

// アプリの重複初期化を防止
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React NativeのAsyncStorageを利用して、ログイン状態を永続的に保持する設定
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };
