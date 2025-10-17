import AsyncStorage from "@react-native-async-storage/async-storage"

export const checkAsyncStorage = async () => {
    const access = await AsyncStorage.getItem('access_token')

    if (!access) return false
    return true
}