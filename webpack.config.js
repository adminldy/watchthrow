const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  entry: './src/index.js',
  context: process.cwd(), // 上下文目录
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'monitor.js'
  },
  // 开发环境 静态文件目录
  devServer: {
    port: 8000, // 改变端口号
    hot: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', //代理地址，这里设置的地址会代替axios中设置的baseURL
        changeOrigin: true, // 如果接口跨域，需要进行这个参数配置
        //ws: true, // proxy websockets
        //pathRewrite方法重写url
        pathRewrite: {
          '^/api': '/'
          //pathRewrite: {'^/api': '/'} 重写之后url为 http://192.168.1.16:8085/xxxx
          //pathRewrite: {'^/api': '/api'} 重写之后url为 http://192.168.1.16:8085/api/xxxx
        }
      }
    }
  },
  plugins: [new HtmlWebpackPlugin({
    template: './src/index.html',
    inject: 'head',
    // 默认defer会延迟加载, 导致后面监控不到script脚本的执行
    scriptLoading: 'blocking'
  })]
}