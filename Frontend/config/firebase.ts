// Firebase configuration for frontend
// Project ID từ backend: push-notification-it4788
// Lưu ý: Cần lấy các giá trị còn lại từ Firebase Console
// https://console.firebase.google.com/project/push-notification-it4788/settings/general

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "push-notification-it4788.firebaseapp.com",
  projectId: "push-notification-it4788", // Từ backend
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "push-notification-it4788.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Kiểm tra xem cấu hình có đầy đủ không
export const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.messagingSenderId !== "YOUR_MESSAGING_SENDER_ID" &&
    firebaseConfig.appId !== "YOUR_APP_ID"
  );
};

