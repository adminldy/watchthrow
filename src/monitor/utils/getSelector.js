function getSelectors(path) {
  // 反转数组并过滤掉document, window
  return path.reverse().filter(element => {
    return element !== document && element !== window
  }).map(element => {
    let selector = ""
    if(element.id) {
      selector = `${element.nodeName.toLowerCase()}#${element.id}`
    }else if(element.className && typeof element.className === 'string') {
      selector = `${element.nodeName.toLowerCase()}.${element.className}`
    }else {
      selector = element.nodeName.toLowerCase()
    }
    return selector
  }).join(' ')
}
export default function (pathsOrTarget) {
  if(Array.isArray(pathsOrTarget)) {
    return getSelectors(pathsOrTarget)
  }else {
    let path = []
    while(pathsOrTarget) {
      path.push(pathsOrTarget)
      pathsOrTarget = pathsOrTarget.parentNode
    }
    return getSelectors(path)
  }
}