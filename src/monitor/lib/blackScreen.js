import tracker from "../utils/tracker";
import onload from "../utils/onload";
export function blackScreen() {
  let wrapperElements = ['body', 'html', '#container', '.content']
  let emptyPoints = 0
  function getSelector(element) {
    if(element.id) {
      return "#" + element.id
    }else if(element.className) { // a b c => .a.b.c
      return element.className.split('').filter(item => !!item).join('.')
    }else {
      return element.nodeName.toLowerCase()
    }
  }
  function isWrapper(element) {
    let selector = getSelector(element)
    if(wrapperElements.indexOf(selector) != -1) {
      emptyPoints++
    }
  }
  onload(function() {
    for(let i = 1;i <= 9;i++) {
      // 横着分为9份 纵坐标都是高度的一半
      let xElements = document.elementsFromPoint(window.innerWidth * i / 10, window.innerHeight / 2)
      // 竖着分为9份 横坐标都是宽度的一半
      let yElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight * i / 10)
      isWrapper(xElements[0])
      isWrapper(yElements[0])
    }
    if(emptyPoints >= 18) {
      // 取当前屏幕中间的点
      let centerElements = document.elementsFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      tracker.send({
        kind: 'stablity',
        type: 'blank',
        emptyPoints,
        // 屏幕宽度 与高度
        screen: window.screen.width + 'x' + window.screen.height,
        // 视口宽度 与高度
        viewPoint: window.innerWidth + "X" + window.innerHeight,
        selector: getSelector(centerElements[0])
      })
    }
  })
}