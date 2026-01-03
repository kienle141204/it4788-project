/**
 * Entry point for Expo Router
 * This file ensures background message handler is registered before app starts
 * 
 * IMPORTANT: Background message handler MUST be registered at the top level
 * before the app starts, which is why we import the service here.
 */

// Register background message handler FIRST (before app starts)
import './service/pushNotifications';

// Then start Expo Router
import 'expo-router/entry';

