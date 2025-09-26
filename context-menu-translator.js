/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-01-27 10:00:00
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-01-27 10:00:00
 * @FilePath: /transition-extension/context-menu-translator.js
 * @Description: 右键菜单翻译功能控制器 - 独立文件实现
 */

class ContextMenuTranslator {
  constructor() {
    this.isTranslationEnabled = false;
    this.translationTooltip = null;
    this.contextMenu = null;
    this.menuItems = [];
    this.currentIframeContext = null; // 当前iframe上下文
    this.iframeContextMenuManager = null; // iframe右键菜单管理器
    
    this.init();
  }

  async init() {
    console.log('右键菜单翻译功能初始化开始');
    
    try {
      // 检查是否已有翻译工具实例
      if (window.translationTooltip) {
        this.translationTooltip = window.translationTooltip;
        console.log('复用现有翻译工具实例');
      } else {
        // 创建新的翻译工具实例
        await this.createTranslationTooltip();
      }
      
      // 创建右键菜单
      this.createContextMenu();
      
      // 绑定右键菜单事件
      this.bindContextMenuEvents();
      
      // 检查本地存储中的翻译状态
      this.loadTranslationState();
      
      // 初始化iframe右键菜单管理器
      this.initIframeContextMenuManager();
      
      console.log('右键菜单翻译功能初始化完成');
    } catch (error) {
      console.error('右键菜单翻译功能初始化失败:', error);
    }
  }

  /**
   * 初始化iframe右键菜单管理器
   */
  initIframeContextMenuManager() {
    console.log('初始化iframe右键菜单管理器');
    
    try {
      // 检查NestedIframeContextMenuManager是否可用
      if (typeof NestedIframeContextMenuManager !== 'undefined') {
        this.iframeContextMenuManager = new NestedIframeContextMenuManager(this);
        this.iframeContextMenuManager.enable();
        console.log('iframe右键菜单管理器初始化成功');
      } else {
        console.warn('NestedIframeContextMenuManager不可用，iframe右键菜单功能将不可用');
      }
    } catch (error) {
      console.error('初始化iframe右键菜单管理器失败:', error);
    }
  }

  /**
   * 创建翻译工具实例
   */
  async createTranslationTooltip() {
    console.log('创建新的翻译工具实例');
    
    // 动态导入TranslationTooltip类
    if (typeof TranslationTooltip !== 'undefined') {
      this.translationTooltip = new TranslationTooltip();
      window.translationTooltip = this.translationTooltip;
    } else {
      console.error('TranslationTooltip类未找到');
      throw new Error('TranslationTooltip类未找到');
    }
  }

  /**
   * 创建右键菜单
   */
  createContextMenu() {
    console.log('创建右键菜单');
    
    // 创建菜单容器
    this.contextMenu = document.createElement('div');
    this.contextMenu.id = 'translation-context-menu';
    this.contextMenu.className = 'translation-context-menu';
    this.contextMenu.style.cssText = `
      position: fixed;
      z-index: 999999;
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      padding: 4px 0;
      min-width: 160px;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      user-select: none;
    `;

    // 创建菜单项
    this.createMenuItem('开启翻译', 'enable-translation', () => {
      this.enableTranslation();
    });

    this.createMenuItem('关闭翻译', 'disable-translation', () => {
      this.disableTranslation();
    });

    this.createMenuItem('翻译状态', 'translation-status', () => {
      this.showTranslationStatus();
    });

    // 添加分隔线
    this.createSeparator();

    this.createMenuItem('关于翻译工具', 'about-translation', () => {
      this.showAboutInfo();
    });

    // 将菜单添加到页面
    document.body.appendChild(this.contextMenu);
    
    console.log('右键菜单创建完成');
  }

  /**
   * 创建菜单项
   * @param {string} text - 菜单项文本
   * @param {string} id - 菜单项ID
   * @param {Function} callback - 点击回调
   */
  createMenuItem(text, id, callback) {
    const menuItem = document.createElement('div');
    menuItem.className = 'translation-menu-item';
    menuItem.id = id;
    menuItem.textContent = text;
    menuItem.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      color: #333;
      transition: background-color 0.2s ease;
    `;

    // 悬停效果
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.backgroundColor = '#f5f5f5';
    });

    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.backgroundColor = 'transparent';
    });

    // 点击事件
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      callback();
      this.hideContextMenu();
    });

    this.contextMenu.appendChild(menuItem);
    this.menuItems.push({ element: menuItem, id, callback });
  }

  /**
   * 创建分隔线
   */
  createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'translation-menu-separator';
    separator.style.cssText = `
      height: 1px;
      background-color: #eee;
      margin: 4px 0;
    `;
    this.contextMenu.appendChild(separator);
  }

  /**
   * 绑定右键菜单事件
   */
  bindContextMenuEvents() {
    console.log('绑定右键菜单事件');
    
    // 监听右键点击事件
    document.addEventListener('contextmenu', (e) => {
      // 检查是否点击在翻译工具tip上
      if (e.target.closest('.translation-tooltip')) {
        return;
      }
      
      // 显示右键菜单
      this.showContextMenu(e);
    });

    // 监听点击事件，隐藏菜单
    document.addEventListener('click', (e) => {
      if (!this.contextMenu.contains(e.target)) {
        this.hideContextMenu();
      }
    });

    // 监听ESC键，隐藏菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
      }
    });

    console.log('右键菜单事件绑定完成');
  }

  /**
   * 显示右键菜单
   * @param {Event} event - 右键事件
   */
  showContextMenu(event) {
    console.log('显示右键菜单');
    
    // 阻止默认右键菜单
    event.preventDefault();
    
    // 更新菜单项状态
    this.updateMenuItems();
    
    // 显示菜单
    this.contextMenu.style.display = 'block';
    
    // 计算菜单位置
    const menuRect = this.contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = event.clientX;
    let top = event.clientY;
    
    // 防止菜单超出右边界
    if (left + menuRect.width > viewportWidth) {
      left = event.clientX - menuRect.width;
    }
    
    // 防止菜单超出下边界
    if (top + menuRect.height > viewportHeight) {
      top = event.clientY - menuRect.height;
    }
    
    // 防止菜单超出左边界
    if (left < 0) {
      left = 10;
    }
    
    // 防止菜单超出上边界
    if (top < 0) {
      top = 10;
    }
    
    this.contextMenu.style.left = left + 'px';
    this.contextMenu.style.top = top + 'px';
    
    console.log('右键菜单位置:', { left, top });
  }

  /**
   * 隐藏右键菜单
   */
  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }
  }

  /**
   * 更新菜单项状态
   */
  updateMenuItems() {
    const enableItem = document.getElementById('enable-translation');
    const disableItem = document.getElementById('disable-translation');
    const statusItem = document.getElementById('translation-status');
    
    if (enableItem && disableItem && statusItem) {
      if (this.isTranslationEnabled) {
        enableItem.style.display = 'none';
        disableItem.style.display = 'block';
        statusItem.textContent = '翻译状态: 已开启';
        statusItem.style.color = '#28a745';
      } else {
        enableItem.style.display = 'block';
        disableItem.style.display = 'none';
        statusItem.textContent = '翻译状态: 已关闭';
        statusItem.style.color = '#dc3545';
      }
    }
  }

  /**
   * 开启翻译功能
   */
  enableTranslation() {
    console.log('开启翻译功能');
    
    if (!this.translationTooltip) {
      console.error('翻译工具实例不存在');
      this.showNotification('翻译工具未初始化', 'error');
      return;
    }
    
    try {
      // 绑定翻译事件
      this.bindTranslationEvents();
      
      // 更新状态
      this.isTranslationEnabled = true;
      
      // 保存状态到本地存储
      this.saveTranslationState();
      
      // 显示通知
      this.showNotification('翻译功能已开启', 'success');
      
      // 如果当前有iframe上下文，在iframe中也开启翻译
      if (this.currentIframeContext) {
        this.enableIframeTranslation();
      }
      
      console.log('翻译功能开启成功');
    } catch (error) {
      console.error('开启翻译功能失败:', error);
      this.showNotification('开启翻译功能失败', 'error');
    }
  }

  /**
   * 关闭翻译功能
   */
  disableTranslation() {
    console.log('关闭翻译功能');
    
    try {
      // 解绑翻译事件
      this.unbindTranslationEvents();
      
      // 隐藏当前显示的tooltip
      if (this.translationTooltip && this.translationTooltip.tooltip) {
        this.translationTooltip.hideTooltip();
      }
      
      // 更新状态
      this.isTranslationEnabled = false;
      
      // 保存状态到本地存储
      this.saveTranslationState();
      
      // 显示通知
      this.showNotification('翻译功能已关闭', 'info');
      
      // 如果当前有iframe上下文，在iframe中也关闭翻译
      if (this.currentIframeContext) {
        this.disableIframeTranslation();
      }
      
      console.log('翻译功能关闭成功');
    } catch (error) {
      console.error('关闭翻译功能失败:', error);
      this.showNotification('关闭翻译功能失败', 'error');
    }
  }

  /**
   * 绑定翻译事件
   * 复用content.js中的事件绑定逻辑
   */
  bindTranslationEvents() {
    console.log('绑定翻译事件');
    
    if (!this.translationTooltip) {
      console.error('翻译工具实例不存在');
      return;
    }
    
    // 复用TranslationTooltip的bindEvents方法
    if (typeof this.translationTooltip.bindEvents === 'function') {
      this.translationTooltip.bindEvents();
      console.log('翻译事件绑定完成');
    } else {
      console.error('TranslationTooltip.bindEvents方法不存在');
    }
  }

  /**
   * 解绑翻译事件
   */
  unbindTranslationEvents() {
    console.log('解绑翻译事件');
    
    // 移除事件监听器
    document.removeEventListener('mouseover', this.translationTooltip.handleMouseOver);
    document.removeEventListener('mouseout', this.translationTooltip.handleMouseOut);
    document.removeEventListener('scroll', this.translationTooltip.handleScroll);
    
    console.log('翻译事件解绑完成');
  }

  /**
   * 在iframe中开启翻译功能
   */
  enableIframeTranslation() {
    console.log('在iframe中开启翻译功能');
    
    if (!this.currentIframeContext) {
      console.warn('没有iframe上下文，无法在iframe中开启翻译');
      return;
    }

    try {
      const { iframeElement, iframeDocument, iframeWindow } = this.currentIframeContext;
      
      // 检查iframe是否有翻译工具实例
      if (iframeWindow.translationTooltip) {
        // 如果iframe已有翻译工具，直接开启
        iframeWindow.translationTooltip.isTranslationEnabled = true;
        console.log('iframe翻译功能已开启');
      } else {
        // 如果iframe没有翻译工具，尝试创建
        console.log('iframe中没有翻译工具，尝试创建');
        // 这里可以添加创建iframe翻译工具的逻辑
      }
    } catch (error) {
      console.error('在iframe中开启翻译功能失败:', error);
    }
  }

  /**
   * 在iframe中关闭翻译功能
   */
  disableIframeTranslation() {
    console.log('在iframe中关闭翻译功能');
    
    if (!this.currentIframeContext) {
      console.warn('没有iframe上下文，无法在iframe中关闭翻译');
      return;
    }

    try {
      const { iframeElement, iframeDocument, iframeWindow } = this.currentIframeContext;
      
      // 检查iframe是否有翻译工具实例
      if (iframeWindow.translationTooltip) {
        // 关闭iframe翻译功能
        iframeWindow.translationTooltip.isTranslationEnabled = false;
        iframeWindow.translationTooltip.hideTooltip();
        console.log('iframe翻译功能已关闭');
      }
    } catch (error) {
      console.error('在iframe中关闭翻译功能失败:', error);
    }
  }

  /**
   * 显示翻译状态
   */
  showTranslationStatus() {
    const status = this.isTranslationEnabled ? '已开启' : '已关闭';
    const message = `翻译功能当前状态: ${status}`;
    this.showNotification(message, 'info');
  }

  /**
   * 显示关于信息
   */
  showAboutInfo() {
    const aboutInfo = `
翻译工具信息:
- 版本: 1.0.0
- 功能: 鼠标悬浮显示中文翻译
- 状态: ${this.isTranslationEnabled ? '已开启' : '已关闭'}
- 字典条目: ${this.translationTooltip ? Object.keys(this.translationTooltip.translationDict).length : '未知'}
    `.trim();
    
    this.showNotification(aboutInfo, 'info');
  }

  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 (success, error, info, warning)
   */
  showNotification(message, type = 'info') {
    console.log(`通知 [${type}]:`, message);
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `translation-notification translation-notification-${type}`;
    notification.textContent = message;
    
    // 设置样式
    const colors = {
      success: '#28a745',
      error: '#dc3545',
      info: '#17a2b8',
      warning: '#ffc107'
    };
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000000;
      background: ${colors[type] || colors.info};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    });
    
    // 自动隐藏
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * 保存翻译状态到本地存储
   */
  saveTranslationState() {
    try {
      const state = {
        isTranslationEnabled: this.isTranslationEnabled,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      localStorage.setItem('translation-tooltip-state', JSON.stringify(state));
      console.log('翻译状态已保存:', state);
    } catch (error) {
      console.error('保存翻译状态失败:', error);
    }
  }

  /**
   * 从本地存储加载翻译状态
   */
  loadTranslationState() {
    try {
      const savedState = localStorage.getItem('translation-tooltip-state');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // 检查是否是同一个页面
        if (state.url === window.location.href) {
          this.isTranslationEnabled = state.isTranslationEnabled;
          console.log('翻译状态已加载:', state);
          
          // 如果之前是开启状态，自动开启翻译
          if (this.isTranslationEnabled) {
            console.log('自动开启翻译功能');
            this.enableTranslation();
          }
        } else {
          console.log('不同页面，重置翻译状态');
          this.isTranslationEnabled = false;
        }
      } else {
        console.log('未找到保存的翻译状态');
        this.isTranslationEnabled = false;
      }
    } catch (error) {
      console.error('加载翻译状态失败:', error);
      this.isTranslationEnabled = false;
    }
  }

  /**
   * 获取当前翻译状态
   * @returns {boolean} - 是否已开启翻译
   */
  getTranslationState() {
    return this.isTranslationEnabled;
  }

  /**
   * 销毁实例
   */
  destroy() {
    console.log('销毁右键菜单翻译功能');
    
    // 解绑事件
    this.unbindTranslationEvents();
    
    // 销毁iframe右键菜单管理器
    if (this.iframeContextMenuManager) {
      this.iframeContextMenuManager.destroy();
      this.iframeContextMenuManager = null;
    }
    
    // 移除右键菜单
    if (this.contextMenu && this.contextMenu.parentNode) {
      this.contextMenu.parentNode.removeChild(this.contextMenu);
    }
    
    // 清理引用
    this.translationTooltip = null;
    this.contextMenu = null;
    this.menuItems = [];
    this.currentIframeContext = null;
    
    console.log('右键菜单翻译功能已销毁');
  }
}

// 确保页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化右键菜单翻译功能');
    window.contextMenuTranslator = new ContextMenuTranslator();
  });
} else {
  console.log('DOM已加载，直接初始化右键菜单翻译功能');
  window.contextMenuTranslator = new ContextMenuTranslator();
}
