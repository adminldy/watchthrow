import getLastEvent from '../utils/getLastEvent'
import getSelector from '../utils/getSelector'
import tracker from '../utils/tracker'
export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener('error', (event) => { // 错误事件对象
    let lastEvent = getLastEvent() // 最后一个交互事件
    // 说明这是一个脚本错误
    if(event?.target?.src || event?.target?.href) {
      tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型， 这是一个错误
        errorType: 'resourceError', // js或css资源加载错误
        url: '', // 访问哪个路径报错了
        filename: event.target.src || event.target.href, // 哪个文件报错了
        tagName: event.target.tagName, // SCRIPT
        selector: getSelector(event.target) 
      })
    }else {
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
    }
  }, true)

  // 监听Promise的错误
  window.addEventListener('unhandledrejection', (event) => {
    console.log(event)
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
        let matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/)
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

  function getLines(stack) {
    return stack.split('\n').slice(1).map(item => item.replace(/^\s+at\s+/g, "")).join("")
  }
}