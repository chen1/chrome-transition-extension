/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-01-27 10:00:00
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-30 18:59:32
 * @FilePath: /transition-extension/floating-ball-translator.js
 * @Description: 悬浮球翻译功能控制器 - 独立文件实现
 */

class FloatingBallTranslator {
  constructor() {
    this.isTranslationEnabled = true;
    this.translationTooltip = null;
    this.floatingBall = null; // 悬浮球元素
    this.expandedMenu = null; // 展开的菜单
    this.menuItems = [];
    this.isDragging = false; // 是否正在拖拽
    this.dragOffset = { x: 0, y: 0 }; // 拖拽偏移量
    this.hideMenuTimeout = null; // 隐藏菜单的延迟定时器
    
    // 字典相关属性
    this.availableDictionaries = [
      { key: 'his-dict', name: 'HIS字典', file: 'dict/his-dict.json' },
      { key: 'emr-dict', name: 'EMR字典', file: 'dict/emr-dict.json' },
      { key: 'ris-dict', name: 'RIS字典', file: 'dict/ris-dict.json' }
    ];
    this.currentDictionary = 'his-dict'; // 默认字典
    
    this.init();
  }

  async init() {
    // console.log('悬浮球翻译功能初始化开始');
    
    try {
      // 检查是否已有翻译工具实例
      if (window.translationTooltip) {
        this.translationTooltip = window.translationTooltip;
        // console.log('复用现有翻译工具实例');
        
        // 等待现有实例完全初始化
        await this.waitForTranslationTooltipReady();
      } else {
        // 创建新的翻译工具实例
        await this.createTranslationTooltip();
      }
      
      // 创建悬浮球
      this.createFloatingBall();
      
      // 绑定悬浮球事件
      this.bindFloatingBallEvents();
      
      // 加载悬浮球位置
      this.loadBallPosition();
      
      // 检查本地存储中的翻译状态
      this.loadTranslationState();
      
      
      // console.log('悬浮球翻译功能初始化完成');
    } catch (error) {
      // console.error('悬浮球翻译功能初始化失败:', error);
    }
  }


  /**
   * 创建翻译工具实例
   */
  async createTranslationTooltip() {
    // console.log('创建新的翻译工具实例');
    
    // 动态导入TranslationTooltip类
    if (typeof TranslationTooltip !== 'undefined') {
      this.translationTooltip = new TranslationTooltip();
      window.translationTooltip = this.translationTooltip;
      
      // 等待TranslationTooltip完全初始化
      await this.waitForTranslationTooltipReady();
    } else {
      // console.error('TranslationTooltip类未找到');
      throw new Error('TranslationTooltip类未找到');
    }
  }

  /**
   * 等待TranslationTooltip完全初始化
   */
  async waitForTranslationTooltipReady() {
    // console.log('等待TranslationTooltip完全初始化...');
    
    let attempts = 0;
    const maxAttempts = 50; // 最多等待5秒
    
    while (attempts < maxAttempts) {
      if (this.translationTooltip && 
          this.translationTooltip.iframeHandler && 
          this.translationTooltip.tooltip) {
        // console.log('TranslationTooltip初始化完成');
        return;
      }
      
      // 等待100ms后重试
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    // console.warn('TranslationTooltip初始化超时，但继续执行');
  }

  /**
   * 创建悬浮球
   */
  createFloatingBall() {
    // console.log('创建悬浮球');
    
    // 创建包装容器来控制整个操作区域
    this.floatingContainer = document.createElement('div');
    this.floatingContainer.id = 'translation-floating-container';
    this.floatingContainer.className = 'translation-floating-container';
    this.floatingContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // 创建悬浮球容器
    this.floatingBall = document.createElement('div');
    this.floatingBall.id = 'translation-floating-ball';
    this.floatingBall.className = 'translation-floating-ball';
    this.floatingBall.style.cssText = `
      position: relative;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // 添加翻译图标
    const icon = document.createElement('div');
    icon.innerHTML = '译';
    icon.style.cssText = `
      color: white;
      font-size: 18px;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;
    this.floatingBall.appendChild(icon);

    // 将悬浮球添加到包装容器
    this.floatingContainer.appendChild(this.floatingBall);

    // 创建展开菜单
    this.createExpandedMenu();

    // 将包装容器添加到页面
    document.body.appendChild(this.floatingContainer);
    
    // 绑定包装容器的鼠标事件来控制菜单显隐
    this.bindContainerMouseEvents();
    
    // console.log('悬浮球创建完成');
  }

  /**
   * 创建展开菜单
   */
  createExpandedMenu() {
    // console.log('创建展开菜单');
    
    // 创建菜单容器
    this.expandedMenu = document.createElement('div');
    this.expandedMenu.id = 'translation-expanded-menu';
    this.expandedMenu.className = 'translation-expanded-menu';
    this.expandedMenu.style.cssText = `
      position: absolute;
      bottom: 50px;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      padding: 8px 0;
      min-width: 180px;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      user-select: none;
      opacity: 0;
      transition: all 0.3s ease;
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

    this.createMenuItem('更新翻译', 'update-translation', () => {
      this.updateTranslation();
    });

    // 添加分隔线
    this.createSeparator();

    // 添加切换字典菜单项
    this.createDictionarySubmenu();

    // 添加分隔线
    this.createSeparator();

    this.createMenuItem('关于翻译工具', 'about-translation', () => {
      this.showAboutInfo();
    });

    // 将菜单添加到悬浮球
    this.floatingBall.appendChild(this.expandedMenu);
    
    // 为菜单添加鼠标事件
    this.bindExpandedMenuEvents();
    
    // console.log('展开菜单创建完成');
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
      this.hideExpandedMenu();
    });

    this.expandedMenu.appendChild(menuItem);
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
    this.expandedMenu.appendChild(separator);
  }

  /**
   * 创建字典切换子菜单
   */
  createDictionarySubmenu() {
    // 创建字典菜单容器
    const dictMenuContainer = document.createElement('div');
    dictMenuContainer.className = 'translation-dict-menu-container';
    dictMenuContainer.style.cssText = `
      position: relative;
    `;

    // 创建字典菜单主项
    const dictMainItem = document.createElement('div');
    dictMainItem.className = 'translation-menu-item translation-dict-main-item';
    dictMainItem.textContent = '切换字典 ▶';
    dictMainItem.style.cssText = `
      padding: 8px 16px;
      cursor: pointer;
      color: #333;
      transition: background-color 0.2s ease;
      position: relative;
    `;

    // 创建字典子菜单
    const dictSubmenu = document.createElement('div');
    dictSubmenu.className = 'translation-dict-submenu';
    dictSubmenu.style.cssText = `
      position: absolute;
      left: 0;
      transform: translateX(60%);
      top: -5px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      padding: 8px 0;
      min-width: 150px;
      display: block;
      z-index: 1000001;
      white-space: nowrap;
    `;

    // 为每个字典创建菜单项
    this.availableDictionaries.forEach(dict => {
      const dictItem = document.createElement('div');
      dictItem.className = 'translation-menu-item translation-dict-item';
      dictItem.textContent = dict.name;
      dictItem.dataset.dictKey = dict.key;
      dictItem.style.cssText = `
        padding: 8px 16px;
        cursor: pointer;
        color: #333;
        transition: background-color 0.2s ease;
        position: relative;
      `;

      // 如果是当前字典，添加选中标识
      if (dict.key === this.currentDictionary) {
        dictItem.style.backgroundColor = '#e3f2fd';
        dictItem.style.fontWeight = 'bold';
        dictItem.textContent += ' ✓';
      }

      // 悬停效果
      dictItem.addEventListener('mouseenter', () => {
        if (dict.key !== this.currentDictionary) {
          dictItem.style.backgroundColor = '#f5f5f5';
        }
      });

      dictItem.addEventListener('mouseleave', () => {
        if (dict.key !== this.currentDictionary) {
          dictItem.style.backgroundColor = 'transparent';
        }
      });

      // 点击切换字典
      dictItem.addEventListener('click', (e) => {
        e.stopPropagation();
        this.switchDictionary(dict.key);
        this.hideExpandedMenu();
      });

      dictSubmenu.appendChild(dictItem);
    });

    // 主菜单项悬停效果
    
    dictMainItem.addEventListener('mouseenter', (event) => {
      dictMainItem.style.backgroundColor = '#f5f5f5';
      this.showDictSubmenu(dictSubmenu, dictMainItem);
      // 清除任何待执行的隐藏定时器
      if (dictMainItem._hideTimer) {
        clearTimeout(dictMainItem._hideTimer);
        dictMainItem._hideTimer = null;
      }
      if (dictSubmenu._hideTimer) {
        clearTimeout(dictSubmenu._hideTimer);
        dictSubmenu._hideTimer = null;
      }
    });
    // dictMainItem.removeEventListener('mouseout','*');
    // dictMainItem.removeEventListener('mouseleave','*');
    dictMainItem.addEventListener('mouseleave', (event) => {
      dictMainItem.style.backgroundColor = 'transparent';
      if((event.toElement === dictSubmenu ||(event.toElement && event.toElement==dictMainItem))) {
        return;
      }
      // 延迟隐藏子菜单，给用户时间移动到子菜单
      dictMainItem._hideTimer = setTimeout(() => {
        if (!dictSubmenu.matches(':hover')) {
          dictSubmenu.style.display = 'none';
        }
      }, 200);
    });

    // 子菜单悬停时保持显示
    // dictSubmenu.addEventListener('mouseenter', () => {
    //   dictSubmenu.style.display = 'block';
    //   dictSubmenu.style.visibility = 'visible';
    //   // 清除任何待执行的隐藏定时器
    //   if (dictSubmenu._hideTimer) {
    //     clearTimeout(dictSubmenu._hideTimer);
    //     dictSubmenu._hideTimer = null;
    //   }
    // });

    // dictSubmenu.addEventListener('mouseleave', () => {
    //   // 延迟隐藏子菜单，给用户时间移回主菜单项
    //   dictSubmenu._hideTimer = setTimeout(() => {
    //     // 检查鼠标是否在主菜单项上
    //     if (!dictMainItem.matches(':hover')) {
    //       dictSubmenu.style.display = 'none';
    //       dictSubmenu.style.visibility = 'visible'; // 重置visibility
    //     }
    //   }, 200);
    // });

    dictMainItem.appendChild(dictSubmenu);
    dictMenuContainer.appendChild(dictMainItem);
    this.expandedMenu.appendChild(dictMenuContainer);
  }

  /**
   * 绑定展开菜单事件
   */
  bindExpandedMenuEvents() {
    if (!this.expandedMenu) return;
    
    // 使用统一的鼠标区域检测
    this.setupUnifiedMouseTracking();
  }

  /**
   * 设置统一的鼠标跟踪
   */
  setupUnifiedMouseTracking() {
    // 创建一个包含悬浮球和菜单的虚拟区域
    const mouseTrackingArea = document.createElement('div');
    mouseTrackingArea.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9998;
    `;
    document.body.appendChild(mouseTrackingArea);

    // 监听整个区域的鼠标移动
    let isMouseOverFloatingArea = false;
    
    document.addEventListener('mousemove', (e) => {
      const floatingBallRect = this.floatingBall.getBoundingClientRect();
      const menuRect = this.expandedMenu ? this.expandedMenu.getBoundingClientRect() : null;
      
      // 检查鼠标是否在悬浮球或菜单区域内
      const isOverFloatingBall = e.clientX >= floatingBallRect.left && 
                                 e.clientX <= floatingBallRect.right &&
                                 e.clientY >= floatingBallRect.top && 
                                 e.clientY <= floatingBallRect.bottom;
      
      const isOverMenu = menuRect && 
                        e.clientX >= menuRect.left && 
                        e.clientX <= menuRect.right &&
                        e.clientY >= menuRect.top && 
                        e.clientY <= menuRect.bottom;
      
      const isOverFloatingArea = isOverFloatingBall || isOverMenu;
      
      if (isOverFloatingArea && !isMouseOverFloatingArea) {
        // 鼠标进入悬浮区域
        // console.log('鼠标进入悬浮区域');
        isMouseOverFloatingArea = true;
        if (this.hideMenuTimeout) {
          clearTimeout(this.hideMenuTimeout);
          this.hideMenuTimeout = null;
        }
        if (!isOverMenu) {
          this.showExpandedMenu();
        }
      } else if (!isOverFloatingArea && isMouseOverFloatingArea) {
        // 鼠标离开悬浮区域
        // console.log('鼠标离开悬浮区域');
        isMouseOverFloatingArea = false;
        this.scheduleHideMenu();
      }
    });
  }

  /**
   * 延迟隐藏菜单
   */
  scheduleHideMenu() {
    // console.log('开始延迟隐藏菜单');
    // 清除之前的定时器
    if (this.hideMenuTimeout) {
      clearTimeout(this.hideMenuTimeout);
    //   // console.log('清除之前的隐藏定时器');
    }
    
    // 设置延迟隐藏（300ms）
    this.hideMenuTimeout = setTimeout(() => {
    //   // console.log('延迟时间到，隐藏菜单');
      this.hideExpandedMenu();
      this.hideMenuTimeout = null;
    },0 );
  }

  /**
   * 绑定包装容器的鼠标事件来控制菜单显隐
   */
  bindContainerMouseEvents() {
    // console.log('绑定包装容器鼠标事件');
    
    // 鼠标进入包装容器时显示菜单
    this.floatingBall.addEventListener('mouseover', () => {
      // console.log('鼠标进入包装容器，显示菜单');
      // 清除隐藏定时器
      if (this.hideMenuTimeout) {
        clearTimeout(this.hideMenuTimeout);
        this.hideMenuTimeout = null;
      }
      this.showExpandedMenu();
    });

    // 鼠标离开包装容器时延迟隐藏菜单
    // this.floatingBall.addEventListener('mouseleave', () => {
    //   // console.log('鼠标离开包装容器，延迟隐藏菜单');
    //   this.scheduleHideMenu();
    // });
  }

  /**
   * 绑定悬浮球事件
   */
  bindFloatingBallEvents() {
    // // console.log('绑定悬浮球事件');
    
    // 悬浮球点击事件 - 切换翻译状态
    // this.floatingBall.addEventListener('click', (e) => {
    //   e.stopPropagation();
    //   this.toggleTranslation();
    // });

    // 悬浮球点击事件保持原有逻辑，鼠标事件由统一跟踪处理

    // 拖拽功能
    this.setupDragFunctionality();

    // 点击页面其他地方隐藏菜单
    document.addEventListener('click', (e) => {
      if (!this.floatingContainer.contains(e.target)) {
        // 清除隐藏定时器
        if (this.hideMenuTimeout) {
          clearTimeout(this.hideMenuTimeout);
          this.hideMenuTimeout = null;
        }
        this.hideExpandedMenu();
      }
    });

    // 监听ESC键，隐藏菜单
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // 清除隐藏定时器
        if (this.hideMenuTimeout) {
          clearTimeout(this.hideMenuTimeout);
          this.hideMenuTimeout = null;
        }
        this.hideExpandedMenu();
      }
    });

    // // console.log('悬浮球事件绑定完成');
  }

  /**
   * 设置拖拽功能
   */
  setupDragFunctionality() {
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    // 鼠标按下事件
    this.floatingBall.addEventListener('mousedown', (e) => {
      // 只有按住Shift键才能拖拽
      if (!e.shiftKey) return;
      
      e.preventDefault();
      this.isDragging = true;
      
      // 记录初始位置
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.floatingContainer.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      
      // 添加拖拽样式
      this.floatingBall.style.cursor = 'grabbing';
      this.floatingBall.style.transform = 'scale(1.1)';
      
      // 绑定移动和释放事件
      document.addEventListener('mousemove', this.handleDragMove);
      document.addEventListener('mouseup', this.handleDragEnd);
    });

    // 拖拽移动处理
    this.handleDragMove = (e) => {
      if (!this.isDragging) return;
      
      e.preventDefault();
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      const newX = initialX + deltaX;
      const newY = initialY + deltaY;
      
      // 限制在视窗范围内
      const maxX = window.innerWidth - this.floatingContainer.offsetWidth;
      const maxY = window.innerHeight - this.floatingContainer.offsetHeight;
      
      const clampedX = Math.max(0, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));
      
      this.floatingContainer.style.left = clampedX + 'px';
      this.floatingContainer.style.top = clampedY + 'px';
      this.floatingContainer.style.right = 'auto';
      this.floatingContainer.style.bottom = 'auto';
    };

    // 拖拽结束处理
    this.handleDragEnd = (e) => {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      
      // 恢复样式
      this.floatingBall.style.cursor = 'pointer';
      this.floatingBall.style.transform = 'scale(1)';
      
      // 保存位置到本地存储
      this.saveBallPosition();
      
      // 解绑事件
      document.removeEventListener('mousemove', this.handleDragMove);
      document.removeEventListener('mouseup', this.handleDragEnd);
    };
  }

  /**
   * 显示展开菜单
   */
  showExpandedMenu() {
    if (!this.expandedMenu) return;
    
    // 更新菜单项状态
    this.updateMenuItems();
    
    // 显示菜单
    this.expandedMenu.style.display = 'block';
    
    // 使用requestAnimationFrame确保显示后再应用动画
    requestAnimationFrame(() => {
      this.expandedMenu.style.opacity = '1';
      this.expandedMenu.style.transform = 'translateY(0)';
    });
    
    // // console.log('展开菜单已显示');
  }

  /**
   * 隐藏展开菜单
   */
  hideExpandedMenu() {
    if (!this.expandedMenu) return;
    
    this.expandedMenu.style.opacity = '0';
    this.expandedMenu.style.transform = 'translateY(10px)';
    
    // setTimeout(() => {
      this.expandedMenu.style.display = 'none';
    // }, 300);
    
    // // console.log('展开菜单已隐藏');
  }

  /**
   * 切换翻译功能
   */
  toggleTranslation() {
    if (this.isTranslationEnabled) {
      this.disableTranslation();
    } else {
      this.enableTranslation();
    }
  }

  /**
   * 保存悬浮球位置
   */
  saveBallPosition() {
    try {
      const rect = this.floatingBall.getBoundingClientRect();
      const position = {
        left: rect.left,
        top: rect.top,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('translation-floating-ball-position', JSON.stringify(position));
      // console.log('悬浮球位置已保存:', position);
    } catch (error) {
      // console.error('保存悬浮球位置失败:', error);
    }
  }

  /**
   * 加载悬浮球位置
   */
  loadBallPosition() {
    try {
      const savedPosition = localStorage.getItem('translation-floating-ball-position');
      if (savedPosition) {
        const position = JSON.parse(savedPosition);
        
        // 检查位置是否仍然有效（在视窗范围内）
        if (position.left >= 0 && position.top >= 0 && 
            position.left < window.innerWidth && position.top < window.innerHeight) {
          
          this.floatingBall.style.left = position.left + 'px';
          this.floatingBall.style.top = position.top + 'px';
          this.floatingBall.style.right = 'auto';
          this.floatingBall.style.bottom = 'auto';
          
          // console.log('悬浮球位置已恢复:', position);
        } else {
          // console.log('保存的位置无效，使用默认位置');
        }
      }
    } catch (error) {
      // console.error('加载悬浮球位置失败:', error);
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
        
        // 更新悬浮球颜色表示开启状态
        this.floatingBall.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
      } else {
        enableItem.style.display = 'block';
        disableItem.style.display = 'none';
        statusItem.textContent = '翻译状态: 已关闭';
        statusItem.style.color = '#dc3545';
        
        // 更新悬浮球颜色表示关闭状态
        this.floatingBall.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
    }
  }

  /**
   * 开启翻译功能
   * @param {boolean} isInitialization - 是否为初始化时的自动开启
   */
  enableTranslation(isInitialization = false) {
    // console.log('开启翻译功能', isInitialization ? '(初始化)' : '(手动开启)');
    
    if (!this.translationTooltip) {
      // console.error('翻译工具实例不存在');
      this.showNotification('翻译工具未初始化', 'error');
      return;
    }
    
    try {
      // 绑定翻译事件
      this.bindTranslationEvents();
      
      // 非初始化的时候，开启翻译工具，则执行该方法
      if (!isInitialization) {
        // console.log('非初始化开启翻译，执行iframe检测');
        this.detectAndBindAllIframes();
      } else {
        // console.log('初始化开启翻译，跳过iframe检测');
      }
      
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
      
      // console.log('翻译功能开启成功');
    } catch (error) {
      // console.error('开启翻译功能失败:', error);
      this.showNotification('开启翻译功能失败', 'error');
    }
  }

  /**
   * 关闭翻译功能
   */
  disableTranslation() {
    // console.log('关闭翻译功能');
    
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
      
      // console.log('翻译功能关闭成功');
    } catch (error) {
      // console.error('关闭翻译功能失败:', error);
      this.showNotification('关闭翻译功能失败', 'error');
    }
  }

  /**
   * 绑定翻译事件
   * 复用content.js中的事件绑定逻辑
   */
  bindTranslationEvents() {
    // console.log('绑定翻译事件');
    
    if (!this.translationTooltip) {
      // console.error('翻译工具实例不存在');
      return;
    }
    
    // 复用TranslationTooltip的bindEvents方法
    if (typeof this.translationTooltip.bindEvents === 'function') {
      this.translationTooltip.bindEvents();
      // console.log('翻译事件绑定完成');
    } else {
      // console.error('TranslationTooltip.bindEvents方法不存在');
    }
  }

  /**
   * 解绑翻译事件
   */
  unbindTranslationEvents() {
    // console.log('解绑翻译事件');
    
    // 移除事件监听器
    document.removeEventListener('mouseover', this.translationTooltip.handleMouseOver);
    document.removeEventListener('mouseout', this.translationTooltip.handleMouseOut);
    document.removeEventListener('scroll', this.translationTooltip.handleScroll);
    
    // console.log('翻译事件解绑完成');
  }

  /**
   * 检测并绑定所有iframe的嵌套iframe事件
   * 调用TranslationTooltip的iframeHandler来检测所有未缓存的iframe
   */
  detectAndBindAllIframes() {
    // console.log('检测并绑定所有iframe的嵌套iframe事件');
    
    if (!this.translationTooltip) {
      // console.warn('翻译工具实例不存在，跳过iframe检测');
      return;
    }
    
    if (!this.translationTooltip.iframeHandler) {
      // console.warn('iframe处理器不存在，尝试重新初始化');
      this.retryIframeHandlerInitialization();
      return;
    }
    
    try {
      // 调用iframeHandler的detectAndBindAllIframes方法
      // 这个方法会检测页面中所有的iframe，并为未在缓存中的iframe绑定事件
      this.translationTooltip.iframeHandler.detectAndBindAllIframes();
      // console.log('iframe嵌套检测完成');
    } catch (error) {
      // console.error('检测iframe嵌套时出错:', error);
      // 尝试重新初始化iframeHandler
      this.retryIframeHandlerInitialization();
    }
  }

  /**
   * 重试iframeHandler初始化
   */
  retryIframeHandlerInitialization() {
    // console.log('尝试重新初始化iframeHandler');
    
    try {
      // 检查IframeHandler类是否可用
      if (typeof IframeHandler !== 'undefined') {
        this.translationTooltip.iframeHandler = new IframeHandler(this.translationTooltip);
        // console.log('iframeHandler重新初始化成功');
        
        // 重新尝试检测iframe
        setTimeout(() => {
          this.detectAndBindAllIframes();
        }, 1000);
      } else {
        // console.error('IframeHandler类不可用，无法重新初始化');
      }
    } catch (error) {
      // console.error('重新初始化iframeHandler失败:', error);
    }
  }

  /**
   * 在iframe中开启翻译功能
   */
  enableIframeTranslation() {
    // console.log('在iframe中开启翻译功能');
    
    if (!this.currentIframeContext) {
      // console.warn('没有iframe上下文，无法在iframe中开启翻译');
      return;
    }

    try {
      const { iframeElement, iframeDocument, iframeWindow } = this.currentIframeContext;
      
      // 检查iframe是否有翻译工具实例
      if (iframeWindow.translationTooltip) {
        // 如果iframe已有翻译工具，直接开启
        iframeWindow.translationTooltip.isTranslationEnabled = true;
        // console.log('iframe翻译功能已开启');
      } else {
        // 如果iframe没有翻译工具，尝试创建
        // console.log('iframe中没有翻译工具，尝试创建');
        // 这里可以添加创建iframe翻译工具的逻辑
      }
    } catch (error) {
      // console.error('在iframe中开启翻译功能失败:', error);
    }
  }

  /**
   * 在iframe中关闭翻译功能
   */
  disableIframeTranslation() {
    // console.log('在iframe中关闭翻译功能');
    
    if (!this.currentIframeContext) {
      // console.warn('没有iframe上下文，无法在iframe中关闭翻译');
      return;
    }

    try {
      const { iframeElement, iframeDocument, iframeWindow } = this.currentIframeContext;
      
      // 检查iframe是否有翻译工具实例
      if (iframeWindow.translationTooltip) {
        // 关闭iframe翻译功能
        iframeWindow.translationTooltip.isTranslationEnabled = false;
        iframeWindow.translationTooltip.hideTooltip();
        // console.log('iframe翻译功能已关闭');
      }
    } catch (error) {
      // console.error('在iframe中关闭翻译功能失败:', error);
    }
  }

  /**
   * 更新翻译功能
   * 重新检查嵌套的iframe并绑定事件
   */
  updateTranslation() {
    // console.log('开始更新翻译功能');
    
    if (!this.translationTooltip) {
      // console.error('翻译工具实例不存在');
      this.showNotification('翻译工具未初始化', 'error');
      return;
    }
    
    try {
      // 显示更新开始通知
      this.showNotification('正在更新翻译功能...', 'info');
      
      // 1. 清理现有的iframe缓存
      this.clearIframeCache();
      
      // 2. 重新检测并绑定所有iframe
      this.refreshIframeDetection();
      
      // 3. 如果翻译功能已开启，重新绑定翻译事件
      if (this.isTranslationEnabled) {
        this.rebindTranslationEvents();
      }
      
      // 4. 显示更新完成通知
      this.showNotification('翻译功能更新完成', 'success');
      
      // console.log('翻译功能更新完成');
    } catch (error) {
      // console.error('更新翻译功能失败:', error);
      this.showNotification('更新翻译功能失败', 'error');
    }
  }

  /**
   * 清理iframe缓存
   * 只清理不存在的iframe，保留仍然存在的iframe缓存
   */
  clearIframeCache() {
    // console.log('清理不存在的iframe缓存');
    
    if (!this.translationTooltip || !this.translationTooltip.iframeHandler) {
      // console.warn('iframe处理器不存在，跳过缓存清理');
      return;
    }
    
    try {
      const cache = this.translationTooltip.iframeHandler.getCache();
      if (cache && typeof cache.cleanupRemovedIframes === 'function') {
        const cleanedCount = cache.cleanupRemovedIframes(document);
        // console.log(`已清理 ${cleanedCount} 个不存在的iframe缓存`);
      } else {
        // console.warn('缓存清理方法不可用，尝试使用备用方法');
        // 备用方法：手动检查每个iframe是否仍然存在
        this.manualCleanupRemovedIframes();
      }
    } catch (error) {
      // console.error('清理iframe缓存失败:', error);
    }
  }

  /**
   * 手动清理不存在的iframe缓存（备用方法）
   */
  manualCleanupRemovedIframes() {
    // console.log('使用手动方法清理不存在的iframe缓存');
    
    try {
      const cache = this.translationTooltip.iframeHandler.getCache();
      if (!cache || !cache.getAllIframes) {
        // console.warn('无法获取缓存信息');
        return;
      }
      
      const allIframes = cache.getAllIframes();
      let cleanedCount = 0;
      
      allIframes.forEach(iframe => {
        // 检查iframe是否仍然存在于DOM中
        if (!document.contains(iframe)) {
          // console.log('发现已移除的iframe:', {
          //   src: iframe.src,
          //   id: iframe.id,
          //   className: iframe.className
          // });
          
          // 清理这个iframe的事件
          this.translationTooltip.iframeHandler.cleanupIframeEvents(iframe);
          cleanedCount++;
        }
      });
      
      // console.log(`手动清理完成，移除了 ${cleanedCount} 个iframe缓存`);
    } catch (error) {
      // console.error('手动清理iframe缓存失败:', error);
    }
  }

  /**
   * 刷新iframe检测
   */
  refreshIframeDetection() {
    // console.log('刷新iframe检测');
    
    if (!this.translationTooltip || !this.translationTooltip.iframeHandler) {
      // console.warn('iframe处理器不存在，尝试重新初始化');
      this.retryIframeHandlerInitialization();
      return;
    }
    
    try {
      // 调用iframeHandler的detectAndBindAllIframes方法
      // 这会重新检测页面中所有的iframe，并为未在缓存中的iframe绑定事件
      this.translationTooltip.iframeHandler.detectAndBindAllIframes();
      // console.log('iframe检测刷新完成');
    } catch (error) {
      // console.error('刷新iframe检测失败:', error);
      // 尝试重新初始化iframeHandler
      this.retryIframeHandlerInitialization();
    }
  }

  /**
   * 重新绑定翻译事件
   */
  rebindTranslationEvents() {
    // console.log('重新绑定翻译事件');
    
    try {
      // 先解绑现有事件
      this.unbindTranslationEvents();
      
      // 重新绑定事件
      this.bindTranslationEvents();
      
      // console.log('翻译事件重新绑定完成');
    } catch (error) {
      // console.error('重新绑定翻译事件失败:', error);
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
    const currentDict = this.getCurrentDictionaryInfo();
    const dictSize = this.translationTooltip ? Object.keys(this.translationTooltip.translationDict).length : 0;
    
    const aboutInfo = `
翻译工具信息:
- 版本: 1.0.0
- 功能: 鼠标悬浮显示中文翻译
- 状态: ${this.isTranslationEnabled ? '已开启' : '已关闭'}
- 当前字典: ${currentDict.name}
- 字典条目: ${dictSize}个
- 可用字典: ${this.availableDictionaries.map(d => d.name).join(', ')}
    `.trim();
    
    this.showNotification(aboutInfo, 'info');
  }

  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 (success, error, info, warning)
   */
  showNotification(message, type = 'info') {
    // console.log(`通知 [${type}]:`, message);
    
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
        currentDictionary: this.currentDictionary,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      localStorage.setItem('translation-tooltip-state', JSON.stringify(state));
      // console.log('翻译状态已保存:', state);
    } catch (error) {
      // console.error('保存翻译状态失败:', error);
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
          // 加载保存的字典设置
          if (state.currentDictionary) {
            this.currentDictionary = state.currentDictionary;
          }
          // console.log('翻译状态已加载:', state);
          
          // 如果之前是开启状态，自动开启翻译（初始化模式）
          if (this.isTranslationEnabled) {
            // console.log('自动开启翻译功能（初始化模式）');
            this.enableTranslation(true); // 传入true表示这是初始化时的自动开启
          }
        } else {
          // console.log('不同页面，重置翻译状态');
        //   this.isTranslationEnabled = false;
        }
      } else {
        // console.log('未找到保存的翻译状态');
        // this.isTranslationEnabled = false;
      }
    } catch (error) {
      // console.error('加载翻译状态失败:', error);
    //   this.isTranslationEnabled = false;
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
   * 切换字典
   * @param {string} dictKey - 字典键值
   */
  async switchDictionary(dictKey) {
    console.log('切换字典到:', dictKey);
    
    // 查找字典配置
    const dictConfig = this.availableDictionaries.find(dict => dict.key === dictKey);
    if (!dictConfig) {
      this.showNotification('字典不存在', 'error');
      return;
    }
    
    // 如果是当前字典，不需要切换
    if (dictKey === this.currentDictionary) {
      this.showNotification(`已经是当前字典: ${dictConfig.name}`, 'info');
      return;
    }
    
    try {
      // 显示加载提示
      this.showNotification('正在切换字典...', 'info');
      
      // 加载新字典
      const response = await fetch(chrome.runtime.getURL(dictConfig.file));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newDict = await response.json();
      const dictSize = Object.keys(newDict).length;
      
      // 更新当前字典
      this.currentDictionary = dictKey;
      
      // 更新翻译工具的字典
      if (this.translationTooltip) {
        // 使用content.js的更新方法
        if (typeof this.translationTooltip.updateTranslationDict === 'function') {
          this.translationTooltip.updateTranslationDict(newDict);
        } else {
          // 如果没有更新方法，直接设置
          this.translationTooltip.translationDict = newDict;
          
          // 更新翻译服务的字典
          if (this.translationTooltip.translationService) {
            this.translationTooltip.translationService.setTranslationDict(newDict);
          }
          
          // 更新文本段翻译器的字典
          if (this.translationTooltip.textSegmentTranslator) {
            this.translationTooltip.textSegmentTranslator.translationDict = newDict;
          }
        }
        
        // 更新iframe处理器中的字典
        this.updateIframeHandlerDictionary(newDict);
      }
      
      // 保存状态
      this.saveTranslationState();
      
      // 更新菜单显示
      this.updateDictionaryMenuDisplay();
      
      // 显示成功提示
      this.showNotification(`字典切换成功: ${dictConfig.name} (${dictSize}个条目)`, 'success');
      
      console.log(`字典切换完成: ${dictConfig.name}, 条目数: ${dictSize}`);
      
    } catch (error) {
      console.error('切换字典失败:', error);
      this.showNotification(`切换字典失败: ${error.message}`, 'error');
    }
  }
  
  /**
   * 更新iframe处理器中的字典
   * @param {Object} newDict - 新字典
   */
  updateIframeHandlerDictionary(newDict) {
    if (!this.translationTooltip || !this.translationTooltip.iframeHandler) {
      return;
    }
    
    try {
      // 更新iframe处理器的统一翻译处理器字典
      if (this.translationTooltip.iframeHandler.unifiedTranslationProcessor) {
        // 统一翻译处理器会通过translationTooltip获取字典，所以不需要单独设置
        console.log('iframe处理器字典已通过统一翻译处理器更新');
      }
      
      // 通知所有已绑定的iframe更新字典
      const cache = this.translationTooltip.iframeHandler.getCache();
      if (cache && cache.getAllIframes) {
        const allIframes = cache.getAllIframes();
        allIframes.forEach(iframe => {
          try {
            const iframeWindow = iframe.contentWindow;
            if (iframeWindow && iframeWindow.translationTooltip) {
              iframeWindow.translationTooltip.translationDict = newDict;
              if (iframeWindow.translationTooltip.translationService) {
                iframeWindow.translationTooltip.translationService.setTranslationDict(newDict);
              }
              if (iframeWindow.translationTooltip.textSegmentTranslator) {
                iframeWindow.translationTooltip.textSegmentTranslator.translationDict = newDict;
              }
            }
          } catch (error) {
            // 跨域iframe无法访问，忽略错误
            console.log('无法更新跨域iframe字典:', iframe.src);
          }
        });
      }
      
    } catch (error) {
      console.error('更新iframe处理器字典失败:', error);
    }
  }
  
  /**
   * 更新字典菜单显示
   */
  updateDictionaryMenuDisplay() {
    const dictItems = document.querySelectorAll('.translation-dict-item');
    dictItems.forEach(item => {
      const dictKey = item.dataset.dictKey;
      const dictConfig = this.availableDictionaries.find(dict => dict.key === dictKey);
      
      if (dictKey === this.currentDictionary) {
        // 当前选中的字典
        item.style.backgroundColor = '#e3f2fd';
        item.style.fontWeight = 'bold';
        item.textContent = dictConfig.name + ' ✓';
      } else {
        // 未选中的字典
        item.style.backgroundColor = 'transparent';
        item.style.fontWeight = 'normal';
        item.textContent = dictConfig.name;
      }
    });
  }
  
  /**
   * 智能显示字典子菜单
   * @param {Element} submenu - 子菜单元素
   * @param {Element} mainItem - 主菜单项元素
   */
  showDictSubmenu(submenu, mainItem) {
    // 直接显示子菜单，使用固定的left: -100%定位
    submenu.style.display = 'block';
  }

  /**
   * 获取当前字典信息
   * @returns {Object} - 当前字典配置
   */
  getCurrentDictionaryInfo() {
    return this.availableDictionaries.find(dict => dict.key === this.currentDictionary) || this.availableDictionaries[0];
  }

  /**
   * 销毁实例
   */
  destroy() {
    // console.log('销毁悬浮球翻译功能');
    
    // 解绑事件
    this.unbindTranslationEvents();
    
    
    // 移除包装容器
    if (this.floatingContainer && this.floatingContainer.parentNode) {
      this.floatingContainer.parentNode.removeChild(this.floatingContainer);
    }
    
    // 清理引用
    this.translationTooltip = null;
    this.floatingBall = null;
    this.floatingContainer = null;
    this.expandedMenu = null;
    this.menuItems = [];
    
    // console.log('悬浮球翻译功能已销毁');
  }
}


// 确保页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // console.log('DOM加载完成，初始化悬浮球翻译功能');
    window.floatingBallTranslator = new FloatingBallTranslator();
  });
} else {
  // console.log('DOM已加载，直接初始化悬浮球翻译功能');
  window.floatingBallTranslator = new FloatingBallTranslator();
}
