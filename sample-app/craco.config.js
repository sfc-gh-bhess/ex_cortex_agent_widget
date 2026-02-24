module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find and configure ForkTsCheckerWebpackPlugin
      const forkTsCheckerPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );

      if (forkTsCheckerPlugin) {
        // Increase memory limit and configure TypeScript checker
        forkTsCheckerPlugin.options = {
          ...forkTsCheckerPlugin.options,
          typescript: {
            ...forkTsCheckerPlugin.options.typescript,
            memoryLimit: 4096, // Increase memory limit to 4GB
            diagnosticOptions: {
              semantic: true,
              syntactic: true,
            },
          },
        };
      }

      return webpackConfig;
    },
  },
};
