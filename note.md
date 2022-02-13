#### 一、配置webpack.config.js

```js
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
    open: true
  },
  plugins: [new HtmlWebpackPlugin({
    template: './src/index.html',
    inject: 'head', 
    scriptLoading: 'blocking' // 这里默认是defer 延迟加载 会影响监听js脚本的错误
  })]
}
```

#### 二、创建src目录

index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>前端内容监控SDK</title>
</head>
<body>
  <div class="container">
    <div class="content">
      <!-- 用来测试错误的按钮 -->
      <input type="button" value="点击抛出错误" onclick="errorClick()" />
      <input type="button" value="点击抛出Promise错误" onclick="promiseErrorClick()">
    </div>
  </div>
  <script>
    // 创建一个错误的函数 因为window此时没有someVar 所以会抛出错误
    function errorClick() {
      window.someVar.error = 'error'
    }
  </script>
</body>
</html>
```
#### 3. 创建jsError.js

```js
import getLastEvent from '../utils/getLastEvent' 
// 获取从捕获到目标的最后一个事件， 目的是获取选择器
import getSelector from '../utils/getSelector' 
// 处理选择器 
export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener('error', function(event) { // 错误事件对象
    console.log(event)
    let lastEvent = getLastEvent() // 最后一个交互事件
    console.log(lastEvent)
    let log = {
      kind: 'stability', // 监控指标的大类
      type: 'error', // 小类型， 这是一个错误
      errorType: 'jsError', // JS执行错误 
      url: '', // 访问哪个路径报错了
      message: event.message, // 报错信息
      filename: event.filename, // 哪个文件报错了
      position: `${event.lineno}:${event.colno}`, // 获取位置
      stack: getLines(event.error.stack), // 获取错误路径
      selector: lastEvent ? getSelector(lastEvent.path) : '' // 代表一个最后一个操作的元素
    }
  })
  function getLines(stack) {
    return stack.split('\n').slice(1).map(item => item.replace(/^\s+at\s+/g, "")).join("")
  }
}
```

#### 3. 创建utils

##### 3.1 getLastEvent.js

```js
let lastEvent
['click', 'touchstart', 'mousedown', 'keydown', 'mouseover'].forEach(eventType => {
  document.addEventListener(eventType, (event) => {
    lastEvent = event    
  }, {
    capture: true, // 捕获阶段
    passive: true // 默认不阻止默认事件
  })
})

export default function() {
  return lastEvent
}
```

##### 3.2 getSelectors

```js
function getSelectors(path) {
   // 反转数组并过滤掉document, window
  path.reverse().filter(element => {
    return element !== document && element !== window
  }).map(element => {
    let selector = ""
    if(element.id) {
      selector = `${element.tagName.toLowerCase()}#${element.id}`
    }else if(element.className && typeof element.className === 'string') {
      selector = `${element.tagName.toLowerCase()}.${element.className}`
    }else {
      selector = element.nodeName.toLowerCase()
    }
    return selector
  }).join(' ')
}
export default function (path) {
  if(Array.isArray(path)) {
    return getSelectors(path)
  }
}
```

#### 4 建立tracker.js

```js
let host = 'cn-beijing.log.aliyuncs.com' // 所在地区域名
let project = 'testmonitor'  // 项目名称 
let logstore = 'testmonitor-store' // store名称
let userAgent = require('user-agent') // 用来获取浏览器类型
function getExtraData() {
  return {
    title: document.title, // 当前html标题
    url: location.href, // 当前url
    timestamp: Date.now(), // 时间戳
    userAgent: userAgent.parse(navigator.userAgent).name, // 浏览器类型名称
  }
} 
// 用来发阿里云监控
class SendTracker { 
  constructor() {
    this.url = `https://${project}.${host}/logstores/${logstore}/track` // 配置监控路径
    this.xhr = new XMLHttpRequest() // new 一个XML对象 用来向阿里云发接口
  }
  // 发送数据
  send(data = {}) {
    let extraData = getExtraData() // 获取额外要添加的数据
    let log = {...extraData, ...data} // 合并对象
    // 对象的值不能是数字 - 阿里云要求
    for(let key in log) {
      if(typeof log[key] === 'number') {
        log[key] = `${log[key]}`
      }
    }
    
    let body = JSON.stringify({
      __logs__: [log] // __logs__是必要的参数
    })
    // true代表异步 
    this.xhr.open('POST', this.url, true)
    // 设置请求头
    this.xhr.setRequestHeader('x-log-apiversion', '0.6.0') // 版本号
    this.xhr.setRequestHeader('x-log-bodyrawsize', body.length) // 请求体的大小
    this.xhr.setRequestHeader('Content-Type', 'application/json') // 请求体类型
    this.xhr.onload = function() {
      // console.log(this.xhr.response)
    }
    this.xhr.onerror = function(error) {
      console.log(error)
    }
    this.xhr.send(body)
  }
}

export default new SendTracker()
```

#### 5 发送JS错误

```js
  tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型， 这是一个错误
        errorType: 'jsError', // JS执行错误 
        url: '', // 访问哪个路径报错了
        message: event.message, // 报错信息
        filename: event.filename, // 哪个文件报错了
        position: `${event.lineno}:${event.colno}`,
        stack: getLines(event.error.stack),
        selector: lastEvent ? getSelector(lastEvent.path) : '' // 代表一个最后一个操作的元素
      })
```

#### 6 监听Promise错误

```js
 window.addEventListener('unhandledrejection', (event) => {
    let lastEvent = getLastEvent()
    let message
    let filename
    let line = 0
    let column = 0
    let stack = ''
    let reason = event.reason
    if(typeof reason === 'string') { 
      message = reason
    }else if(typeof reason === 'object') { // 说明一个错误对象
      /*
      "TypeError: Cannot set properties of undefined (setting 'error')
      at http://localhost:8000/:22:30
      at new Promise (<anonymous>)
      at promiseErrorClick (http://localhost:8000/:21:7)
      at HTMLInputElement.onclick (http://localhost:8000/:13:99)"
      **/
      message = reason.stack.message
      if(reason.stack) {
        let matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/) // 获取文件名 位置信息
        filename = matchResult[1]
        line = matchResult[2]
        column = matchResult[3]
      }
      stack = getLines(reason.stack)
    }
    tracker.send({
      kind: 'stability', // 监控指标的大类
      type: 'error', // 小类型， 这是一个错误
      errorType: 'promiseError', // JS执行错误 
      url: '', // 访问哪个路径报错了
      message, // 报错信息
      filename, // 哪个文件报错了
      position: `${line}:${column}`,
      stack: stack,
      selector: lastEvent ? getSelector(lastEvent.path) : '' // 代表一个最后一个操作的元素
    })
  }, true)

```

#### 7 监听js脚本错误

```js
if(event?.target?.src || event?.target?.href) {
      tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型， 这是一个错误
        errorType: 'resourceError', // js或css资源加载错误
        url: '', // 访问哪个路径报错了
        filename: event.target.src || event.target.href, // 哪个文件报错了
        tagName: event.target.tagName, // SCRIPT
        selector: getSelector(event.target)  // 获取选择器
      })
}
```