const { defineConfig } = require('@vue/cli-service')
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@tencent': path.resolve(__dirname, 'node_modules/@tencent'),
      }
    },
    devServer: {
      hot: false
    }
  }
})
