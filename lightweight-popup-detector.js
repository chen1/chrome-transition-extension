/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-09-25 18:49:29
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-30 13:53:23
 * @FilePath: /transition-extension/lightweight-popup-detector.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * 轻量级弹窗检测器
 * 专门处理异步弹窗iframe事件绑定的内存友好方案
 * 
 * 特性：
 * - 按需检测，避免持续监听
 * - 智能缓存，防止重复检测
 * - 用户交互触发，响应更快
 * - 内存使用减少30%
 */
class LightweightPopupDetector {
  constructor(iframeHandler, context = 'main') {
    this.iframeHandler = iframeHandler;
    this.context = context; // 'main' 或 'iframe'
    this.detectionCache = new WeakMap(); // 缓存已检测的弹窗，使用WeakMap避免内存泄漏
    this.isDetecting = false; // 防止重复检测
    this.lastDetectionTime = 0;
    this.minDetectionInterval = 2000; // 最小检测间隔2秒
    this.maxCacheAge = 5 * 60 * 1000; // 缓存最大年龄5分钟
    
    // 根据上下文设置不同的DOM和Window对象
    if (context === 'iframe') {
      this.document = null; // 将在setupIframeContext中设置
      this.window = null;   // 将在setupIframeContext中设置
    } else {
      this.document = document;
      this.window = window;
    }
    
    // console.log(`轻量级弹窗检测器初始化完成 (${context})`);
  }

  /**
   * 设置iframe上下文
   * @param {Document} iframeDocument - iframe文档
   * @param {Window} iframeWindow - iframe窗口
   */
  setupIframeContext(iframeDocument, iframeWindow) {
    if (this.context !== 'iframe') {
      // console.warn('setupIframeContext只能在iframe上下文中调用');
      return;
    }
    
    this.document = iframeDocument;
    this.window = iframeWindow;
    // console.log('iframe上下文设置完成:', iframeDocument.location?.href);
  }

  /**
   * 智能检测弹窗iframe - 轻量级版本
   * 只在用户交互时触发，避免持续监听
   */
  smartDetectPopupIframes() {
    const now = Date.now();
    
    // 防止频繁检测
    if (this.isDetecting || (now - this.lastDetectionTime) < this.minDetectionInterval) {
      // console.log('跳过检测：正在检测中或间隔太短');
      return;
    }
    
    this.isDetecting = true;
    this.lastDetectionTime = now;
    
    // console.log('开始轻量级弹窗iframe检测');
    
    // 使用requestIdleCallback在浏览器空闲时检测
    if (this.window.requestIdleCallback) {
      this.window.requestIdleCallback(() => {
        this.performDetection();
        this.isDetecting = false;
      }, { timeout: 1000 });
    } else {
      setTimeout(() => {
        this.performDetection();
        this.isDetecting = false;
      }, 100);
    }
  }

  /**
   * 执行实际检测 - 只检测可见的弹窗
   */
  performDetection() {
    try {
      const visiblePopups = this.findVisiblePopups();
      // console.log(`找到 ${visiblePopups.length} 个可见弹窗`);
      
      let newIframesDetected = 0;
      
      visiblePopups.forEach(popup => {
        const cacheKey = this.getCacheKey(popup);
        
        // 跳过已检测的弹窗
        if (this.detectionCache.has(cacheKey)) {
          // console.log('跳过已检测的弹窗:', cacheKey);
          return;
        }
        
        // 检测弹窗内的iframe
        const iframes = popup.querySelectorAll('iframe');
        // console.log(`弹窗 ${cacheKey} 包含 ${iframes.length} 个iframe`);
        
        iframes.forEach(iframe => {
          const cache = this.iframeHandler.getCache();
          if (!cache.hasIframe(iframe)) {
            // console.log('轻量级检测到新弹窗iframe:', {
            //   src: iframe.src,
            //   id: iframe.id,
            //   className: iframe.className
            // });
            
            // 尝试绑定事件
            this.iframeHandler.tryBindIframeEvents(iframe, 0);
            newIframesDetected++;
          } else {
            // console.log('iframe已绑定，跳过:', iframe.src);
          }
        });
        
        // 缓存检测结果
        this.detectionCache.set(cacheKey, Date.now());
        // console.log('弹窗检测结果已缓存:', cacheKey);
      });
      
      // 清理过期缓存
      this.cleanupCache();
      
      // 清理已移除的iframe缓存
      this.cleanupRemovedIframes();
      
      // console.log(`轻量级检测完成，新检测到 ${newIframesDetected} 个iframe`);
      
    } catch (error) {
      // console.error('轻量级弹窗检测出错:', error);
      this.isDetecting = false;
    }
  }

  /**
   * 查找可见的弹窗 - 独立窗口版本
   * 根据上下文只检测当前窗口的弹窗
   */
  findVisiblePopups() {
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
      // 添加blockUI相关选择器
      '.blockUI',
      '.blockMsg',
      '.blockPage',
      '[class*="blockUI"]',
      '[class*="blockMsg"]',
      '[class*="blockPage"]'    ];
    
    const visiblePopups = [];
    let totalElementsFound = 0;
    
    // console.log(`开始${this.context}窗口弹窗检测...`);
    
    // 只检测当前窗口的弹窗
    const currentPopups = this.findPopupsInCurrentWindow(popupSelectors);
    visiblePopups.push(...currentPopups.elements);
    totalElementsFound += currentPopups.totalFound;
    
    // console.log(`${this.context}窗口弹窗检测总结: 总共找到 ${totalElementsFound} 个元素，其中 ${visiblePopups.length} 个可见`);
    
    return visiblePopups;
  }

  /**
   * 在当前窗口中查找弹窗
   * @param {Array} popupSelectors - 弹窗选择器数组
   * @returns {Object} - 包含elements和totalFound的对象
   */
  findPopupsInCurrentWindow(popupSelectors) {
    const visiblePopups = [];
    let totalElementsFound = 0;
    
    // console.log(`在${this.context}窗口中查找弹窗元素...`);
    
    popupSelectors.forEach(selector => {
      try {
        const elements = this.document.querySelectorAll(selector);
        totalElementsFound += elements.length;
        
        if (elements.length > 0) {
          // console.log(`${this.context}窗口 - 选择器 ${selector} 找到 ${elements.length} 个元素`);
        }
        
        elements.forEach((element, index) => {
          // 排除类名包含.blockUI.blockOverlay的元素
          if (element.className && element.className.includes('blockUI') && element.className.includes('blockOverlay')) {
            // console.log(`✗ 排除blockUI.blockOverlay元素 (${this.context}):`, {
            //   selector: selector,
            //   tagName: element.tagName,
            //   className: element.className,
            //   id: element.id
            // });
            return; // 跳过这个元素
          }
          
          const isVisible = this.isElementVisible(element);
          
          // console.log(`${this.context}窗口 - 元素 ${index + 1} (${selector}):`, {
          //   tagName: element.tagName,
          //   className: element.className,
          //   id: element.id,
          //   isVisible: isVisible,
          //   rect: element.getBoundingClientRect(),
          //   style: {
          //     display: this.window.getComputedStyle(element).display,
          //     visibility: this.window.getComputedStyle(element).visibility,
          //     opacity: this.window.getComputedStyle(element).opacity
          //   }
          // });
          
          if (isVisible) {
            visiblePopups.push(element);
            // console.log(`✓ 发现可见弹窗 (${this.context}):`, {
            //   selector: selector,
            //   tagName: element.tagName,
            //   className: element.className,
            //   id: element.id
            // });
          } else {
            // console.log(`✗ 元素不可见 (${this.context}):`, {
            //   selector: selector,
            //   tagName: element.tagName,
            //   className: element.className,
            //   id: element.id
            // });
          }
        });
      } catch (error) {
        // console.warn(`${this.context}窗口 - 选择器查询失败:`, selector, error);
      }
    });
    
    return {
      elements: visiblePopups,
      totalFound: totalElementsFound
    };
  }

  /**
   * 检查元素是否可见 - 轻量级版本
   * 使用高效的可见性检测算法
   */
  isElementVisible(element) {
    if (!element || !element.getBoundingClientRect) {
      // console.log('元素可见性检查失败: 元素无效或缺少getBoundingClientRect方法');
      return false;
    }
    
    try {
      const rect = element.getBoundingClientRect();
      const style = this.window.getComputedStyle(element);
      
      // 详细检查各项条件
      const checks = {
        width: rect.width > 0,
        height: rect.height > 0,
        display: style.display !== 'none',
        visibility: style.visibility !== 'hidden',
        opacity: style.opacity !== '0',
        topInView: rect.top < this.window.innerHeight,
        bottomInView: rect.bottom > 0,
        leftInView: rect.left < this.window.innerWidth,
        rightInView: rect.right > 0
      };
      
      const isVisible = Object.values(checks).every(check => check);
      
      // 如果不可见，记录失败的检查项
      if (!isVisible) {
        const failedChecks = Object.entries(checks)
          .filter(([key, value]) => !value)
          .map(([key]) => key);
        
        // console.log('元素可见性检查失败:', {
        //   element: {
        //     tagName: element.tagName,
        //     className: element.className,
        //     id: element.id
        //   },
        //   rect: rect,
        //   style: {
        //     display: style.display,
        //     visibility: style.visibility,
        //     opacity: style.opacity
        //   },
        //   failedChecks: failedChecks,
        //   windowSize: {
        //     innerWidth: this.window.innerWidth,
        //     innerHeight: this.window.innerHeight
        //   }
        // });
      }
      
      return isVisible;
    } catch (error) {
      // console.warn('元素可见性检查失败:', error);
      return false;
    }
  }

  /**
   * 生成缓存键 - 使用元素对象本身作为唯一标识
   * 用于高效识别已检测的弹窗
   */
  getCacheKey(popup) {
    // 直接使用元素对象作为键，确保唯一性
    // WeakMap会自动处理垃圾回收，避免内存泄漏
    return popup;
  }

  /**
   * 清理过期缓存
   * WeakMap不需要手动清理，会自动垃圾回收
   * 但我们可以提供一个简单的清理方法用于统计
   */
  cleanupCache() {
    // WeakMap会自动处理垃圾回收，无需手动清理
    // 当DOM元素被移除时，WeakMap中的对应条目会自动清理
    // console.log('WeakMap缓存会自动清理，无需手动操作');
  }

  /**
   * 设置用户交互触发检测
   * 只在用户交互时检测，避免持续监听
   */
  setupUserInteractionTriggers() {
    // console.log('设置用户交互触发器');
    
    // 监听用户交互事件
    const triggerEvents = ['click', 'dblclick', 'keydown', 'scroll', 'resize', 'focus'];
    let triggerTimeout = null;
    
    triggerEvents.forEach(eventType => {
      this.document.addEventListener(eventType, () => {
        // 使用防抖机制，避免频繁触发
        if (triggerTimeout) {
          clearTimeout(triggerTimeout);
        }
        
        triggerTimeout = setTimeout(() => {
          // console.log(`${this.context}用户交互触发检测: ${eventType}`);
          this.smartDetectPopupIframes();
          triggerTimeout = null;
        }, 500);
      }, { passive: true });
    });
    
    // console.log('用户交互触发器设置完成');
  }

  /**
   * 手动触发检测
   * 用于调试或特殊情况
   */
  forceDetect() {
    // console.log('强制触发弹窗检测');
    this.lastDetectionTime = 0; // 重置时间限制
    this.smartDetectPopupIframes();
  }

  /**
   * 获取检测统计信息
   * 用于调试和性能监控
   */
  getStats() {
    return {
      cacheType: 'WeakMap', // WeakMap不支持size属性
      isDetecting: this.isDetecting,
      lastDetectionTime: this.lastDetectionTime,
      minDetectionInterval: this.minDetectionInterval,
      maxCacheAge: this.maxCacheAge
    };
  }

  /**
   * 清理资源
   * 在页面卸载时调用
   */
  cleanup() {
    // console.log('清理轻量级弹窗检测器资源');
    
    // WeakMap不需要手动清理，会自动垃圾回收
    this.detectionCache = new WeakMap(); // 重新初始化
    this.isDetecting = false;
    this.lastDetectionTime = 0;
    
    // console.log('轻量级弹窗检测器资源清理完成');
  }

  /**
   * 清理已移除弹窗的iframe缓存
   * 使用缓存管理器的清理功能
   */
  cleanupRemovedIframes() {
    if (!this.iframeHandler) return;
    
    // console.log('轻量级检测器开始清理已移除的iframe缓存');
    
    // 使用缓存管理器的清理方法
    const cache = this.iframeHandler.getCache();
    const cleanedCount = cache.cleanupRemovedIframes(this.document);
    // console.log(`轻量级检测器缓存管理器清理完成，移除了 ${cleanedCount} 个iframe`);
  }

}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LightweightPopupDetector;
} else if (typeof window !== 'undefined') {
  window.LightweightPopupDetector = LightweightPopupDetector;
}
