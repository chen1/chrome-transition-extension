/**
 * 共享DOM监听器模块
 * 提取content.js和iframe-handler.js中MutationObserver的公共逻辑
 * 提供统一的DOM变化监听和iframe检测功能
 */
class SharedDOMObserver {
  constructor(options = {}) {
    this.options = {
      // 监听配置
      observeConfig: {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'hidden', 'aria-hidden', 'src'],
        attributeOldValue: true
      },
      // 回调函数
      onNewIframe: null,
      onPopupChange: null,
      onVisibilityChange: null,
      onRemovedPopup: null,
      onIframeSrcChange: null,
      onSignificantChange: null,
      // 上下文标识
      context: 'main', // 'main' | 'iframe'
      // 调试模式
      debug: false,
      ...options
    };
    
    this.observers = new Map(); // 存储多个observer实例
    this.iframeDetectionTimeout = null; // 防抖定时器
  }

  /**
   * 创建并启动DOM监听器
   * @param {Element} targetElement - 要监听的目标元素
   * @param {string} observerId - 监听器唯一标识
   * @returns {MutationObserver} - 创建的监听器实例
   */
  createObserver(targetElement, observerId = 'default') {
    if (this.observers.has(observerId)) {
      // console.warn(`Observer ${observerId} 已存在，先断开旧连接`);
      this.disconnectObserver(observerId);
    }

    const observer = new MutationObserver((mutations) => {
      this.handleMutations(mutations, observerId);
    });

    // 开始观察
    observer.observe(targetElement, this.options.observeConfig);
    this.observers.set(observerId, observer);

    // this.log(`DOM监听器 ${observerId} 已创建并启动`, {
    //   target: targetElement.tagName,
    //   config: this.options.observeConfig
    // });

    return observer;
  }

  /**
   * 处理DOM变化
   * @param {Array} mutations - 变化列表
   * @param {string} observerId - 监听器标识
   */
  handleMutations(mutations, observerId) {
    const changes = this.analyzeMutations(mutations);
    
    // this.log(`DOM变化分析完成 (${observerId}):`, changes);

    // 处理各种变化类型
    this.processChanges(changes, observerId);
  }

  /**
   * 分析DOM变化
   * @param {Array} mutations - 变化列表
   * @returns {Object} - 变化分析结果
   */
  analyzeMutations(mutations) {
    const changes = {
      hasNewIframe: false,
      hasPopupChange: false,
      hasVisibilityChange: false,
      hasRemovedPopup: false,
      hasSignificantChange: false,
      hasIframeSrcChange: false,
      newIframes: [],
      removedIframes: [],
      popupChanges: [],
      srcChanges: []
    };

    mutations.forEach((mutation) => {
      // 处理新增节点
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.analyzeAddedNode(node, changes);
          }
        });
      }

      // 处理移除节点
      if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.analyzeRemovedNode(node, changes);
          }
        });
      }

      // 处理属性变化
      if (mutation.type === 'attributes') {
        this.analyzeAttributeChange(mutation, changes);
      }
    });

    return changes;
  }

  /**
   * 分析新增节点
   * @param {Element} node - 新增的节点
   * @param {Object} changes - 变化对象
   */
  analyzeAddedNode(node, changes) {
    // 检查新增的节点是否是iframe
    if (node.tagName === 'IFRAME') {
      // this.log('检测到新添加的iframe:', {
      //   id: node.id,
      //   src: node.src,
      //   className: node.className,
      //   parentElement: node.parentElement?.tagName
      // });
      changes.hasNewIframe = true;
      changes.newIframes.push(node);
    }

    // 检查新增的节点内部是否包含iframe
    const iframes = node.querySelectorAll && node.querySelectorAll('iframe');
    if (iframes && iframes.length > 0) {
      // this.log(`检测到包含 ${iframes.length} 个iframe的新节点`);
      changes.hasNewIframe = true;
      changes.newIframes.push(...Array.from(iframes));
    }

    // 检测弹窗相关的变化
    if (this.isPopupElement(node)) {
      // this.log('检测到弹窗元素:', {
      //   tagName: node.tagName,
      //   className: node.className,
      //   id: node.id,
      //   hasIframe: node.querySelectorAll('iframe').length > 0
      // });
      changes.hasPopupChange = true;
      changes.popupChanges.push({ type: 'added', element: node });
    }

    // 检查是否有重要的内容变化（用于iframe内部重新绑定事件）
    if (this.options.context === 'iframe') {
      const interactiveElements = node.querySelectorAll ? 
        node.querySelectorAll('button, a, span, div, p, li, td, th, input, textarea, select') : [];
      if (interactiveElements.length > 0) {
        changes.hasSignificantChange = true;
      }
    }
  }

  /**
   * 分析移除节点
   * @param {Element} node - 移除的节点
   * @param {Object} changes - 变化对象
   */
  analyzeRemovedNode(node, changes) {
    // 检查移除的节点是否是弹窗元素
    if (this.isPopupElement(node)) {
      // this.log('检测到弹窗元素被移除:', {
      //   tagName: node.tagName,
      //   className: node.className,
      //   id: node.id,
      //   hasIframe: node.querySelectorAll('iframe').length > 0
      // });
      changes.hasRemovedPopup = true;
      changes.popupChanges.push({ type: 'removed', element: node });
    }

    // 检查移除的节点内部是否包含iframe
    const iframes = node.querySelectorAll && node.querySelectorAll('iframe');
    if (iframes && iframes.length > 0) {
      // this.log(`检测到包含 ${iframes.length} 个iframe的节点被移除`);
      changes.hasRemovedPopup = true;
      changes.removedIframes.push(...Array.from(iframes));
    }
  }

  /**
   * 分析属性变化
   * @param {MutationRecord} mutation - 属性变化记录
   * @param {Object} changes - 变化对象
   */
  analyzeAttributeChange(mutation, changes) {
    const target = mutation.target;
    const attributeName = mutation.attributeName;

    // 检查iframe的src属性变化
    if (target.tagName === 'IFRAME' && attributeName === 'src') {
      const oldSrc = mutation.oldValue || 'unknown';
      const newSrc = target.src;
      // this.log('检测到iframe src变化:', oldSrc, '->', newSrc);
      changes.hasIframeSrcChange = true;
      changes.srcChanges.push({
        iframe: target,
        oldSrc: oldSrc,
        newSrc: newSrc
      });
    }

    // 检查弹窗的显示/隐藏属性变化
    if (this.isPopupElement(target)) {
      if (['style', 'class', 'hidden', 'aria-hidden'].includes(attributeName)) {
        // this.log('检测到弹窗属性变化:', {
        //   element: target.tagName,
        //   attribute: attributeName,
        //   newValue: target.getAttribute(attributeName),
        //   hasIframe: target.querySelectorAll('iframe').length > 0
        // });
        changes.hasVisibilityChange = true;
        changes.popupChanges.push({ 
          type: 'attribute', 
          element: target, 
          attribute: attributeName 
        });
      }
    }
  }

  /**
   * 处理检测到的变化
   * @param {Object} changes - 变化分析结果
   * @param {string} observerId - 监听器标识
   */
  processChanges(changes, observerId) {
    // 处理新iframe
    if (changes.hasNewIframe && this.options.onNewIframe) {
      this.scheduleCallback(() => {
        this.options.onNewIframe(changes.newIframes, observerId);
      }, 'new-iframe');
    }

    // 处理弹窗变化
    if (changes.hasPopupChange && this.options.onPopupChange) {
      this.scheduleCallback(() => {
        this.options.onPopupChange(changes.popupChanges, observerId);
      }, 'popup-change');
    }

    // 处理可见性变化
    if (changes.hasVisibilityChange && this.options.onVisibilityChange) {
      this.scheduleCallback(() => {
        this.options.onVisibilityChange(changes.popupChanges, observerId);
      }, 'visibility-change');
    }

    // 处理移除的弹窗
    if (changes.hasRemovedPopup && this.options.onRemovedPopup) {
      // 弹窗移除时立即处理，不需要延迟
      this.options.onRemovedPopup(changes.removedIframes, observerId);
    }

    // 处理iframe src变化
    if (changes.hasIframeSrcChange && this.options.onIframeSrcChange) {
      changes.srcChanges.forEach(srcChange => {
        this.options.onIframeSrcChange(srcChange, observerId);
      });
    }

    // 处理重要变化（用于iframe内部重新绑定事件）
    if (changes.hasSignificantChange && this.options.onSignificantChange) {
      this.options.onSignificantChange(observerId);
    }
  }

  /**
   * 智能调度回调函数（防抖机制）
   * @param {Function} callback - 回调函数
   * @param {string} reason - 调度原因
   */
  scheduleCallback(callback, reason) {
    // 使用防抖机制，避免频繁调用
    if (this.iframeDetectionTimeout) {
      clearTimeout(this.iframeDetectionTimeout);
    }

    // 根据原因设置不同的延迟时间
    let delay = 1000;
    if (reason === 'popup-change') delay = 500;
    if (reason === 'visibility-change') delay = 200;
    if (reason === 'new-iframe') delay = 300;

    this.iframeDetectionTimeout = setTimeout(() => {
      callback();
      this.iframeDetectionTimeout = null;
    }, delay);
  }

  /**
   * 检查元素是否为弹窗元素
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否为弹窗元素
   */
  isPopupElement(element) {
    if (!element || !element.tagName) return false;

    const tagName = element.tagName.toLowerCase();
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();

    // 检查标签名
    const popupTags = ['dialog', 'modal', 'popup', 'overlay'];
    if (popupTags.includes(tagName)) return true;

    // 检查类名
    const popupClasses = ['modal', 'popup', 'dialog', 'overlay', 'lightbox'];
    if (popupClasses.some(cls => className.includes(cls))) return true;

    // 检查ID
    const popupIds = ['modal', 'popup', 'dialog', 'overlay'];
    if (popupIds.some(popupId => id.includes(popupId))) return true;

    // 检查ARIA角色
    const role = element.getAttribute('role');
    if (role && ['dialog', 'modal', 'alertdialog'].includes(role)) return true;

    // 检查data属性
    const dataModal = element.getAttribute('data-modal');
    const dataPopup = element.getAttribute('data-popup');
    if (dataModal || dataPopup) return true;

    return false;
  }

  /**
   * 断开指定监听器
   * @param {string} observerId - 监听器标识
   */
  disconnectObserver(observerId) {
    const observer = this.observers.get(observerId);
    if (observer) {
      observer.disconnect();
      this.observers.delete(observerId);
      // this.log(`DOM监听器 ${observerId} 已断开`);
    }
  }

  /**
   * 断开所有监听器
   */
  disconnectAll() {
    this.observers.forEach((observer, observerId) => {
      observer.disconnect();
      // this.log(`DOM监听器 ${observerId} 已断开`);
    });
    this.observers.clear();

    // 清理定时器
    if (this.iframeDetectionTimeout) {
      clearTimeout(this.iframeDetectionTimeout);
      this.iframeDetectionTimeout = null;
    }
  }

  /**
   * 获取监听器状态
   * @returns {Object} - 状态信息
   */
  getStatus() {
    return {
      observerCount: this.observers.size,
      observerIds: Array.from(this.observers.keys()),
      hasTimeout: !!this.iframeDetectionTimeout,
      context: this.options.context,
      debug: this.options.debug
    };
  }

  /**
   * 日志输出
   * @param {string} message - 日志消息
   * @param {*} data - 附加数据
   */
  log(message, data = null) {
    if (this.options.debug) {
      // console.log(`[SharedDOMObserver:${this.options.context}] ${message}`, data);
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedDOMObserver;
} else if (typeof window !== 'undefined') {
  window.SharedDOMObserver = SharedDOMObserver;
}
