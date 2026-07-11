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
  apiKey: "AIzaSyDummyKey_ForInitializationTestingOnly",
  authDomain: "businesscard-demo-54.firebaseapp.com",
  projectId: "businesscard-demo-54",
  storageBucket: "businesscard-demo-54.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0"
};

// アプリの重複初期化を防止
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// React NativeのAsyncStorageを利用して、ログイン状態を永続的に保持する設定
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { app, auth, db };
