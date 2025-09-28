/**
 * iframe缓存管理器
 * 专门负责管理boundIframes的添加、清理和监控
 * 
 * 功能：
 * - 统一管理iframe缓存
 * - 自动检测和清理已移除的iframe
 * - 提供缓存统计和监控
 * - 支持定期清理机制
 */
class IframeCacheManager {
  constructor() {
    this.boundIframes = new Map(); // 记录已绑定的iframe及其所在document: Map<iframe, document>
    this.cleanupInterval = null; // 定期清理定时器
    this.cleanupIntervalMs = 30000; // 清理间隔30秒
    this.isCleanupEnabled = true; // 是否启用自动清理
    
    console.log('IframeCacheManager 初始化完成');
  }

  /**
   * 添加iframe到缓存
   * @param {Element} iframe - iframe元素
   * @param {Document} document - iframe所在的document，默认为iframe.ownerDocument
   * @returns {boolean} - 是否成功添加
   */
  addIframe(iframe, document = null) {
    if (!iframe || !iframe.tagName || iframe.tagName !== 'IFRAME') {
    //   console.warn('无效的iframe元素，无法添加到缓存');
      return false;
    }

    // 如果没有指定document，使用iframe的ownerDocument
    const iframeDocument = document || iframe.ownerDocument;
    if (!iframeDocument) {
      console.warn('无法确定iframe所在的document');
      return false;
    }

    if (this.boundIframes.has(iframe)) {
      console.log('iframe已在缓存中，跳过添加:', {
        src: iframe.src,
        id: iframe.id,
        className: iframe.className,
        document: iframeDocument
      });
      return false;
    }

    this.boundIframes.set(iframe, iframeDocument);
    console.log('iframe已添加到缓存:', {
      src: iframe.src,
      id: iframe.id,
      className: iframe.className,
      document: iframeDocument,
      cacheSize: this.boundIframes.size
    });

    return true;
  }

  /**
   * 从缓存中移除iframe
   * @param {Element} iframe - iframe元素
   * @returns {boolean} - 是否成功移除
   */
  removeIframe(iframe) {
    if (!iframe) {
    //   console.warn('无效的iframe元素，无法从缓存移除');
      return false;
    }

    const iframeDocument = this.boundIframes.get(iframe);
    const wasRemoved = this.boundIframes.delete(iframe);
    if (wasRemoved) {
      console.log('iframe已从缓存移除:', {
        src: iframe.src,
        id: iframe.id,
        className: iframe.className,
        document: iframeDocument,
        cacheSize: this.boundIframes.size
      });
    } else {
    //   console.log('iframe不在缓存中，无需移除:', {
    //     src: iframe.src,
    //     id: iframe.id,
    //     className: iframe.className
    //   });
    }

    return wasRemoved;
  }

  /**
   * 检查iframe是否在缓存中
   * @param {Element} iframe - iframe元素
   * @returns {boolean} - 是否在缓存中
   */
  hasIframe(iframe) {
    return this.boundIframes.has(iframe);
  }

  /**
   * 获取缓存大小
   * @returns {number} - 缓存中iframe的数量
   */
  getCacheSize() {
    return this.boundIframes.size;
  }

  /**
   * 获取所有缓存的iframe
   * @returns {Set} - iframe集合
   */
  getAllIframes() {
    return new Set(this.boundIframes.keys());
  }

  /**
   * 清理已从DOM移除的iframe
   * @param {Document} document - 文档对象，用于检查DOM存在性
   * @returns {number} - 清理的iframe数量
   */
  cleanupRemovedIframes(document = window.document) {
    // console.log('开始清理已移除的iframe缓存');
    // console.log('清理前缓存大小:', this.boundIframes.size);

    const iframesToRemove = [];
    
    // 找出已从DOM移除的iframe
    this.boundIframes.forEach((iframeDocument, iframe) => {
      // 只有当document=iframe所在document时，才做包含判断
      if (document === iframeDocument) {
        if (!document.contains(iframe)) {
          console.log('发现已从DOM移除的iframe:', {
            src: iframe.src,
            id: iframe.id,
            className: iframe.className,
            document: iframeDocument
          });
          iframesToRemove.push(iframe);
        }
      } else {
        // console.log('跳过跨document检查iframe:', {
        //   src: iframe.src,
        //   id: iframe.id,
        //   className: iframe.className,
        //   iframeDocument: iframeDocument,
        //   checkDocument: document
        // });
      }
    });

    // 移除已不存在的iframe
    iframesToRemove.forEach(iframe => {
      this.boundIframes.delete(iframe);
    });

    console.log(`清理完成，移除了 ${iframesToRemove.length} 个iframe`);
    console.log('清理后缓存大小:', this.boundIframes.size);

    return iframesToRemove.length;
  }

  /**
   * 清理指定弹窗内的iframe
   * @param {Element} popupElement - 弹窗元素
   * @param {Document} document - 文档对象
   * @returns {number} - 清理的iframe数量
   */
  cleanupIframesInPopup(popupElement, document = window.document) {
    if (!popupElement) {
      console.warn('无效的弹窗元素');
      return 0;
    }

    console.log('开始清理弹窗内的iframe缓存:', {
      tagName: popupElement.tagName,
      className: popupElement.className,
      id: popupElement.id
    });

    const iframesInPopup = popupElement.querySelectorAll('iframe');
    console.log(`弹窗包含 ${iframesInPopup.length} 个iframe`);

    let cleanedCount = 0;
    iframesInPopup.forEach((iframe, index) => {
      const iframeDocument = this.boundIframes.get(iframe);
    //   console.log(`检查iframe ${index + 1}:`, {
    //     src: iframe.src,
    //     id: iframe.id,
    //     className: iframe.className,
    //     inCache: this.boundIframes.has(iframe),
    //     iframeDocument: iframeDocument
    //   });

      if (this.boundIframes.has(iframe)) {
        this.boundIframes.delete(iframe);
        cleanedCount++;
        // console.log('已从缓存移除iframe');
      }
    });

    console.log(`弹窗iframe清理完成，移除了 ${cleanedCount} 个iframe`);
    console.log('清理后缓存大小:', this.boundIframes.size);

    return cleanedCount;
  }

  /**
   * 启动定期清理机制
   * @param {number} intervalMs - 清理间隔（毫秒）
   * @param {Document} document - 文档对象
   */
  startPeriodicCleanup(intervalMs = null, document = window.document) {
    if (this.cleanupInterval) {
    //   console.log('定期清理机制已在运行');
      return;
    }

    const interval = intervalMs || this.cleanupIntervalMs;
    console.log(`启动定期清理机制，间隔 ${interval}ms`);

    this.cleanupInterval = setInterval(() => {
      if (this.isCleanupEnabled) {
        console.log('执行定期清理检查');
        this.cleanupRemovedIframes(document);
      }
    }, interval);

    // console.log('定期清理机制已启动');
  }

  /**
   * 停止定期清理机制
   */
  stopPeriodicCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('定期清理机制已停止');
    }
  }

  /**
   * 设置清理间隔
   * @param {number} intervalMs - 清理间隔（毫秒）
   */
  setCleanupInterval(intervalMs) {
    this.cleanupIntervalMs = intervalMs;
    console.log(`清理间隔已设置为 ${intervalMs}ms`);
  }

  /**
   * 启用/禁用自动清理
   * @param {boolean} enabled - 是否启用
   */
  setCleanupEnabled(enabled) {
    this.isCleanupEnabled = enabled;
    console.log(`自动清理已${enabled ? '启用' : '禁用'}`);
  }

  /**
   * 清空所有缓存
   */
  clearAll() {
    const size = this.boundIframes.size;
    this.boundIframes.clear();
    console.log(`已清空所有缓存，移除了 ${size} 个iframe`);
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    const stats = {
      cacheSize: this.boundIframes.size,
      isCleanupEnabled: this.isCleanupEnabled,
      cleanupInterval: this.cleanupIntervalMs,
      isPeriodicCleanupRunning: !!this.cleanupInterval
    };

    // 统计iframe的详细信息
    const iframeDetails = [];
    this.boundIframes.forEach((iframeDocument, iframe) => {
      iframeDetails.push({
        src: iframe.src,
        id: iframe.id,
        className: iframe.className,
        iframeDocument: iframeDocument,
        isInDOM: iframeDocument.contains(iframe)
      });
    });
    stats.iframeDetails = iframeDetails;

    return stats;
  }

  /**
   * 打印缓存状态
   */
  printStatus() {
    const stats = this.getStats();
    console.log('=== IframeCacheManager 状态 ===');
    console.log('缓存大小:', stats.cacheSize);
    console.log('自动清理:', stats.isCleanupEnabled ? '启用' : '禁用');
    console.log('清理间隔:', stats.cleanupInterval + 'ms');
    console.log('定期清理:', stats.isPeriodicCleanupRunning ? '运行中' : '已停止');
    
    if (stats.iframeDetails.length > 0) {
      console.log('缓存的iframe详情:');
      stats.iframeDetails.forEach((detail, index) => {
        console.log(`  ${index + 1}. ${detail.src || '无src'} (${detail.id || '无id'}) - DOM: ${detail.isInDOM ? '存在' : '已移除'} - Document: ${detail.iframeDocument}`);
      });
    } else {
      console.log('缓存为空');
    }
    console.log('===============================');
  }

  /**
   * 销毁缓存管理器
   * 清理所有资源和定时器
   */
  destroy() {
    console.log('销毁IframeCacheManager');
    
    // 停止定期清理
    this.stopPeriodicCleanup();
    
    // 清空缓存
    this.clearAll();
    
    console.log('IframeCacheManager已销毁');
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IframeCacheManager;
} else if (typeof window !== 'undefined') {
  window.IframeCacheManager = IframeCacheManager;
}
