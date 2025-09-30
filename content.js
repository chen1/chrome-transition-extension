/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-09-25 16:55:21
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-30 18:40:51
 * @FilePath: /transition-extension/content.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
class TranslationTooltip {
  constructor() {
    this.translationDict = {};
    this.translationService = null; // 翻译服务
    this.tooltip = null;
    this.currentElement = null;
    this.hoverTimeout = null;
    this.hideTimeout = null;
    this.iframeHandler = null; // iframe处理器
    this.textSegmentTranslator = null; // 文本段翻译器
    this.displayFormatter = null; // 显示格式化器
    this.unifiedTranslationProcessor = null; // 统一翻译处理器
    
    this.init();
  }

  async init() {
    // console.log('翻译工具提示初始化开始');
    // console.log('DisplayFormatter是否可用:', typeof DisplayFormatter !== 'undefined');
    // console.log('TextSegmentTranslator是否可用:', typeof TextSegmentTranslator !== 'undefined');
    // console.log('IframeHandler是否可用:', typeof IframeHandler !== 'undefined');
    // console.log('TranslationService是否可用:', typeof TranslationService !== 'undefined');
    try {
      await this.loadTranslationDict();
      this.initTranslationService();
      this.createTooltip();
      this.initDisplayFormatter();
      this.initTextSegmentTranslator();
      this.initUnifiedTranslationProcessor();
      this.initIframeHandler();
      this.initLightweightPopupDetector();
      this.bindEvents();
      
      // 主动检测并绑定iframe事件
    //   if (this.iframeHandler) {
    //     // console.log('开始主动检测iframe...');
    //     // this.iframeHandler.detectAndBindAllIframes();
        
    //     // 延迟检测，处理动态加载的iframe（只检测一次，避免重复）
    //     this.iframeHandler.delayedDetectIframes(3000);
    //   }
      
      // console.log('翻译工具提示初始化完成');
      // console.log('最终状态检查:');
      // console.log('- translationService:', !!this.translationService);
      // console.log('- displayFormatter:', !!this.displayFormatter);
      // console.log('- textSegmentTranslator:', !!this.textSegmentTranslator);
      // console.log('- iframeHandler:', !!this.iframeHandler);
      
      // 通知后台脚本内容脚本已加载
      this.notifyBackgroundScript();
      
      // 启动定期清理机制
      this.startPeriodicCleanup();
    } catch (error) {
      // console.error('翻译工具提示初始化失败:', error);
    }
  }

  initTranslationService() {
    // console.log('初始化翻译服务');
    try {
      // 检查TranslationService是否已加载
      if (typeof TranslationService !== 'undefined') {
        this.translationService = new TranslationService();
        this.translationService.setTranslationDict(this.translationDict);
        // console.log('翻译服务初始化成功');
      } else {
        // console.warn('TranslationService未找到，将使用内置翻译方法');
      }
    } catch (error) {
      // console.error('初始化翻译服务失败:', error);
    }
  }

  initDisplayFormatter() {
    // console.log('初始化显示格式化器');
    try {
      // 检查DisplayFormatter是否已加载
      if (typeof DisplayFormatter !== 'undefined') {
        this.displayFormatter = new DisplayFormatter();
        // console.log('显示格式化器初始化成功');
      } else {
        // console.warn('DisplayFormatter未找到，将使用默认显示格式');
      }
    } catch (error) {
      // console.error('初始化显示格式化器失败:', error);
    }
  }

  initIframeHandler() {
    // console.log('初始化iframe处理器');
    try {
      // 检查IframeHandler是否已加载
      if (typeof IframeHandler !== 'undefined') {
        this.iframeHandler = new IframeHandler(this);
        // console.log('iframe处理器初始化成功');
      } else {
        // console.warn('IframeHandler未找到，iframe功能将不可用');
      }
    } catch (error) {
      // console.error('初始化iframe处理器失败:', error);
    }
  }

  initLightweightPopupDetector() {
    console.log('初始化轻量级弹窗检测器');
    try {
      // 检查LightweightPopupDetector是否已加载
      if (typeof LightweightPopupDetector !== 'undefined') {
        this.lightweightPopupDetector = new LightweightPopupDetector(this.iframeHandler);
        // 设置用户交互触发器
        this.lightweightPopupDetector.setupUserInteractionTriggers();
        
        // 暴露到全局，便于调试
        window.lightweightPopupDetector = this.lightweightPopupDetector;
        
        console.log('轻量级弹窗检测器初始化成功');
      } else {
        console.warn('LightweightPopupDetector未找到，轻量级弹窗检测功能将不可用');
      }
    } catch (error) {
      console.error('初始化轻量级弹窗检测器失败:', error);
    }
  }

  initTextSegmentTranslator() {
    // console.log('初始化文本段翻译器');
    try {
      // 检查TextSegmentTranslator是否已加载
      if (typeof TextSegmentTranslator !== 'undefined') {
        this.textSegmentTranslator = new TextSegmentTranslator();
        // 将当前翻译字典传递给文本段翻译器
        this.textSegmentTranslator.translationDict = this.translationDict;
        // console.log('文本段翻译器初始化成功，字典大小:', Object.keys(this.translationDict).length);
        // console.log('文本段翻译器字典示例:', {
//           'Initial Visit': this.textSegmentTranslator.translationDict['Initial Visit'],
//           'Follow-Up Visit': this.textSegmentTranslator.translationDict['Follow-Up Visit']

// });
      } else {
        // console.warn('TextSegmentTranslator未找到，文本段翻译功能将不可用');
      }
    } catch (error) {
      // console.error('初始化文本段翻译器失败:', error);
    }
  }

  initUnifiedTranslationProcessor() {
    // console.log('初始化统一翻译处理器');
    try {
      // 检查UnifiedTranslationProcessor是否已加载
      if (typeof UnifiedTranslationProcessor !== 'undefined') {
        this.unifiedTranslationProcessor = new UnifiedTranslationProcessor(this);
        // console.log('统一翻译处理器初始化成功');
      } else {
        // console.warn('UnifiedTranslationProcessor未找到，将使用原有翻译方法');
      }
    } catch (error) {
      // console.error('初始化统一翻译处理器失败:', error);
    }
  }

  notifyBackgroundScript() {
    try {
      chrome.runtime.sendMessage({
        type: 'CONTENT_SCRIPT_LOADED',
        url: window.location.href,
        timestamp: new Date().toISOString()
      }, (response) => {
        if (response) {
          // console.log('后台脚本响应:', response);
        }
      });
    } catch (error) {
      // console.error('无法与后台脚本通信:', error);
    }
  }

  async loadTranslationDict() {
    try {
      // console.log('开始加载翻译字典...');
      
      // 智能选择字典：如果是测试页面，使用测试字典；否则使用正式字典
      const isTestPage = window.location.href.includes('test_translate.html') || 
                        window.location.href.includes('iframe_test_translate.html') ;
      
      // 检查是否有悬浮球翻译器指定的字典
      let dictFile = 'dict/his-dict.json'; // 默认字典
      
      if (isTestPage) {
        dictFile = 'test-dict.json';
      } else if (window.floatingBallTranslator && window.floatingBallTranslator.currentDictionary) {
        // 如果悬浮球翻译器已经指定了字典，使用指定的字典
        const dictConfig = window.floatingBallTranslator.availableDictionaries.find(
          dict => dict.key === window.floatingBallTranslator.currentDictionary
        );
        if (dictConfig) {
          dictFile = dictConfig.file;
        }
      }
      
      // console.log(`检测到${isTestPage ? '测试' : '正式'}环境，使用字典: ${dictFile}`);
      
      const response = await fetch(chrome.runtime.getURL(dictFile));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.translationDict = await response.json();
      const dictSize = Object.keys(this.translationDict).length;
      // console.log(`${isTestPage ? '测试' : '正式'}翻译字典加载成功，包含 ${dictSize} 个条目`);
    } catch (error) {
      // console.error(`加载${isTestPage ? '测试' : '正式'}翻译字典失败:`, error);
      
      // 尝试加载备用字典
      try {
        const fallbackFile = isTestPage ? 'dict/his-dict.json' : 'test-dict.json';
        // console.log(`尝试加载备用字典: ${fallbackFile}`);
        const fallbackResponse = await fetch(chrome.runtime.getURL(fallbackFile));
        
        if (fallbackResponse.ok) {
          this.translationDict = await fallbackResponse.json();
          const dictSize = Object.keys(this.translationDict).length;
          // console.log(`备用字典加载成功，包含 ${dictSize} 个条目`);
          return;
        }
      } catch (fallbackError) {
        // console.error('备用字典也加载失败:', fallbackError);
      }
      
      // 最后的备用方案：使用内置字典
      this.translationDict = {
        'hello': '你好',
        'world': '世界',
        'test': '测试',
        'button': '按钮',
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
        'welcome': '欢迎',
        'thank': '谢谢',
        'username': '用户名',
        'password': '密码'
      };
      // console.log('使用内置备用翻译字典');
    }
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'translation-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      word-wrap: break-word;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      opacity: 0;
      transform: translateY(-5px);
      transition: opacity 0.2s ease, transform 0.2s ease;
      display: none;
      visibility: hidden;
    `;
    document.body.appendChild(this.tooltip);
    // console.log('Tooltip元素已创建并添加到页面');
    
    // 添加样式重置，修复pointer-events: none;问题
    this.addPointerEventsFix();
  }

  /**
   * 添加样式重置，修复pointer-events: none;问题
   * 让带有checked类名的元素能够正常响应鼠标事件
   */
  addPointerEventsFix() {
    // console.log('添加pointer-events样式重置');
    
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'translation-tooltip-pointer-events-fix';
    style.textContent = `
      /* 重置带有checked类名的元素的pointer-events样式 */
      .tab.checked,
      .tab.checked *,
      div.tab.checked,
      div.tab.checked * {
        pointer-events: auto !important;
      }
      
      /* 确保翻译工具能够正常工作 */
      .translation-tooltip-enabled .tab.checked,
      .translation-tooltip-enabled .tab.checked *,
      .translation-tooltip-enabled div.tab.checked,
      .translation-tooltip-enabled div.tab.checked * {
        pointer-events: auto !important;
      }
    `;
    
    // 添加到页面头部
    document.head.appendChild(style);
    // console.log('pointer-events样式重置已添加');
    
    // 给body添加标识类名
    document.body.classList.add('translation-tooltip-enabled');
  }

  /**
   * 公共方法：重置元素的pointer-events样式
   * 在鼠标悬浮时直接重置当前元素的pointer-events，确保能响应鼠标事件
   * 这个方法可以被主窗口和iframe共同使用
   * @param {Element} element - 要重置样式的元素
   * @param {string} context - 上下文标识，用于调试日志（'main' 或 'iframe'）
   */
  resetElementPointerEvents(element, context = 'main') {
    if (!element) return;
    
    // 验证element是否为有效的DOM元素
    if (!(element instanceof Element)) {
    //   console.log(`${context}传入的不是有效的DOM元素:`, element);
      return;
    }
    
    // console.log(`检查${context}元素的pointer-events样式:`, element);
    
    // 检查当前元素的pointer-events样式
    const computedStyle = window.getComputedStyle(element);
    const pointerEvents = computedStyle.pointerEvents;
    
    // console.log(`${context}当前元素的pointer-events值:`, pointerEvents);
    
    // 如果pointer-events是none，则重置为auto
    if (pointerEvents === 'none') {
      // console.log(`${context}检测到pointer-events: none，重置为auto`);
      element.style.setProperty('pointer-events', 'auto', 'important');
      
      // 给元素添加标识，表示已被翻译工具修改
      element.setAttribute('data-translation-tooltip-fixed', 'true');
    }
    
    // 检查父元素链，确保整个元素链都能响应鼠标事件
    let parent = element.parentElement;
    let depth = 0;
    const maxDepth = 5; // 限制检查深度，避免性能问题
    
    while (parent && depth < maxDepth) {
      const parentStyle = window.getComputedStyle(parent);
      const parentPointerEvents = parentStyle.pointerEvents;
      
      if (parentPointerEvents === 'none') {
        // console.log(`${context}父元素 ${depth + 1} 层检测到pointer-events: none，重置为auto`);
        parent.style.setProperty('pointer-events', 'auto', 'important');
        parent.setAttribute('data-translation-tooltip-fixed', 'true');
      }
      
      parent = parent.parentElement;
      depth++;
    }
  }

  /**
   * 主窗口专用的pointer-events重置方法
   * 调用公共方法，传入'main'上下文
   * @param {Element} element - 要重置样式的元素
   */
  resetPointerEventsForElement(element) {
    this.resetElementPointerEvents(element, 'main');
  }

  bindEvents() {
    // console.log('=== 绑定事件监听器 ===');
    document.addEventListener('mouseover', this.handleMouseOver.bind(this));
    document.addEventListener('mouseleave', this.handleMouseOut.bind(this));
    // document.addEventListener('scroll', this.handleScroll.bind(this));
    // console.log('事件监听器绑定完成');
    
    // 添加DOM变化监听器，动态检测新添加的iframe
    this.setupDOMObserver();
    
    // 测试事件绑定是否成功
    const testButton = document.querySelector('button');
    if (testButton) {
      // console.log('找到测试按钮:', testButton.textContent);
      // console.log('按钮位置:', testButton.getBoundingClientRect());
    } else {
      // console.log('未找到任何button元素');
    }
  }

  /**
   * 设置DOM变化监听器，动态检测新添加的iframe
   * 增强版：专门处理弹窗等异步场景
   * 使用共享的DOM监听器模块
   */
  setupDOMObserver() {
    // console.log('=== 设置增强DOM变化监听器 ===');
    
    // 创建共享DOM监听器
    this.sharedDOMObserver = new SharedDOMObserver({
      context: 'main',
      debug: true,
      onNewIframe: (newIframes, observerId) => {
        console.log('检测到新iframe，延迟绑定事件：', newIframes[0].src);
        this.scheduleIframeDetection('new-iframe');
      },
      onPopupChange: (popupChanges, observerId) => {
        console.log('检测到弹窗变化，延迟检测iframe');
        this.scheduleIframeDetection('popup-change');
      },
      onVisibilityChange: (popupChanges, observerId) => {
        console.log('检测到弹窗可见性变化，延迟检测iframe');
        this.scheduleIframeDetection('visibility-change');
      },
      onRemovedPopup: (removedIframes, observerId) => {
        console.log('检测到弹窗移除，清理相关缓存');
        // 弹窗移除时立即清理，不需要延迟
        this.cleanupRemovedPopupCache();
      }
    });

    // 创建并启动监听器
    this.domObserver = this.sharedDOMObserver.createObserver(document.body, 'main-observer');
    
    // console.log('增强DOM变化监听器设置完成');
    
    // 轻量级弹窗检测机制已通过initLightweightPopupDetector设置
  }

  /**
   * 智能调度iframe检测 - 轻量级版本
   * @param {string} reason - 检测原因
   */
  scheduleIframeDetection(reason) {
    // 使用防抖机制，避免频繁检测
    if (this._iframeDetectionTimeout) {
      clearTimeout(this._iframeDetectionTimeout);
    }
    //直接使用iframeHandler检测所有iframes
    if (this.iframeHandler) {
        // console.log('开始主动检测iframe...');
        // this.iframeHandler.detectAndBindAllIframes();
        
        // 延迟检测，处理动态加载的iframe（只检测一次，避免重复）
        this.iframeHandler.delayedDetectIframes(3000);
        return;

    }
    // 根据原因设置不同的延迟时间
    let delay = 1000;
    if (reason === 'popup-change') delay = 500;
    if (reason === 'visibility-change') delay = 200;
    
    this._iframeDetectionTimeout = setTimeout(() => {
      // 智能混合检测策略：避免重复检测
      if (this.lightweightPopupDetector && this.iframeHandler) {
        console.log(`使用智能混合检测策略: ${reason}`);
        this.smartHybridIframeDetection();
      } else if (this.lightweightPopupDetector) {
        console.log(`使用轻量级检测器处理弹窗: ${reason}`);
        this.lightweightPopupDetector.smartDetectPopupIframes();
      } else if (this.iframeHandler) {
        console.log(`使用原有方法检测所有iframe: ${reason}`);
        this.iframeHandler.detectAndBindAllIframes();
      }
      
      this._iframeDetectionTimeout = null;
    }, delay);
  }

  /**
   * 智能混合iframe检测策略
   * 避免重复检测，分别处理弹窗内和页面中的iframe
   */
  smartHybridIframeDetection() {
    console.log('=== 开始智能混合iframe检测 ===');
    
    // 1. 首先使用轻量级检测器处理弹窗内的iframe
    console.log('步骤1: 检测弹窗内iframe');
    this.lightweightPopupDetector.smartDetectPopupIframes();
    
    // 2. 然后检测页面中非弹窗区域的iframe
    console.log('步骤2: 检测非弹窗区域iframe');
    this.detectNonPopupIframes(); //非弹窗iframe检测通过
    
    
    console.log('=== 智能混合iframe检测完成 ===');
  }

  /**
   * 检测非弹窗区域的iframe
   * 只处理不在弹窗内的iframe，避免重复检测
   */
  detectNonPopupIframes() {
    const allIframes = document.querySelectorAll('iframe');
    console.log(`页面中总共找到 ${allIframes.length} 个iframe`);
    
    let nonPopupIframes = 0;
    let alreadyBoundIframes = 0;
    
    allIframes.forEach((iframe, index) => {
      // 检查是否已经绑定过
      const cache = this.iframeHandler.getCache();
      if (cache.hasIframe(iframe)) {
        alreadyBoundIframes++;
        console.log(`iframe ${index + 1} 已绑定，跳过:`, iframe.src);
        return;
      }
      
      // 检查是否在弹窗内
      if (this.isIframeInPopup(iframe)) {
        console.log(`iframe ${index + 1} 在弹窗内，跳过:`, iframe.src);
        return;
      }
      
      // 处理非弹窗区域的iframe
      console.log(`检测非弹窗区域iframe ${index + 1}:`, {
        src: iframe.src,
        id: iframe.id,
        className: iframe.className
      });
      
      // 为iframe添加src变化监听器
      this.iframeHandler.addIframeSrcChangeListener(iframe);
      
      // 尝试绑定事件
      this.iframeHandler.tryBindIframeEvents(iframe, 0);
      nonPopupIframes++;
    });
    
    console.log(`非弹窗区域iframe检测完成: 新检测 ${nonPopupIframes} 个，已绑定 ${alreadyBoundIframes} 个`);
  }

  /**
   * 检查iframe是否在弹窗内
   * @param {Element} iframe - iframe元素
   * @returns {boolean} - 是否在弹窗内
   */
  isIframeInPopup(iframe) {
    // 获取弹窗选择器（与轻量级检测器保持一致）
    const popupSelectors = [
      '[role="dialog"]',
      '[role="modal"]', 
      '[role="alertdialog"]',
      '.modal',
      '.popup',
      '.dialog',
      '.overlay',
      '.lightbox',
      '[data-modal]',
      '[data-popup]',
      '[data-dialog]',
      '.modal-dialog',
      '.popup-container',
      '.dialog-container',
      '.blockUI',
      '.blockMsg',
      '.blockPage',
      '[class*="blockUI"]',
      '[class*="blockMsg"]',
      '[class*="blockPage"]'
    ];
    
    // 检查iframe的父元素链中是否有弹窗元素
    let currentElement = iframe.parentElement;
    while (currentElement && currentElement !== document.body) {
      // 检查当前元素是否为弹窗
      for (const selector of popupSelectors) {
        if (currentElement.matches && currentElement.matches(selector)) {
          // 排除blockUI.blockOverlay元素
          if (currentElement.className && 
              currentElement.className.includes('blockUI') && 
              currentElement.className.includes('blockOverlay')) {
            continue;
          }
          
          // 检查弹窗是否可见
          if (this.isElementVisible(currentElement)) {
            return true;
          }
        }
      }
      currentElement = currentElement.parentElement;
    }
    
    return false;
  }

  /**
   * 检查元素是否可见
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否可见
   */
  isElementVisible(element) {
    if (!element || !element.getBoundingClientRect) {
      return false;
    }
    
    try {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      
      return rect.width > 0 && 
             rect.height > 0 && 
             style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             style.opacity !== '0' &&
             rect.top < window.innerHeight &&
             rect.bottom > 0 &&
             rect.left < window.innerWidth &&
             rect.right > 0;
    } catch (error) {
      return false;
    }
  }


  /**
   * 清理被移除弹窗内的iframe缓存
   * 使用iframe缓存管理器的弹窗清理功能
   * @param {Element} removedPopup - 被移除的弹窗元素
   */
  cleanupIframesInRemovedPopup(removedPopup) {
    if (!this.iframeHandler || !removedPopup) return;
    
    // console.log('开始清理被移除弹窗内的iframe缓存:', {
    //   tagName: removedPopup.tagName,
    //   className: removedPopup.className,
    //   id: removedPopup.id
    // });
    
    // 使用缓存管理器的弹窗清理方法
    const cache = this.iframeHandler.getCache();
    const cleanedCount = cache.cleanupIframesInPopup(removedPopup);
    console.log(`缓存管理器弹窗清理完成，移除了 ${cleanedCount} 个iframe`);
  }

  /**
   * 清理单个iframe的缓存
   * @param {Element} iframe - iframe元素
   */
  cleanupIframeCache(iframe) {
    if (!this.iframeHandler || !iframe) return;
    
    const cache = this.iframeHandler.getCache();
    const isInCache = cache.hasIframe(iframe);
    
    // console.log('清理iframe缓存:', {
    //   src: iframe.src,
    //   id: iframe.id,
    //   isInCache: isInCache
    // });
    
    // 如果iframe在缓存中，清理它
    if (isInCache) {
    //   console.log('从缓存中移除iframe');
      this.iframeHandler.cleanupIframeEvents(iframe);
    }
  }

  /**
   * 清理被移除弹窗的缓存
   * 使用iframe缓存管理器的清理功能
   */
  cleanupRemovedPopupCache() {
    if (!this.iframeHandler) return;
    
    // console.log('开始清理被移除弹窗的缓存');
    
    // 使用缓存管理器的清理方法
    const cache = this.iframeHandler.getCache();
    const cleanedCount = cache.cleanupRemovedIframes();
    // console.log(`缓存管理器清理完成，移除了 ${cleanedCount} 个iframe`);
  }

  /**
   * 启动定期清理机制
   * 使用iframe缓存管理器的定期清理功能
   */
  startPeriodicCleanup() {
    // console.log('启动定期清理机制');
    
    // 使用缓存管理器的定期清理机制
    const cache = this.iframeHandler.getCache();
    cache.startPeriodicCleanup();
    // console.log('使用iframe缓存管理器的定期清理机制');
  }

  /**
   * 停止定期清理机制
   * 使用iframe缓存管理器的停止清理功能
   */
  stopPeriodicCleanup() {
    // 使用缓存管理器的停止清理机制
    const cache = this.iframeHandler.getCache();
    cache.stopPeriodicCleanup();
    console.log('使用iframe缓存管理器的停止清理机制');
  }

  handleMouseOver(event) {
    let element = event.target;
    
    // 如果target不是Element（比如是文本节点），则获取其父元素
    if (element && !(element instanceof Element)) {
      element = element.parentElement;
    }
    
    // 如果仍然没有有效的元素，则跳过处理
    if (!element || !(element instanceof Element)) {
      return;
    }
    
    // console.log('=== 鼠标悬停事件触发 ===');
    // console.log('目标元素:', element);
    // console.log('元素标签:', element.tagName);
    // console.log('元素文本:', element.textContent?.trim());
    // console.log('元素类名:', element.className);
    // console.log('事件坐标:', { x: event.clientX, y: event.clientY });
    // console.log('文本段翻译器是否存在:', !!this.textSegmentTranslator);
    // console.log('显示格式化器是否存在:', !!this.displayFormatter);
    
    // 动态重置pointer-events样式，确保元素能响应鼠标事件
    this.resetPointerEventsForElement(element);
    
    // 检查是否为iframe元素
    // if (this.iframeHandler && this.iframeHandler.isIframe(element)) {
    //   // console.log('检测到iframe元素，使用iframe处理器处理');
    //   this.iframeHandler.handleIframeElement(element, event);
    //   return;
    // }
    
    // 检查是否在iframe内部 - 如果当前元素在iframe内，不处理主窗口的事件
    if (this.iframeHandler && this.iframeHandler.isInsideIframe(element)) {
      // console.log('元素在iframe内部，跳过主窗口处理');
      return;
    }
    
    // 查找最底层的文本元素
    const deepestTextElement = this.unifiedTranslationProcessor ? 
      this.unifiedTranslationProcessor.findDeepestTextElement(element) : null;
    // console.log('最底层文本元素:', deepestTextElement);
    
    // 清除之前的定时器
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // 延迟显示tooltip，避免快速移动时频繁触发
    this.hoverTimeout = setTimeout(() => {
      // console.log('延迟触发showTooltip');
      this.showTooltip(deepestTextElement || element, event);
    }, 300);
  }

  handleMouseOut(event) {
    // 清除显示定时器
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    // 延迟隐藏tooltip
    this.hideTimeout = setTimeout(() => {
      this.hideTooltip(event);
    }, 200);
  }

  handleScroll() {
    this.hideTooltip();
  }





  showTooltip(element, event) {
    // console.log('=== showTooltip 开始执行 ===');
    // console.log('目标元素:', element);
    // console.log('元素文本内容:', element.textContent);
    // console.log('统一翻译处理器是否存在:', !!this.unifiedTranslationProcessor);
    
    // 优先使用统一翻译处理器
    if (this.unifiedTranslationProcessor) {
      const translationResult = this.unifiedTranslationProcessor.processElementTranslation(
        element, 
        event, 
        { context: 'main' }
      );
      
      if (translationResult) {
        this.unifiedTranslationProcessor.displayTranslationResult(translationResult);
        return;
      }
      // console.log('统一翻译处理器没有结果，使用降级方法');
    }
  }

  hideTooltip(event) {
    if (this.tooltip) {
      // console.log('隐藏tooltip');
      this.tooltip.style.opacity = '0';
      this.tooltip.style.transform = 'translateY(-5px)';
      setTimeout(() => {
        this.tooltip.style.display = 'none';
        this.tooltip.style.visibility = 'hidden';
        // console.log('Tooltip已完全隐藏');
      }, 200);
    }
    this.currentElement = null;
  }

  getTranslation(text, element = null) {
    // 优先使用翻译服务
    if (this.translationService) {
      return this.translationService.getTranslation(text, {}, element);
    }
    
    // 降级到内置翻译方法
    // console.log('使用内置翻译方法');
    return this.getTranslationFallback(text);
  }

  /**
   * 内置翻译方法（降级方案）
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  getTranslationFallback(text) {
    // 原始文本匹配
    if (this.translationDict[text]) {
      return this.translationDict[text];
    }
    
    // 去掉首尾空格的文本匹配
    const trimmedText = text.trim();
    if (this.translationDict[trimmedText]) {
      return this.translationDict[trimmedText];
    }
    
    // 小写匹配（原始文本）
    const normalizedText = text.toLowerCase();
    if (this.translationDict[normalizedText]) {
      return this.translationDict[normalizedText];
    }
    
    // 小写匹配（去掉首尾空格）
    const normalizedTrimmedText = trimmedText.toLowerCase();
    if (this.translationDict[normalizedTrimmedText]) {
      return this.translationDict[normalizedTrimmedText];
    }

    return null;
  }

  /**
   * 更新翻译字典
   * @param {Object} newDict - 新的翻译字典
   */
  updateTranslationDict(newDict) {
    console.log('更新content.js翻译字典，新字典条目数:', Object.keys(newDict).length);
    
    // 更新主字典
    this.translationDict = newDict;
    
    // 更新翻译服务的字典
    if (this.translationService) {
      this.translationService.setTranslationDict(newDict);
    }
    
    // 更新文本段翻译器的字典
    if (this.textSegmentTranslator) {
      this.textSegmentTranslator.translationDict = newDict;
    }
    
    // 更新统一翻译处理器的字典（通过translationTooltip引用）
    if (this.unifiedTranslationProcessor) {
      // 统一翻译处理器会通过this.translationTooltip获取字典，所以不需要单独设置
      console.log('统一翻译处理器字典已通过translationTooltip更新');
    }
    
    console.log('content.js翻译字典更新完成');
  }

  positionTooltip(event) {
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX + 10;
    let top = event.clientY - tooltipRect.height - 10;

    // 防止tooltip超出右边界
    if (left + tooltipRect.width > viewportWidth) {
      left = event.clientX - tooltipRect.width - 10;
    }

    // 防止tooltip超出上边界
    if (top < 0) {
      top = event.clientY + 20;
    }

    // 防止tooltip超出下边界
    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - 10;
    }

    // 防止tooltip超出左边界
    if (left < 0) {
      left = 10;
    }

    this.tooltip.style.left = left + 'px';
    this.tooltip.style.top = top + 'px';
  }
}

// 确保页面加载完成后初始化
// // console.log('=== 文本翻译内容脚本开始执行 - 版本2.0 ===');
// // console.log('当前页面状态:', document.readyState);
// // console.log('当前页面URL:', window.location.href);
// // console.log('Chrome API可用性:', typeof chrome !== 'undefined' ? '可用' : '不可用');

// 添加更详细的调试信息
// // console.log('页面标题:', document.title);
// // console.log('页面协议:', window.location.protocol);
// // console.log('当前时间:', new Date().toISOString());

if (document.readyState === 'loading') {
  // console.log('等待DOM加载完成...');
  document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM加载完成，初始化翻译工具');
    // console.log('页面元素数量:', document.querySelectorAll('*').length);
    // console.log('Button元素数量:', document.querySelectorAll('button').length);
    window.translationTooltip = new TranslationTooltip();
  });
} else {
  // console.log('DOM已加载，直接初始化翻译工具');
  // console.log('页面元素数量:', document.querySelectorAll('*').length);
  // console.log('Button元素数量:', document.querySelectorAll('button').length);
  window.translationTooltip = new TranslationTooltip();
}

