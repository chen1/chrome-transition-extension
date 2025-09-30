/*
 * @Author: chenjie chenjie@huimei.com
 * @Date: 2025-09-30 15:20:00
 * @LastEditors: chenjie chenjie@huimei.com
 * @LastEditTime: 2025-09-30 15:47:53
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
    const text = this.translationTooltip.extractElementText(element);
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
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedTranslationProcessor;
} else if (typeof window !== 'undefined') {
  window.UnifiedTranslationProcessor = UnifiedTranslationProcessor;
}
