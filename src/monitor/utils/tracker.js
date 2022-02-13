let host = 'cn-beijing.log.aliyuncs.com'
let project = 'testmonitor'
let logstore = 'testmonitor-store'
let userAgent = require('user-agent')
function getExtraData() {
  return {
    title: document.title,
    url: location.href,
    timestamp: Date.now(), // 时间戳
    userAgent: userAgent.parse(navigator.userAgent).name,
  }
}
class SendTracker {
  constructor() {
    this.url = `https://${project}.${host}/logstores/${logstore}/track`
    this.xhr = new XMLHttpRequest()
  }
  send(data = {}) {
    let extraData = getExtraData()
    let log = {...extraData, ...data}
    // 对象的值不能是数字 - 阿里云要求
    for(let key in log) {
      if(typeof log[key] === 'number') {
        log[key] = `${log[key]}`
      }
    }
    
    let body = JSON.stringify({
      __logs__: [log]
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