import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Nexo",
  slug: "nexo",
  version: "1.0.0",
  scheme: "nexo",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/logo/icon.png",
  assetBundlePatterns: ["**/*"],
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/logo/splash.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#090A12",
        dark: {
          backgroundColor: "#090A12",
        },
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Nexo usa tu galeria solo cuando eliges subir un avatar o una imagen a una publicacion.",
      },
    ],
    [
      "expo-notifications",
      {
        color: "#7C5CFF",
      },
    ],
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.nexo.social",
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "Nexo usa tu galeria solo cuando eliges subir un avatar o contenido multimedia.",
    },
  },
  android: {
    package: "com.nexo.social",
    versionCode: 1,
    permissions: [],
    predictiveBackGestureEnabled: true,
    adaptiveIcon: {
      foregroundImage: "./assets/logo/adaptive-foreground.png",
      backgroundColor: "#090A12",
      monochromeImage: "./assets/logo/adaptive-monochrome.png",
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/logo/icon.png",
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "replace-with-your-eas-project-id",
    },
  },
};

export default config;
