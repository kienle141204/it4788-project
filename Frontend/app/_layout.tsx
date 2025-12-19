import { Stack } from "expo-router";
import { SafeAreaProvider , SafeAreaView} from "react-native-safe-area-context";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{flex:1}}>
        <NotificationsProvider>
          <Stack screenOptions={{headerShown:false}}/>
        </NotificationsProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
