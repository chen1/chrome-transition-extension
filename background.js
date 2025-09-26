// 后台脚本 - 为扩展提供持续运行的视图
// // console.log('文本翻译扩展后台脚本已加载');

// 扩展安装或启用时执行
chrome.runtime.onInstalled.addListener((details) => {
  // console.log('扩展安装/更新完成:', details);
  
  if (details.reason === 'install') {
    // console.log('扩展首次安装');
  } else if (details.reason === 'update') {
    // console.log('扩展已更新到版本:', chrome.runtime.getManifest().version);
  }
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log('收到来自内容脚本的消息:', request);
  
  if (request.type === 'CONTENT_SCRIPT_LOADED') {
    // console.log('内容脚本已在标签页中加载:', sender.tab.url);
    sendResponse({ status: 'success', message: '后台脚本收到确认' });
  }
  
  return true; // 保持消息通道开放
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // console.log('标签页加载完成:', tab.url);
  }
});

// 扩展图标点击事件（可选）
chrome.action.onClicked.addListener((tab) => {
  // console.log('扩展图标被点击，当前标签页:', tab.url);
});
















































