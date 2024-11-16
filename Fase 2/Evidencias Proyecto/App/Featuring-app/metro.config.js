const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Asegúrate de incluir "cjs" para NativeWind
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== "cjs");
config.resolver.sourceExts.push("cjs");

module.exports = config;
