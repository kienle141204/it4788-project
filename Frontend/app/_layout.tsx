import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <NotificationsProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </NotificationsProvider>
    </SafeAreaProvider>
  );
}
