// 调试版本的内容脚本 - 简化版本用于排查问题
// // console.log('=== 调试内容脚本开始执行 ===');
// // console.log('当前页面URL:', window.location.href);
// // console.log('页面状态:', document.readyState);
// // console.log('Chrome API可用性:', typeof chrome !== 'undefined' && !!chrome.runtime);

// 简化的翻译工具类
class DebugTranslationTooltip {
  constructor() {
    this.tooltip = null;
    this.translationDict = {
      'click': '点击',
      'submit': '提交',
      'cancel': '取消',
      'save': '保存',
      'delete': '删除',
      'home': '首页',
      'about': '关于',
      'contact': '联系',
      'login': '登录',
      'register': '注册',
      'hello': '你好',
      'world': '世界',
      'test': '测试',
      'welcome': '欢迎',
      'thank': '谢谢',
      'username': '用户名',
      'password': '密码',
      'message': '消息',
      'name': '姓名',
      'email': '邮箱',
      'status': '状态',
      'active': '活跃',
      'inactive': '非活跃'
    };
    
    this.init();
  }

  init() {
    // console.log('开始初始化调试翻译工具...');
    
    try {
      this.createTooltip();
      this.bindEvents();
      // console.log('调试翻译工具初始化完成');
    } catch (error) {
      // console.error('调试翻译工具初始化失败:', error);
    }
  }

  createTooltip() {
    // console.log('创建提示框元素...');
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'debug-translation-tooltip';
    this.tooltip.style.cssText = `
      position: fixed !important;
      z-index: 999999 !important;
      background: rgba(0, 0, 0, 0.9) !important;
      color: white !important;
      padding: 8px 12px !important;
      border-radius: 6px !important;
      font-size: 14px !important;
      font-family: Arial, sans-serif !important;
      max-width: 300px !important;
      word-wrap: break-word !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateY(-5px) !important;
      transition: opacity 0.2s ease, transform 0.2s ease !important;
      display: none !important;
    `;
    
    document.body.appendChild(this.tooltip);
    // console.log('提示框元素已添加到页面');
  }

  bindEvents() {
    // console.log('绑定鼠标事件...');
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseout', this.handleMouseOut.bind(this));
    // console.log('鼠标事件绑定完成');
  }

  handleMouseOver(event) {
    const element = event.target;
    const text = this.extractText(element);
    
    // console.log('鼠标悬浮事件触发:', {
//       element: element.tagName,
//       text: text,
//       hasTranslation: !!this.getTranslation(text)

// });
    
    if (text && this.getTranslation(text)) {
      this.showTooltip(text, event);
    }
  }

  handleMouseOut(event) {
    // console.log('鼠标离开事件触发');
    this.hideTooltip();
  }

  extractText(element) {
    let text = '';
    
    // 简单文本提取
    if (element.textContent) {
      text = element.textContent.trim();
    }
    
    // 限制长度
    if (text.length > 50) {
      text = '';
    }
    
    // console.log('提取的文本:', text);
    return text;
  }

  getTranslation(text) {
    const normalizedText = text.toLowerCase().trim();
    const translation = this.translationDict[normalizedText];
    
    // console.log('查找翻译:', {
//       original: text,
//       normalized: normalizedText,
//       translation: translation

// });
    
    return translation;
  }

  showTooltip(text, event) {
    const translation = this.getTranslation(text);
    if (!translation) return;
    
    // console.log('显示提示框:', translation);
    
    this.tooltip.textContent = translation;
    this.positionTooltip(event);
    
    this.tooltip.style.display = 'block';
    requestAnimationFrame(() => {
      this.tooltip.style.opacity = '1';
      this.tooltip.style.transform = 'translateY(0)';
    });
  }

  hideTooltip() {
    if (this.tooltip) {
      // console.log('隐藏提示框');
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'translateY(-5px)';
      setTimeout(() => {
        this.tooltip.style.display = 'none';
      }, 200);
    }
  }

  positionTooltip(event) {
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX + 10;
    let top = event.clientY - tooltipRect.height - 10;

    // 边界检查
    if (left + tooltipRect.width > viewportWidth) {
      left = event.clientX - tooltipRect.width - 10;
    }
    if (top < 0) {
      top = event.clientY + 20;
    }
    if (left < 0) {
      left = 10;
    }

    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
  }
}

// 等待DOM加载完成后初始化
if (document.readyState === 'loading') {
  // console.log('等待DOM加载完成...');
  document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM加载完成，初始化调试翻译工具');
    new DebugTranslationTooltip();
  });
} else {
  // console.log('DOM已加载，直接初始化调试翻译工具');
  new DebugTranslationTooltip();
}

// // console.log('=== 调试内容脚本执行完成 ===');
















































