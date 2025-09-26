/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-01-27 10:00:00
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-26 18:26:37
 * @FilePath: /transition-extension/iframe-context-menu-proxy.js
 * @Description: iframe右键菜单代理 - 主窗口代理实现
 */

/**
 * iframe右键菜单代理管理器
 * 负责在iframe中绑定右键事件，通过主窗口显示右键菜单
 */
class IframeContextMenuProxy {
  constructor(iframeElement, iframeDocument, iframeWindow, mainContextMenuTranslator) {
    this.iframeElement = iframeElement;
    this.iframeDocument = iframeDocument;
    this.iframeWindow = iframeWindow;
    this.mainContextMenuTranslator = mainContextMenuTranslator;
    this.isEnabled = false;
    this.contextMenuHandler = null;
    
    console.log('IframeContextMenuProxy 初始化:', {
      iframeSrc: iframeElement.src,
      iframeId: iframeElement.id,
      hasMainContextMenu: !!mainContextMenuTranslator
    });
  }

  /**
   * 初始化iframe右键菜单代理
   */
  init() {
    if (!this.mainContextMenuTranslator) {
      console.warn('主窗口右键菜单翻译器不存在，无法初始化iframe代理');
      return false;
    }

    try {
      this.setupIframeContextMenu();
      this.isEnabled = true;
      console.log('iframe右键菜单代理初始化成功');
      return true;
    } catch (error) {
      console.error('iframe右键菜单代理初始化失败:', error);
      return false;
    }
  }

  /**
   * 设置iframe内的右键菜单事件
   */
  setupIframeContextMenu() {
    console.log('设置iframe内右键菜单事件');

    // 创建右键事件处理器
    this.contextMenuHandler = (e) => {
      this.handleIframeContextMenu(e);
    };

    // 在iframe的document上绑定右键事件
    this.iframeDocument.addEventListener('contextmenu', this.contextMenuHandler, true);
    
    console.log('iframe右键事件绑定完成');
  }

  /**
   * 处理iframe内的右键事件
   * @param {Event} event - iframe内的右键事件
   */
  handleIframeContextMenu(event) {
    console.log('=== iframe内右键事件触发 ===');
    console.log('目标元素:', event.target);
    console.log('元素标签:', event.target.tagName);
    console.log('元素文本:', event.target.textContent?.trim());

    // 阻止iframe内的默认右键菜单
    event.preventDefault();
    event.stopPropagation();

    // 检查是否点击在翻译工具tip上
    if (event.target.closest('.translation-tooltip')) {
      console.log('点击在翻译工具tip上，跳过');
      return;
    }

    // 计算iframe内元素在主窗口中的位置
    const iframeRect = this.iframeElement.getBoundingClientRect();
    const elementRect = event.target.getBoundingClientRect();
    
    // 创建模拟事件对象，用于在主窗口显示右键菜单
    const simulatedEvent = {
      clientX: iframeRect.left + elementRect.left + elementRect.width / 2,
      clientY: iframeRect.top + elementRect.top + elementRect.height / 2,
      target: event.target,
      originalEvent: event,
      iframeElement: this.iframeElement,
      iframeDocument: this.iframeDocument,
      iframeWindow: this.iframeWindow
    };

    console.log('模拟事件位置:', {
      clientX: simulatedEvent.clientX,
      clientY: simulatedEvent.clientY,
      iframeRect: iframeRect,
      elementRect: elementRect
    });

    // 在主窗口显示右键菜单
    this.showMainContextMenu(simulatedEvent);
  }

  /**
   * 在主窗口显示右键菜单
   * @param {Object} simulatedEvent - 模拟的事件对象
   */
  showMainContextMenu(simulatedEvent) {
    console.log('在主窗口显示右键菜单');

    if (!this.mainContextMenuTranslator || !this.mainContextMenuTranslator.contextMenu) {
      console.warn('主窗口右键菜单不存在');
      return;
    }

    try {
      // 更新菜单项状态
      this.mainContextMenuTranslator.updateMenuItems();
      
      // 显示菜单
      this.mainContextMenuTranslator.contextMenu.style.display = 'block';
      
      // 计算菜单位置
      const menuRect = this.mainContextMenuTranslator.contextMenu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let left = simulatedEvent.clientX;
      let top = simulatedEvent.clientY;
      
      // 防止菜单超出右边界
      if (left + menuRect.width > viewportWidth) {
        left = simulatedEvent.clientX - menuRect.width;
      }
      
      // 防止菜单超出下边界
      if (top + menuRect.height > viewportHeight) {
        top = simulatedEvent.clientY - menuRect.height;
      }
      
      // 防止菜单超出左边界
      if (left < 0) {
        left = 10;
      }
      
      // 防止菜单超出上边界
      if (top < 0) {
        top = 10;
      }
      
      this.mainContextMenuTranslator.contextMenu.style.left = left + 'px';
      this.mainContextMenuTranslator.contextMenu.style.top = top + 'px';
      
      // 添加iframe标识样式
      this.mainContextMenuTranslator.contextMenu.style.border = '2px solid #4CAF50';
      this.mainContextMenuTranslator.contextMenu.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
      
      console.log('iframe右键菜单位置:', { left, top });
      
      // 存储当前iframe上下文，供菜单项使用
      this.mainContextMenuTranslator.currentIframeContext = {
        iframeElement: this.iframeElement,
        iframeDocument: this.iframeDocument,
        iframeWindow: this.iframeWindow,
        targetElement: simulatedEvent.target
      };
      
    } catch (error) {
      console.error('显示主窗口右键菜单失败:', error);
    }
  }

  /**
   * 销毁iframe右键菜单代理
   */
  destroy() {
    console.log('销毁iframe右键菜单代理');

    if (this.contextMenuHandler) {
      this.iframeDocument.removeEventListener('contextmenu', this.contextMenuHandler, true);
      this.contextMenuHandler = null;
    }

    this.isEnabled = false;
    console.log('iframe右键菜单代理已销毁');
  }

  /**
   * 获取代理状态
   * @returns {Object} - 代理状态信息
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      iframeSrc: this.iframeElement.src,
      iframeId: this.iframeElement.id,
      hasMainContextMenu: !!this.mainContextMenuTranslator,
      hasContextMenuHandler: !!this.contextMenuHandler
    };
  }
}

/**
 * 嵌套iframe右键菜单管理器
 * 负责管理所有iframe的右键菜单代理
 */
class NestedIframeContextMenuManager {
  constructor(mainContextMenuTranslator) {
    this.mainContextMenuTranslator = mainContextMenuTranslator;
    this.iframeProxies = new Map(); // 存储iframe代理实例
    this.nestedLevels = new Map(); // 记录iframe的嵌套层级
    this.isEnabled = false;
    
    // 动态检测相关属性
    this.detectionInterval = null; // 检测定时器
    this.detectionIntervalMs = 30000; // 检测间隔30秒
    this.isDetectionEnabled = true; // 是否启用动态检测
    this.lastIframeCount = 0; // 上次检测到的iframe数量
    this.detectedIframes = new Set(); // 已检测到的iframe集合
    
    console.log('NestedIframeContextMenuManager 初始化完成');
  }

  /**
   * 启用嵌套iframe右键菜单管理
   */
  enable() {
    if (this.isEnabled) {
      console.log('嵌套iframe右键菜单管理已启用');
      return;
    }

    this.isEnabled = true;
    
    // 启动动态检测
    this.startDynamicDetection();
    
    console.log('启用嵌套iframe右键菜单管理');
  }

  /**
   * 禁用嵌套iframe右键菜单管理
   */
  disable() {
    if (!this.isEnabled) {
      console.log('嵌套iframe右键菜单管理已禁用');
      return;
    }

    this.isEnabled = false;
    
    // 停止动态检测
    this.stopDynamicDetection();
    
    // 销毁所有iframe代理
    this.iframeProxies.forEach(proxy => {
      proxy.destroy();
    });
    this.iframeProxies.clear();
    this.nestedLevels.clear();
    this.detectedIframes.clear();
    
    console.log('嵌套iframe右键菜单管理已禁用');
  }

  /**
   * 为指定iframe创建右键菜单代理
   * @param {Element} iframeElement - iframe元素
   * @param {Document} iframeDocument - iframe文档
   * @param {Window} iframeWindow - iframe窗口
   * @param {number} level - 嵌套层级
   * @returns {boolean} - 是否成功创建
   */
  createIframeContextMenuProxy(iframeElement, iframeDocument, iframeWindow, level = 0) {
    console.log('为iframe创建右键菜单代理:', {
      src: iframeElement.src,
      id: iframeElement.id,
      level: level
    });

    // 检查是否已经存在代理
    if (this.iframeProxies.has(iframeElement)) {
      console.log('iframe代理已存在，跳过创建');
      return true;
    }

    try {
      // 创建iframe右键菜单代理
      const proxy = new IframeContextMenuProxy(
        iframeElement,
        iframeDocument,
        iframeWindow,
        this.mainContextMenuTranslator
      );

      // 初始化代理
      const success = proxy.init();
      if (success) {
        this.iframeProxies.set(iframeElement, proxy);
        this.nestedLevels.set(iframeElement, level);
        console.log('iframe右键菜单代理创建成功');
        return true;
      } else {
        console.warn('iframe右键菜单代理初始化失败');
        return false;
      }
    } catch (error) {
      console.error('创建iframe右键菜单代理失败:', error);
      return false;
    }
  }

  /**
   * 递归检测所有层级的iframe并创建右键菜单代理
   * @param {Document} rootDocument - 根文档
   * @param {number} level - 当前嵌套层级
   */
  detectAllNestedIframes(rootDocument = document, level = 0) {
    console.log(`检测第 ${level} 层iframe`);

    const iframes = rootDocument.querySelectorAll('iframe');
    console.log(`第 ${level} 层找到 ${iframes.length} 个iframe`);

    iframes.forEach((iframe, index) => {
      try {
        const iframeDocument = iframe.contentDocument;
        const iframeWindow = iframe.contentWindow;

        if (iframeDocument && iframeWindow) {
          console.log(`处理第 ${level} 层iframe ${index + 1}:`, {
            src: iframe.src,
            id: iframe.id,
            className: iframe.className
          });

          // 为当前iframe创建右键菜单代理
          this.createIframeContextMenuProxy(iframe, iframeDocument, iframeWindow, level);

          // 递归检测嵌套的iframe
          this.detectAllNestedIframes(iframeDocument, level + 1);
        } else {
          console.log(`第 ${level} 层iframe ${index + 1} 无法访问内容:`, {
            src: iframe.src,
            id: iframe.id,
            reason: '跨域限制或未加载完成'
          });
        }
      } catch (error) {
        console.warn(`处理第 ${level} 层iframe ${index + 1} 时出错:`, error);
      }
    });
  }

  /**
   * 移除指定iframe的右键菜单代理
   * @param {Element} iframeElement - iframe元素
   * @returns {boolean} - 是否成功移除
   */
  removeIframeContextMenuProxy(iframeElement) {
    console.log('移除iframe右键菜单代理:', {
      src: iframeElement.src,
      id: iframeElement.id
    });

    const proxy = this.iframeProxies.get(iframeElement);
    if (proxy) {
      proxy.destroy();
      this.iframeProxies.delete(iframeElement);
      this.nestedLevels.delete(iframeElement);
      console.log('iframe右键菜单代理已移除');
      return true;
    } else {
      console.log('iframe代理不存在，无需移除');
      return false;
    }
  }

  /**
   * 清理所有iframe右键菜单代理
   */
  cleanupAllIframeProxies() {
    console.log('清理所有iframe右键菜单代理');

    this.iframeProxies.forEach(proxy => {
      proxy.destroy();
    });
    this.iframeProxies.clear();
    this.nestedLevels.clear();
    this.detectedIframes.clear();

    console.log('所有iframe右键菜单代理已清理');
  }

  /**
   * 启动动态检测
   */
  startDynamicDetection() {
    if (this.detectionInterval) {
      console.log('动态检测已在运行');
      return;
    }

    console.log(`启动动态iframe检测，间隔 ${this.detectionIntervalMs / 1000}秒`);

    this.detectionInterval = setInterval(() => {
      if (this.isDetectionEnabled && this.isEnabled) {
        this.performDynamicDetection();
      }
    }, this.detectionIntervalMs);

    console.log('动态检测已启动');
  }

  /**
   * 停止动态检测
   */
  stopDynamicDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
      console.log('动态检测已停止');
    }
  }

  /**
   * 执行动态检测
   */
  performDynamicDetection() {
    console.log('=== 执行动态iframe检测 ===');

    try {
      // 1. 检测主窗口中的iframe变化
      this.detectMainWindowIframes();

      // 2. 检测已绑定iframe内部的嵌套iframe变化
      this.detectNestedIframes();

      // 3. 清理已移除的iframe代理
      this.cleanupRemovedIframes();

      console.log('动态检测完成');
    } catch (error) {
      console.error('动态检测过程中出错:', error);
    }
  }

  /**
   * 检测主窗口中的iframe变化
   */
  detectMainWindowIframes() {
    const mainIframes = document.querySelectorAll('iframe');
    const currentIframeCount = mainIframes.length;

    console.log(`主窗口iframe检测: 当前 ${currentIframeCount} 个，上次 ${this.lastIframeCount} 个`);

    if (currentIframeCount !== this.lastIframeCount) {
      console.log('主窗口iframe数量发生变化，重新检测');
      this.detectAllNestedIframes(document, 0);
      this.lastIframeCount = currentIframeCount;
    }

    // 检测新增的iframe
    mainIframes.forEach(iframe => {
      if (!this.detectedIframes.has(iframe)) {
        console.log('发现新的主窗口iframe:', {
          src: iframe.src,
          id: iframe.id,
          className: iframe.className
        });
        this.detectedIframes.add(iframe);
        this.tryCreateIframeProxy(iframe, 0);
      }
    });
  }

  /**
   * 检测已绑定iframe内部的嵌套iframe变化
   */
  detectNestedIframes() {
    console.log('检测嵌套iframe变化');

    this.iframeProxies.forEach((proxy, iframeElement) => {
      try {
        const iframeDocument = iframeElement.contentDocument;
        const iframeWindow = iframeElement.contentWindow;

        if (iframeDocument && iframeWindow) {
          const nestedIframes = iframeDocument.querySelectorAll('iframe');
          const currentLevel = this.nestedLevels.get(iframeElement) || 0;

          console.log(`iframe ${iframeElement.src} 内部有 ${nestedIframes.length} 个嵌套iframe`);

          nestedIframes.forEach(nestedIframe => {
            if (!this.detectedIframes.has(nestedIframe)) {
              console.log('发现新的嵌套iframe:', {
                parentSrc: iframeElement.src,
                nestedSrc: nestedIframe.src,
                nestedId: nestedIframe.id,
                level: currentLevel + 1
              });
              this.detectedIframes.add(nestedIframe);
              this.tryCreateIframeProxy(nestedIframe, currentLevel + 1);
            }
          });
        }
      } catch (error) {
        console.warn('检测嵌套iframe时出错:', error);
      }
    });
  }

  /**
   * 尝试为iframe创建代理
   * @param {Element} iframeElement - iframe元素
   * @param {number} level - 嵌套层级
   */
  tryCreateIframeProxy(iframeElement, level) {
    // 检查是否已经存在代理
    if (this.iframeProxies.has(iframeElement)) {
      return;
    }

    try {
      const iframeDocument = iframeElement.contentDocument;
      const iframeWindow = iframeElement.contentWindow;

      if (iframeDocument && iframeWindow) {
        console.log(`尝试为iframe创建代理 (层级 ${level}):`, {
          src: iframeElement.src,
          id: iframeElement.id
        });

        const success = this.createIframeContextMenuProxy(
          iframeElement,
          iframeDocument,
          iframeWindow,
          level
        );

        if (success) {
          console.log('iframe代理创建成功');
        } else {
          console.log('iframe代理创建失败');
        }
      } else {
        console.log('iframe内容不可访问，延迟重试');
        // 延迟重试
        setTimeout(() => {
          this.tryCreateIframeProxy(iframeElement, level);
        }, 1000);
      }
    } catch (error) {
      console.error('尝试创建iframe代理时出错:', error);
    }
  }

  /**
   * 递归检查iframe是否存在于任何文档中
   * @param {Element} iframeElement - 要检查的iframe元素
   * @param {Document} rootDocument - 根文档，默认为主文档
   * @param {number} level - 当前递归层级
   * @returns {boolean} - iframe是否存在于任何文档中
   */
  isIframeInAnyDocument(iframeElement, rootDocument = document, level = 0) {
    try {
      // 检查当前文档是否包含该iframe
      if (rootDocument.contains(iframeElement)) {
        return true;
      }

      // 递归检查所有嵌套iframe的文档
      const iframes = rootDocument.querySelectorAll('iframe');
      for (const iframe of iframes) {
        try {
          const iframeDocument = iframe.contentDocument;
          if (iframeDocument && iframeDocument !== rootDocument) {
            // 递归检查嵌套iframe的文档
            if (this.isIframeInAnyDocument(iframeElement, iframeDocument, level + 1)) {
              return true;
            }
          }
        } catch (error) {
          // 跨域限制，跳过此iframe
          console.debug(`无法访问第 ${level} 层iframe内容:`, error.message);
        }
      }

      return false;
    } catch (error) {
      console.warn(`递归检查iframe存在性时出错 (层级 ${level}):`, error);
      return false;
    }
  }

  /**
   * 清理已移除的iframe代理
   */
  cleanupRemovedIframes() {
    // console.log('清理已移除的iframe代理');

    const iframesToRemove = [];

    this.iframeProxies.forEach((proxy, iframeElement) => {
      try {
        // 递归检查iframe是否还在任何文档的DOM中
        if (!this.isIframeInAnyDocument(iframeElement)) {
          console.log('发现已移除的iframe:', {
            src: iframeElement.src,
            id: iframeElement.id
          });
          iframesToRemove.push(iframeElement);
        }
      } catch (error) {
        console.warn('检查iframe存在性时出错:', error);
        // 如果出错，也认为iframe已移除
        iframesToRemove.push(iframeElement);
      }
    });

    // 移除已不存在的iframe代理
    iframesToRemove.forEach(iframeElement => {
      this.removeIframeContextMenuProxy(iframeElement);
      this.detectedIframes.delete(iframeElement);
    });

    if (iframesToRemove.length > 0) {
      console.log(`清理了 ${iframesToRemove.length} 个已移除的iframe代理`);
    }
  }

  /**
   * 设置检测间隔
   * @param {number} intervalMs - 检测间隔（毫秒）
   */
  setDetectionInterval(intervalMs) {
    this.detectionIntervalMs = intervalMs;
    console.log(`检测间隔已设置为 ${intervalMs / 1000}秒`);

    // 如果检测正在运行，重启以应用新间隔
    if (this.detectionInterval) {
      this.stopDynamicDetection();
      this.startDynamicDetection();
    }
  }

  /**
   * 启用/禁用动态检测
   * @param {boolean} enabled - 是否启用
   */
  setDetectionEnabled(enabled) {
    this.isDetectionEnabled = enabled;
    console.log(`动态检测已${enabled ? '启用' : '禁用'}`);

    if (enabled && this.isEnabled && !this.detectionInterval) {
      this.startDynamicDetection();
    } else if (!enabled && this.detectionInterval) {
      this.stopDynamicDetection();
    }
  }

  /**
   * 获取管理器状态
   * @returns {Object} - 状态信息
   */
  getStatus() {
    const status = {
      isEnabled: this.isEnabled,
      totalProxies: this.iframeProxies.size,
      hasMainContextMenu: !!this.mainContextMenuTranslator,
      // 动态检测状态
      isDetectionEnabled: this.isDetectionEnabled,
      detectionInterval: this.detectionIntervalMs,
      isDetectionRunning: !!this.detectionInterval,
      lastIframeCount: this.lastIframeCount,
      detectedIframesCount: this.detectedIframes.size,
      proxyDetails: []
    };

    this.iframeProxies.forEach((proxy, iframe) => {
      status.proxyDetails.push({
        iframeSrc: iframe.src,
        iframeId: iframe.id,
        level: this.nestedLevels.get(iframe),
        proxyStatus: proxy.getStatus()
      });
    });

    return status;
  }

  /**
   * 打印管理器状态
   */
  printStatus() {
    const status = this.getStatus();
    console.log('=== NestedIframeContextMenuManager 状态 ===');
    console.log('启用状态:', status.isEnabled ? '启用' : '禁用');
    console.log('代理数量:', status.totalProxies);
    console.log('主窗口右键菜单:', status.hasMainContextMenu ? '存在' : '不存在');
    console.log('动态检测:', status.isDetectionEnabled ? '启用' : '禁用');
    console.log('检测间隔:', status.detectionInterval / 1000 + '秒');
    console.log('检测运行:', status.isDetectionRunning ? '运行中' : '已停止');
    console.log('上次iframe数量:', status.lastIframeCount);
    console.log('已检测iframe数量:', status.detectedIframesCount);
    
    if (status.proxyDetails.length > 0) {
      console.log('代理详情:');
      status.proxyDetails.forEach((detail, index) => {
        console.log(`  ${index + 1}. 层级${detail.level}: ${detail.iframeSrc || '无src'} (${detail.iframeId || '无id'}) - 状态: ${detail.proxyStatus.isEnabled ? '启用' : '禁用'}`);
      });
    } else {
      console.log('无代理实例');
    }
    console.log('==========================================');
  }

  /**
   * 销毁管理器
   */
  destroy() {
    console.log('销毁NestedIframeContextMenuManager');
    
    this.disable();
    this.mainContextMenuTranslator = null;
    
    // 清理动态检测相关资源
    this.stopDynamicDetection();
    this.detectedIframes.clear();
    this.lastIframeCount = 0;
    
    console.log('NestedIframeContextMenuManager已销毁');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IframeContextMenuProxy, NestedIframeContextMenuManager };
} else if (typeof window !== 'undefined') {
  window.IframeContextMenuProxy = IframeContextMenuProxy;
  window.NestedIframeContextMenuManager = NestedIframeContextMenuManager;
}
