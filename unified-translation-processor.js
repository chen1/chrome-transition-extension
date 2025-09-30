/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-09-30 15:20:00
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-30 16:24:14
 * @FilePath: /transition-extension/unified-translation-processor.js
 * @Description: 统一的翻译处理器，整合简单翻译和文本段翻译逻辑
 */

/**
 * 统一翻译处理器
 * 负责处理所有翻译相关的逻辑，包括简单翻译和文本段翻译
 * 可以被主窗口和iframe共同使用
 */
class UnifiedTranslationProcessor {
  constructor(translationTooltip) {
    this.translationTooltip = translationTooltip;
    this.textSegmentTranslator = translationTooltip.textSegmentTranslator;
    this.displayFormatter = translationTooltip.displayFormatter;
  }

  /**
   * 处理元素翻译的主入口方法
   * @param {Element} element - 要翻译的元素
   * @param {Event} event - 鼠标事件
   * @param {Object} options - 选项参数
   * @param {string} options.context - 上下文 ('main' | 'iframe')
   * @param {Element} options.iframeElement - iframe元素（仅在iframe上下文中使用）
   * @returns {Object|null} - 翻译结果对象或null
   */
  processElementTranslation(element, event, options = {}) {
    const { context = 'main', iframeElement = null } = options;
    
    // console.log(`=== UnifiedTranslationProcessor: 处理${context}翻译 ===`);
    // console.log('目标元素:', element);
    // console.log('元素文本内容:', element.textContent);
    
    try {
      // 检查是否应该使用文本段翻译
      if (this.shouldUseTextSegmentTranslation(element)) {
        // console.log(`${context}使用文本段翻译处理元素`);
        return this.processTextSegmentTranslation(element, event, options);
      }
      
      // console.log(`${context}使用简单文本翻译处理元素`);
      // 使用简单文本翻译
      return this.processSimpleTranslation(element, event, options);
      
    } catch (error) {
      // console.error(`${context}翻译处理失败:`, error);
      return null;
    }
  }

  /**
   * 处理简单文本翻译
   * @param {Element} element - 要翻译的元素
   * @param {Event} event - 鼠标事件
   * @param {Object} options - 选项参数
   * @returns {Object|null} - 翻译结果对象或null
   */
  processSimpleTranslation(element, event, options = {}) {
    const { context = 'main', iframeElement = null } = options;
    
    // 提取元素文本
    const text = this.extractElementText(element);
    // console.log(`${context}提取的文本:`, text);
    
    if (!text) {
      // console.log(`${context}没有提取到文本，退出`);
      return null;
    }

    // 获取翻译
    const translation = this.translationTooltip.getTranslation(text, element);
    // console.log(`${context}翻译结果:`, translation);
    
    if (!translation) {
      // console.log(`${context}没有找到翻译，退出`);
      return null;
    }

    // 计算显示位置
    const displayEvent = context === 'iframe' && iframeElement ? 
      this.calculateIframePosition(element, event, iframeElement) : event;

    return {
      type: 'simple',
      content: translation,
      displayEvent: displayEvent,
      element: element,
      context: context,
      iframeElement: iframeElement
    };
  }

  /**
   * 处理文本段翻译
   * @param {Element} element - 要翻译的元素
   * @param {Event} event - 鼠标事件
   * @param {Object} options - 选项参数
   * @returns {Object|null} - 翻译结果对象或null
   */
  processTextSegmentTranslation(element, event, options = {}) {
    const { context = 'main', iframeElement = null } = options;
    
    if (!this.textSegmentTranslator) {
      // console.log(`${context}文本段翻译器不可用，降级到简单翻译`);
      return this.processSimpleTranslation(element, event, options);
    }

    try {
      let segments;
      let translatedSegments;

      if (context === 'iframe') {
        // iframe环境：直接使用TextSegmentTranslator的核心方法
        segments = this.textSegmentTranslator.analyzeElementStructure(element);
        
        if (!segments || segments.length === 0) {
          // console.log(`${context}没有分析到文本段，退出`);
          return null;
        }

        // 翻译每个文本段
        translatedSegments = segments.map(segment => {
          const translatedText = this.textSegmentTranslator.translateText(segment.text);
          return {
            ...segment,
            translatedText: translatedText,
            originalText: segment.text
          };
        });
      } else {
        // 主窗口环境：使用processElementTranslation方法
        const result = this.textSegmentTranslator.processElementTranslation(element);
        
        if (!result || !result.segments || result.segments.length === 0) {
          // console.log(`${context}文本段翻译没有结果，退出`);
          return null;
        }

        translatedSegments = result.segments;
      }

      // console.log(`${context}翻译后的文本段:`, translatedSegments);

      // 使用显示格式化器构建翻译结果显示
      let tooltipContent = '';
      let hasTranslation = false;

      if (this.displayFormatter) {
        // console.log(`${context}使用DisplayFormatter进行JSON格式显示`);
        tooltipContent = this.displayFormatter.formatAsJSON(element, translatedSegments);
        hasTranslation = tooltipContent !== null;
      } else {
        // 降级到HTML格式显示
        tooltipContent = this.buildFallbackHTML(translatedSegments);
        hasTranslation = tooltipContent !== '';
      }

      if (!hasTranslation) {
        // console.log(`${context}没有找到任何翻译，退出`);
        return null;
      }

      // 计算显示位置
      const displayEvent = context === 'iframe' && iframeElement ? 
        this.calculateIframePosition(element, event, iframeElement) : event;

      return {
        type: 'text-segment',
        content: tooltipContent,
        displayEvent: displayEvent,
        element: element,
        context: context,
        iframeElement: iframeElement,
        segments: translatedSegments
      };

    } catch (error) {
      // console.error(`${context}文本段翻译失败:`, error);
      // 降级到简单翻译
      return this.processSimpleTranslation(element, event, options);
    }
  }

  /**
   * 判断是否应该使用文本段翻译
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否应该使用文本段翻译
   */
  shouldUseTextSegmentTranslation(element) {
    // 检查文本段翻译器是否可用
    if (!this.textSegmentTranslator) {
      return false;
    }

    // 检查元素是否只有一个文本子节点
    const hasOnlyOneTextNode = this.textSegmentTranslator.hasOnlyOneTextNode(element);
    if (hasOnlyOneTextNode) {
      return false;
    }

    // 检查元素是否有混合节点结构（文本节点和元素节点混合）
    return this.hasMixedNodeStructure(element);
  }

  /**
   * 检查元素是否有混合节点结构
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否有混合节点结构
   */
  hasMixedNodeStructure(element) {
    if (!element.childNodes || element.childNodes.length === 0) {
      return false;
    }

    let hasTextNode = false;
    let hasElementNode = false;

    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        hasTextNode = true;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        hasElementNode = true;
      }
    }

    return hasTextNode && hasElementNode;
  }

  /**
   * 计算iframe内元素的显示位置
   * @param {Element} element - iframe内的元素
   * @param {Event} event - 原始事件
   * @param {Element} iframeElement - iframe元素
   * @returns {Object} - 模拟事件对象
   */
  calculateIframePosition(element, event, iframeElement) {
    // 获取元素在iframe内的位置
    const elementRect = element.getBoundingClientRect();
    
    // 获取iframe在主窗口中的位置
    const iframeRect = iframeElement.getBoundingClientRect();
    
    // 计算元素在主窗口中的绝对位置
    const absoluteX = iframeRect.left + elementRect.left;
    const absoluteY = iframeRect.top + elementRect.top;
    
    // 创建模拟事件对象
    return {
      clientX: absoluteX + elementRect.width / 2,
      clientY: absoluteY + elementRect.height / 2,
      target: element,
      iframeElement: iframeElement,
      originalEvent: event
    };
  }

  /**
   * 构建降级HTML格式的翻译内容
   * @param {Array} translatedSegments - 翻译后的文本段
   * @returns {string} - HTML格式的内容
   */
  buildFallbackHTML(translatedSegments) {
    let tooltipContent = '';
    
    translatedSegments.forEach((segment, index) => {
      if (segment.translatedText && segment.translatedText !== segment.originalText) {
        tooltipContent += `<div style="margin: 2px 0;">`;
        tooltipContent += `<span style="color: #ffeb3b;">"${segment.originalText}"</span>`;
        tooltipContent += ` → <span style="color: #4caf50;">"${segment.translatedText}"</span>`;
        tooltipContent += `</div>`;
      }
    });
    
    return tooltipContent;
  }

  /**
   * 显示翻译结果
   * @param {Object} translationResult - 翻译结果对象
   * @param {Object} displayOptions - 显示选项
   */
  displayTranslationResult(translationResult, displayOptions = {}) {
    if (!translationResult) {
      return;
    }

    const { 
      type, 
      content, 
      displayEvent, 
      element, 
      context, 
      iframeElement 
    } = translationResult;

    // 根据上下文选择合适的显示方法
    if (context === 'iframe') {
      this.displayIframeTranslation(translationResult, displayOptions);
    } else {
      this.displayMainTranslation(translationResult, displayOptions);
    }
  }

  /**
   * 显示主窗口翻译结果
   * @param {Object} translationResult - 翻译结果对象
   * @param {Object} displayOptions - 显示选项
   */
  displayMainTranslation(translationResult, displayOptions = {}) {
    const { type, content, displayEvent, element } = translationResult;
    const tooltip = this.translationTooltip.tooltip;

    // 设置tooltip内容
    this.translationTooltip.currentElement = element;
    
    if (type === 'text-segment') {
      tooltip.innerHTML = content;
    } else {
      tooltip.textContent = content;
    }

    // 定位tooltip
    this.translationTooltip.positionTooltip(displayEvent);
    
    // 强制设置显示状态
    tooltip.style.display = 'block';
    tooltip.style.visibility = 'visible';
    
    // 应用样式
    if (type === 'text-segment' && this.displayFormatter) {
      this.displayFormatter.applyTooltipStyles(tooltip, 'text-segment');
    }
    
    // 显示动画
    requestAnimationFrame(() => {
      tooltip.style.setProperty('opacity', '1', 'important');
      tooltip.style.setProperty('transform', 'translateY(0)', 'important');
    });
  }

  /**
   * 显示iframe翻译结果
   * @param {Object} translationResult - 翻译结果对象
   * @param {Object} displayOptions - 显示选项
   */
  displayIframeTranslation(translationResult, displayOptions = {}) {
    const { type, content, displayEvent, element, iframeElement } = translationResult;
    const tooltip = this.translationTooltip.tooltip;

    // 清除之前的定时器
    if (this.translationTooltip.hoverTimeout) {
      clearTimeout(this.translationTooltip.hoverTimeout);
    }
    if (this.translationTooltip.hideTimeout) {
      clearTimeout(this.translationTooltip.hideTimeout);
    }
    
    // 延迟显示tooltip
    this.translationTooltip.hoverTimeout = setTimeout(() => {
      this.translationTooltip.currentElement = null; // iframe情况下不设置currentElement
      
      if (type === 'text-segment') {
        tooltip.innerHTML = content;
      } else {
        tooltip.textContent = content;
      }
      
      // 使用模拟事件位置来定位tooltip
      this.translationTooltip.positionTooltip(displayEvent);
      
      // 强制设置显示状态
      tooltip.style.display = 'block';
      tooltip.style.visibility = 'visible';
      
      // 应用iframe特定样式
      if (type === 'text-segment' && this.displayFormatter) {
        this.displayFormatter.applyTooltipStyles(tooltip, 'iframe-text-segment');
      } else {
        // 简单翻译的iframe样式
        tooltip.style.border = '2px solid #4CAF50';
        tooltip.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
      }
      
      // 显示动画
      requestAnimationFrame(() => {
        tooltip.style.setProperty('opacity', '1', 'important');
        tooltip.style.setProperty('transform', 'translateY(0)', 'important');
      });
    }, 200);
  }

  /**
   * 查找最底层的文本元素
   * @param {Element} element - 要检查的元素
   * @returns {Element|null} - 最底层的文本元素或null
   */
  findDeepestTextElement(element) {
    // console.log('=== findDeepestTextElement 开始 ===');
    // console.log('检查元素:', element);
    
    // 如果当前元素就是文本节点，直接返回其父元素
    if (element.nodeType === Node.TEXT_NODE) {
      // console.log('找到文本节点:', element.textContent);
      return element.parentElement;
    }
    
    // 检查当前元素是否直接包含文本（即使有其他element子节点）
    const hasDirectText = this.hasDirectTextContent(element);
    if (hasDirectText) {
      // console.log('元素直接包含文本:', element.textContent);
      return element;
    }
    
    // 如果当前元素没有直接文本，递归查找子元素
    // if (element.children && element.children.length > 0) {
    //   for (let child of element.children) {
    //     const deepest = this.findDeepestTextElement(child);
    //     if (deepest) {
    //       // console.log('在子元素中找到文本元素:', deepest);
    //       return deepest;
    //     }
    //   }
    // }
    
    // console.log('未找到合适的文本元素');
    return null;
  }

  /**
   * 检查元素是否直接包含文本内容
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否直接包含文本内容
   */
  hasDirectTextContent(element) {
    // 检查元素是否直接包含文本内容
    // 直接文本内容指的是：元素本身有文本节点作为直接子节点
    
    if (!element.childNodes || element.childNodes.length === 0) {
      return false;
    }
    
    // 遍历直接子节点，查找文本节点
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      // 如果是文本节点且有内容
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        // console.log('发现直接文本子节点:', child.textContent.trim());
        return true;
      }
    }
    
    return false;
  }

  isFrameworkComponent(element) {
    const tagName = element.tagName.toLowerCase();
    
    // Vue组件检测
    if (this.isVueComponent(element, tagName)) {
      return true;
    }
    
    // Angular组件检测
    if (this.isAngularComponent(element, tagName)) {
      return true;
    }
    
    // 通用自定义元素检测（包含连字符的标签名）
    if (tagName.includes('-') && element.textContent && element.textContent.trim()) {
      return true;
    }
    
    return false;
  }

  isVueComponent(element, tagName) {
    // Vue组件特征检测
    return (
      // Vue自定义标签（包含连字符）
      tagName.includes('-') ||
      // Vue指令属性
      Array.from(element.attributes || []).some(attr => 
        attr.name.startsWith('v-') || 
        attr.name.startsWith(':') || 
        attr.name.startsWith('@') ||
        attr.name.startsWith('data-v-')
      ) ||
      // Vue实例标识
      element.__vue__ ||
      element._vnode ||
      // Vue 3 特征
      element.__vueParentComponent
    );
  }

  isAngularComponent(element, tagName) {
    // Angular组件特征检测
    return (
      // Angular自定义标签
      tagName.includes('-') ||
      // Angular指令属性
      Array.from(element.attributes || []).some(attr => 
        attr.name.startsWith('ng-') || 
        attr.name.startsWith('*ng') ||
        attr.name.startsWith('[') ||
        attr.name.startsWith('(') ||
        attr.name.includes('angular')
      ) ||
      // Angular调试信息
      element.ng ||
      element.__ngContext__ ||
      // Angular元素类名
      element.className && element.className.includes('ng-')
    );
  }
extractElementText(element) {
    // console.log('=== extractElementText 开始 ===');
    // console.log('元素:', element);
    // console.log('元素标签:', element.tagName);
    // console.log('子节点数量:', element.childNodes.length);
    // console.log('是否为支持的元素:', this.isSupportedElement(element));
    
    // 避免提取过长的文本
    let text = '';
    
    // 1. 优先提取直接文本内容（元素直接包含的文本节点）
    const directText = this.extractDirectTextContent(element);
    if (directText) {
      text = directText;
      // console.log('方法1 - 直接文本内容:', text);
    }
    // 2. 如果元素只有一个文本子节点
    else if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
      text = element.childNodes[0].textContent.trim();
      // console.log('方法2 - 单一文本节点:', text);
    }
    // 3. 如果元素本身有文本内容且没有子元素，直接使用
    // else if (element.textContent && element.textContent.trim() && element.children.length === 0) {
    //   text = element.textContent.trim();
    //   // console.log('方法3 - 元素本身文本内容:', text);
    // }
    // 4. 标准HTML元素
    // else if (element.tagName && this.isSupportedElement(element)) {
    //   text = element.textContent.trim();
    //   // console.log('方法4 - 标准HTML元素:', text);
    // }
    // 5. Vue/Angular自定义元素检测
    // else if (this.isFrameworkComponent(element)) {
    //   text = this.extractFrameworkComponentText(element);
    //   // console.log('方法5 - 框架组件:', text);
    // }
    // 6. 属性文本提取
    // else if (element.getAttribute) {
    //   text = this.extractAttributeText(element);
    //   // console.log('方法6 - 属性文本:', text);
    // }
    
    // 7. 如果以上方法都没有提取到文本，尝试查找子元素中的文本
    // if (!text && element.children && element.children.length > 0) {
    //   // 查找第一个有文本内容的子元素
    //   for (let child of element.children) {
    //     if (this.isSupportedElement(child) && child.textContent.trim()) {
    //       text = child.textContent.trim();
    //       // console.log('方法7 - 子元素文本:', text);
    //       break;
    //     }
    //   }
    // }
    
    // 8. 最后尝试：如果元素本身有文本内容，直接使用
    // if (!text && element.textContent && element.textContent.trim()) {
    //   text = element.textContent.trim();
    //   // console.log('方法8 - 元素文本内容:', text);
    // }

    // 限制文本长度，避免过长内容
    // if (text.length > 100) {
    //   // console.log('文本过长，截断');
    //   return '';
    // }

    // console.log('最终提取的文本:', text);
    return text;
  }

  extractDirectTextContent(element) {
    // 提取元素直接包含的文本内容
    // 只提取作为直接子节点的文本节点内容，忽略子元素中的文本
    
    if (!element.childNodes || element.childNodes.length === 0) {
      return '';
    }
    
    let directText = '';
    
    // 遍历直接子节点，只提取文本节点
    for (let i = 0; i < element.childNodes.length; i++) {
      const child = element.childNodes[i];
      
      // 只处理文本节点
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        directText += child.textContent.trim() + ' ';
      }
    }
    
    return directText.trim();
  }
  extractFrameworkComponentText(element) {
    let text = '';
    
    // 1. 尝试获取组件的文本内容
    if (element.textContent && element.textContent.trim()) {
      text = element.textContent.trim();
    }
    
    // 2. 检查Vue特定属性
    if (!text && element.getAttribute) {
      text = element.getAttribute('v-text') || 
             element.getAttribute(':text') ||
             element.getAttribute('v-html') ||
             '';
    }
    
    // 3. 检查Angular特定属性
    if (!text && element.getAttribute) {
      text = element.getAttribute('[innerText]') ||
             element.getAttribute('[innerHTML]') ||
             element.getAttribute('ng-bind') ||
             '';
    }
    
    // 4. 检查aria-label（常用于无障碍）
    if (!text && element.getAttribute) {
      text = element.getAttribute('aria-label') || '';
    }
    
    return text.trim();
  }

  extractAttributeText(element) {
    // 按优先级提取属性文本
    const attributes = [
      'title',
      'alt', 
      'placeholder',
      'aria-label',
      'data-title',
      'data-tooltip',
      'data-original-title', // Bootstrap tooltip
      'tooltip', // 自定义tooltip属性
      'label'
    ];
    
    for (const attr of attributes) {
      const value = element.getAttribute(attr);
      if (value && value.trim()) {
        return value.trim();
      }
    }
    
    return '';
  }

}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedTranslationProcessor;
} else if (typeof window !== 'undefined') {
  window.UnifiedTranslationProcessor = UnifiedTranslationProcessor;
}
