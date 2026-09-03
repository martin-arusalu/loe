const { withPodfile } = require("@expo/config-plugins");

/**
 * GoogleSignIn 8 pulls in Swift App Check pods. They require module maps when
 * CocoaPods integrates them as static libraries, which is Expo's default.
 */
module.exports = function withModularHeaders(config) {
  return withPodfile(config, (config) => {
    if (!config.modResults.contents.includes("use_modular_headers!")) {
      config.modResults.contents = config.modResults.contents.replace(
        /platform :ios, [^\n]+\n/,
        (line) => `${line}\nuse_modular_headers!\n`
      );
    }
    return config;
  });
};
