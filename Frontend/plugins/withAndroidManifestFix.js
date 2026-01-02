const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Fix manifest merger conflict between expo-notifications and react-native-firebase
 * Both try to set com.google.firebase.messaging.default_notification_color
 */
const withAndroidManifestFix = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const { manifest } = androidManifest;

    if (!manifest.application) {
      return config;
    }

    const application = manifest.application[0];
    if (!application['meta-data']) {
      return config;
    }

    // Find the notification color meta-data and add tools:replace
    application['meta-data'] = application['meta-data'].map((meta) => {
      if (
        meta.$ && 
        meta.$['android:name'] === 'com.google.firebase.messaging.default_notification_color'
      ) {
        // Add tools namespace if not present
        if (!manifest.$) {
          manifest.$ = {};
        }
        if (!manifest.$['xmlns:tools']) {
          manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
        }

        // Add tools:replace to fix the conflict
        if (!meta.$) {
          meta.$ = {};
        }
        meta.$['tools:replace'] = 'android:resource';
      }
      return meta;
    });

    return config;
  });
};

module.exports = withAndroidManifestFix;

