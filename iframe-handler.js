/**
 * iframe处理模块
 * 负责处理iframe元素的识别、事件绑定和内部元素翻译
 */
class IframeHandler {
  constructor(translationTooltip) {
    this.translationTooltip = translationTooltip;
    this.boundIframes = new Set(); // 记录已绑定的iframe
    this.displayFormatter = null; // 显示格式化器
    this.initDisplayFormatter();
    // // console.log('IframeHandler 初始化完成');
  }

  /**
   * 初始化显示格式化器
   */
  initDisplayFormatter() {
    // // console.log('初始化显示格式化器');
    try {
      // 检查DisplayFormatter是否已加载
      if (typeof DisplayFormatter !== 'undefined') {
        this.displayFormatter = new DisplayFormatter();
        // // console.log('显示格式化器初始化成功');
      } else {
        // // console.warn('DisplayFormatter未找到，将使用默认显示格式');
      }
    } catch (error) {
      // // console.error('初始化显示格式化器失败:', error);
    }
  }

  /**
   * 检查元素是否为iframe
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否为iframe
   */
  isIframe(element) {
    return element && element.tagName === 'IFRAME';
  }

  /**
   * 检查元素是否在iframe内部
   * @param {Element} element - 要检查的元素
   * @returns {boolean} - 是否在iframe内部
   */
  isInsideIframe(element) {
    if (!element) return false;
    
    // 检查元素的文档是否与主窗口文档不同
    return element.ownerDocument !== document;
  }

  /**
   * 检查iframe是否真正准备好进行事件绑定
   * @param {Element} iframeElement - iframe元素
   * @param {Document} iframeDocument - iframe文档
   * @param {Window} iframeWindow - iframe窗口
   * @returns {boolean} - 是否真正准备好
   */
  isIframeTrulyReady(iframeElement, iframeDocument, iframeWindow) {
    // 1. 检查iframe元素本身
    if (!iframeElement || !iframeElement.src) {
      // console.log('iframe元素src无效:', iframeElement?.src);
      return false;
    }
    
    // 特殊处理about:blank
    if (iframeElement.src === 'about:blank') {
      // console.log('iframe src为about:blank，无法绑定事件');
      return false;
    }
    
    // 2. 检查iframe窗口和文档
    if (!iframeWindow || !iframeDocument) {
      // console.log('iframe窗口或文档不可访问');
      return false;
    }
    
    // 3. 检查iframe文档状态
    if (iframeDocument.readyState !== 'complete') {
      // console.log('iframe文档未完全加载，readyState:', iframeDocument.readyState);
      return false;
    }
    
    // 4. 检查iframe窗口location（对跨域iframe更宽容）
    try {
      if (!iframeWindow.location) {
        // console.log('iframe窗口location为null');
        return false;
      }
      
      // 尝试访问href，如果跨域会抛出异常
      const href = iframeWindow.location.href;
      if (href === 'about:blank') {
        // console.log('iframe窗口location无效: about:blank');
        return false;
      }
    } catch (error) {
      // 跨域访问location.href会抛出异常，这是正常的
      // console.log('iframe跨域限制，无法访问location，但可以继续绑定事件');
      // 对于跨域iframe，我们仍然可以尝试绑定事件
    }
    
    // 5. 检查iframe文档是否有body
    if (!iframeDocument.body) {
      // console.log('iframe文档没有body');
      return false;
    }
    
    // 6. 检查iframe文档是否有实际内容
    const elementCount = iframeDocument.querySelectorAll('*').length;
    if (elementCount === 0) {
      // console.log('iframe文档没有元素');
      return false;
    }
    
    // 7. 检查是否有可交互元素
    const interactiveElements = iframeDocument.querySelectorAll('button, a, span, div, p, li, td, th, input, textarea, select');
    if (interactiveElements.length === 0) {
      // console.log('iframe文档没有可交互元素');
      return false;
    }
    
    // console.log('iframe完全准备好，元素数量:', elementCount, '可交互元素:', interactiveElements.length);
    return true;
  }

  /**
   * 处理iframe元素的鼠标悬浮事件
   * @param {Element} iframeElement - iframe元素
   * @param {Event} event - 鼠标事件
   */
  handleIframeElement(iframeElement, event) {
    // // console.log('=== IframeHandler: 处理iframe元素 ===');
    // // console.log('iframe元素:', iframeElement);
    // // console.log('iframe src:', iframeElement.src);
    
    try {
      // 尝试访问iframe的内容窗口
      const iframeWindow = iframeElement.contentWindow;
      const iframeDocument = iframeElement.contentDocument;
      
      if (!iframeWindow || !iframeDocument) {
        // // console.log('无法访问iframe内容，可能是跨域限制');
        this.showIframeInfo(iframeElement, event);
        return;
      }
      
      // // console.log('成功访问iframe内容');
      // console.log('iframe文档标题:', iframeDocument.title);
      // console.log('iframe文档URL:', iframeWindow.location.href);
      
      // 调试iframe状态
      this.debugIframeStatus(iframeElement);
      
      // 在iframe中绑定事件监听器
      this.bindIframeEvents(iframeElement, iframeDocument, iframeWindow);
      
      // 不显示iframe基本信息，让iframe内部的事件处理器来处理
      // console.log('iframe事件绑定完成，等待内部元素事件');
      
    } catch (error) {
      // console.error('访问iframe内容时出错:', error);
      // console.log('可能是跨域安全限制');
      this.showIframeInfo(iframeElement, event);
    }
  }

  /**
   * 在iframe中绑定事件监听器
   * @param {Element} iframeElement - iframe元素
   * @param {Document} iframeDocument - iframe文档
   * @param {Window} iframeWindow - iframe窗口
   */
  bindIframeEvents(iframeElement, iframeDocument, iframeWindow) {
    // console.log('=== IframeHandler: 绑定iframe事件监听器 ===');
    // console.log('iframe元素ID:', iframeElement.id);
    // console.log('iframe元素src:', iframeElement.src);
    // console.log('iframe文档readyState:', iframeDocument.readyState);
    console.log('iframe文档URL:', iframeWindow.location ? iframeWindow.location.href : 'unknown');
    
    try {
      // 检查是否已经绑定过事件（避免重复绑定）
      if (this.boundIframes.has(iframeElement)) {
        console.log('iframe事件已绑定，跳过:', iframeWindow.location ? iframeWindow.location.href : 'unknown');
        return;
      }
      
      // 标记已绑定
      this.boundIframes.add(iframeElement);
      
      // 为iframe创建独立的弹窗检测器
      this.initIframePopupDetector(iframeElement, iframeDocument, iframeWindow);
      
    //   console.log('开始绑定iframe内部事件监听器');
      
      // 在iframe文档中绑定鼠标事件
      const iframeMouseOverHandler = (event) => {
        // console.log('=== iframe内部鼠标悬浮事件 ===');
        // console.log('目标元素:', event.target);
        // console.log('元素标签:', event.target.tagName);
        // console.log('元素文本:', event.target.textContent?.trim());
        // console.log('元素类名:', event.target.className);
        // console.log('事件类型:', event.type);
        // console.log('事件时间戳:', event.timeStamp);
        // // console.log('iframe元素:', iframeElement);
        // console.log('translationTooltip存在:', !!this.translationTooltip);
        
        // 清除隐藏定时器，防止tooltip被意外隐藏
        if (this.translationTooltip.hideTimeout) {
          clearTimeout(this.translationTooltip.hideTimeout);
          this.translationTooltip.hideTimeout = null;
        }
        
        try {
          // 动态重置iframe内元素的pointer-events样式
          this.resetIframeElementPointerEvents(event.target);
          
          // 查找最底层的文本元素
          const deepestTextElement = this.translationTooltip.findDeepestTextElement(event.target);
          // console.log('iframe内最底层文本元素:', deepestTextElement);
          
          // 提取文本并获取翻译
          const element = deepestTextElement || event.target;
          
          // 检查是否应该使用文本段翻译
          if (this.translationTooltip.shouldUseTextSegmentTranslation(element)) {
            // console.log('iframe内使用文本段翻译处理元素');
            this.handleIframeTextSegmentTranslation(element, event, iframeElement);
            return;
          }
          
          // 原有的简单文本翻译逻辑
          const text = this.translationTooltip.extractElementText(element);
          // console.log('iframe内提取的文本:', text);
          
          if (!text) {
            // console.log('iframe内没有提取到文本，不显示tooltip');
            // 如果没有文本，直接返回，不显示任何tooltip
            return;
          }
          
          const translation = this.translationTooltip.getTranslation(text, element);
          // console.log('iframe内翻译结果:', translation);
          
          if (!translation || translation === text) {
            // console.log('iframe内没有找到翻译，显示原始文本');
            // 如果没有翻译，显示原始文本
            this.showElementInfoInIframe(text, event, iframeElement);
            return;
          }
          
          // 计算iframe内元素在主窗口中的位置
          const iframeRect = iframeElement.getBoundingClientRect();
          const elementRect = event.target.getBoundingClientRect();
          
          // 创建模拟事件对象，用于定位tooltip
          const simulatedEvent = {
            clientX: iframeRect.left + elementRect.left + elementRect.width / 2,
            clientY: iframeRect.top + elementRect.top + elementRect.height / 2
          };
          
          // console.log('iframe内元素位置:', {
//             iframeRect: iframeRect,
//             elementRect: elementRect,
//             simulatedEvent: simulatedEvent

// });
          
          // 显示翻译提示
          this.showTooltipForIframeElement(translation, simulatedEvent, iframeElement);
        } catch (error) {
          // console.error('iframe内部事件处理出错:', error);
          // console.error('错误堆栈:', error.stack);
        }
      };
      
      const iframeMouseOutHandler = (event) => {
        // console.log('=== iframe内部鼠标离开事件 ===');
        
        // 清除显示定时器
        if (this.translationTooltip.hoverTimeout) {
          clearTimeout(this.translationTooltip.hoverTimeout);
          this.translationTooltip.hoverTimeout = null;
        }
        
        // 延迟隐藏tooltip，给用户更多时间移动到tooltip上
        this.translationTooltip.hideTimeout = setTimeout(() => {
          this.translationTooltip.hideTooltip();
        }, 200);
      };
      
      // 绑定事件到iframe文档的document和body
      const iframeUrl = iframeDocument.location ? iframeDocument.location.href : 'unknown';
    //   console.log('开始绑定iframe事件监听器...:', iframeUrl);
      
      // 只绑定到document，避免重复绑定导致的事件冲突
      iframeDocument.addEventListener('mouseover', iframeMouseOverHandler, true);
      iframeDocument.addEventListener('mouseout', iframeMouseOutHandler, true);
      
      // 为iframe内部添加弹窗检测功能
      this.setupIframePopupDetection(iframeDocument, iframeWindow);
      
      console.log('iframe document事件监听器绑定成功: ', iframeDocument.location&&iframeDocument.location.href);
      
      // console.log('iframe可交互元素事件监听器绑定完成');
      
      // 测试事件绑定是否成功
      // console.log('测试iframe事件绑定...');
      const testElements = iframeDocument.querySelectorAll('button, span, div');
      // console.log(`iframe中找到 ${testElements.length} 个测试元素`);
      
      if (testElements.length > 0) {
        const firstElement = testElements[0];
        // console.log('第一个测试元素:', {
//           tagName: firstElement.tagName,
//           textContent: firstElement.textContent?.trim(),
//           className: firstElement.className,
//           id: firstElement.id

// });
        
        // 测试事件监听器是否真的绑定了
        const hasListeners = iframeDocument.addEventListener ? true : false;
        // console.log('iframe事件监听器状态:', hasListeners);
      } else {
        // console.log('iframe中未找到任何可测试元素');
      }
      
      // 监听iframe内容变化，重新绑定事件
      const observer = new MutationObserver((mutations) => {
        // console.log('iframe内容发生变化，检查是否需要重新绑定事件');
        
        // 检查是否有实际的内容变化
        let hasSignificantChange = false;
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 检查新增的节点是否包含可交互元素
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const interactiveElements = node.querySelectorAll ? 
                  node.querySelectorAll('button, a, span, div, p, li, td, th, input, textarea, select') : [];
                if (interactiveElements.length > 0) {
                  hasSignificantChange = true;
                }
              }
            });
          }
        });
        
        // 只有在有重要变化时才重新绑定
        if (hasSignificantChange) {
          console.log('iframe内容发生重要变化，重新绑定事件');
          
          // 移除旧的事件监听器
          iframeDocument.removeEventListener('mouseover', iframeMouseOverHandler, true);
          iframeDocument.removeEventListener('mouseout', iframeMouseOutHandler, true);
          
          if (iframeDocument.body) {
            iframeDocument.body.removeEventListener('mouseover', iframeMouseOverHandler, true);
            iframeDocument.body.removeEventListener('mouseout', iframeMouseOutHandler, true);
          }
          
          // 重新绑定
          setTimeout(() => {
            console.log('iframe document事件监听器重新绑定成功: ', iframeDocument.location&&iframeDocument.location.href);
            iframeDocument.addEventListener('mouseover', iframeMouseOverHandler, true);
            iframeDocument.addEventListener('mouseout', iframeMouseOutHandler, true);
            // console.log('iframe事件重新绑定完成');
          }, 100);
        }
      });
      
      // 开始观察iframe内容变化
      if (iframeDocument.body) {
        observer.observe(iframeDocument.body, {
          childList: true,
          subtree: true
        });
      }
      
      // 存储observer引用，用于清理
      iframeElement._translationObserver = observer;
      
      console.log('iframe事件绑定完成，等待内部元素事件');
      
    } catch (error) {
      // console.error('绑定iframe事件时出错:', error);
    }
  }

  /**
   * 显示iframe基本信息
   * @param {Element} iframeElement - iframe元素
   * @param {Event} event - 鼠标事件
   */
  showIframeInfo(iframeElement, event) {
    // console.log('=== IframeHandler: 显示iframe信息 ===');
    
    const iframeInfo = {
      tagName: iframeElement.tagName,
      id: iframeElement.id,
      src: iframeElement.src,
      width: iframeElement.width,
      height: iframeElement.height,
      className: iframeElement.className
    };
    
    // console.log('iframe信息:', iframeInfo);
    
    // 显示iframe基本信息
    const infoText = `iframe: ${iframeInfo.src || '无src'}`;
    this.showTooltipForIframe(infoText, event);
  }

  /**
   * 显示iframe元素信息摘要
   * @param {Element} iframeElement - iframe元素
   * @param {Array} elements - 找到的元素列表
   * @param {Event} event - 鼠标事件
   */
  showIframeElementsInfo(iframeElement, elements, event) {
    // console.log('=== IframeHandler: 显示iframe元素信息 ===');
    
    // 创建元素信息摘要
    const elementSummary = elements.map(el => `${el.tagName.toLowerCase()}: ${el.text}`).join('\n');
    const summaryText = `iframe中的元素 (${elements.length}个):\n${elementSummary}`;
    
    // console.log('iframe元素摘要:', summaryText);
    
    // 显示元素摘要
    this.showTooltipForIframe(summaryText, event);
  }

  /**
   * 为iframe显示tooltip
   * @param {string} text - 要显示的文本
   * @param {Event} event - 鼠标事件
   */
  showTooltipForIframe(text, event) {
    // console.log('=== IframeHandler: 为iframe显示tooltip ===');
    
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
      this.translationTooltip.tooltip.textContent = text;
      this.translationTooltip.positionTooltip(event);
      
      // 强制设置显示状态
      this.translationTooltip.tooltip.style.display = 'block';
      this.translationTooltip.tooltip.style.visibility = 'visible';
      
      // 使用requestAnimationFrame确保样式应用后再显示动画
      requestAnimationFrame(() => {
        this.translationTooltip.tooltip.style.setProperty('opacity', '1', 'important');
        this.translationTooltip.tooltip.style.setProperty('transform', 'translateY(0)', 'important');
        // console.log('iframe tooltip显示完成');
      });
    }, 300);
  }

  /**
   * 为iframe内部元素显示tooltip
   * @param {string} translation - 翻译内容
   * @param {Object} simulatedEvent - 模拟事件对象
   * @param {Element} iframeElement - iframe元素
   */
  showTooltipForIframeElement(translation, simulatedEvent, iframeElement) {
    // console.log('=== IframeHandler: 为iframe内部元素显示tooltip ===');
    // console.log('翻译内容:', translation);
    // console.log('模拟事件位置:', simulatedEvent);
    // // console.log('iframe元素:', iframeElement);
    // console.log('translationTooltip存在:', !!this.translationTooltip);
    // console.log('tooltip元素存在:', !!this.translationTooltip?.tooltip);
    
    // 验证必要参数
    if (!this.translationTooltip) {
      // console.error('translationTooltip不存在，无法显示tooltip');
      return;
    }
    
    if (!this.translationTooltip.tooltip) {
      // console.error('tooltip元素不存在，无法显示tooltip');
      return;
    }
    
    if (!translation) {
      // console.error('翻译内容为空，无法显示tooltip');
      return;
    }
    
    // 清除之前的定时器
    if (this.translationTooltip.hoverTimeout) {
      clearTimeout(this.translationTooltip.hoverTimeout);
    }
    if (this.translationTooltip.hideTimeout) {
      clearTimeout(this.translationTooltip.hideTimeout);
    }
    
    // 延迟显示tooltip
    this.translationTooltip.hoverTimeout = setTimeout(() => {
      try {
        // console.log('开始显示iframe内部tooltip');
        
        this.translationTooltip.currentElement = null; // iframe内部元素情况下不设置currentElement
        this.translationTooltip.tooltip.textContent = translation;
        
        // console.log('tooltip内容已设置:', this.translationTooltip.tooltip.textContent);
        
        // 使用模拟事件位置来定位tooltip
        this.translationTooltip.positionTooltip(simulatedEvent);
        
        // console.log('tooltip位置已设置:', {
//           left: this.translationTooltip.tooltip.style.left,
//           top: this.translationTooltip.tooltip.style.top

// });
        
        // 强制设置显示状态
        this.translationTooltip.tooltip.style.display = 'block';
        this.translationTooltip.tooltip.style.visibility = 'visible';
        
        // 添加特殊样式标识这是iframe内部的tooltip
        this.translationTooltip.tooltip.style.border = '2px solid #4CAF50';
        this.translationTooltip.tooltip.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
        
        // console.log('tooltip样式已设置:', {
//           display: this.translationTooltip.tooltip.style.display,
//           visibility: this.translationTooltip.tooltip.style.visibility,
//           border: this.translationTooltip.tooltip.style.border,
//           backgroundColor: this.translationTooltip.tooltip.style.backgroundColor

// });
        
        // 使用requestAnimationFrame确保样式应用后再显示动画
        requestAnimationFrame(() => {
          this.translationTooltip.tooltip.style.setProperty('opacity', '1', 'important');
          this.translationTooltip.tooltip.style.setProperty('transform', 'translateY(0)', 'important');
          
          // console.log('iframe内部元素tooltip显示完成');
          // console.log('最终tooltip状态:', {
//             display: this.translationTooltip.tooltip.style.display,
//             visibility: this.translationTooltip.tooltip.style.visibility,
//             opacity: this.translationTooltip.tooltip.style.opacity,
//             transform: this.translationTooltip.tooltip.style.transform,
//             left: this.translationTooltip.tooltip.style.left,
//             top: this.translationTooltip.tooltip.style.top

//           });
});
      } catch (error) {
        // console.error('显示iframe内部tooltip时出错:', error);
        // console.error('错误堆栈:', error.stack);
      }
    }, 200); // 稍微快一点的响应时间
  }

  /**
   * 处理iframe内部的文本段翻译
   * @param {Element} element - 要翻译的元素
   * @param {Event} event - 鼠标事件
   * @param {Element} iframeElement - iframe元素
   */
  handleIframeTextSegmentTranslation(element, event, iframeElement) {
    // console.log('=== handleIframeTextSegmentTranslation 开始执行 ===');
    // console.log('目标元素:', element);
    // console.log('元素HTML:', element.innerHTML);
    
    try {
      // 直接复用TextSegmentTranslator的核心方法
      const translator = this.translationTooltip.textSegmentTranslator;
      
      // 1. 复用analyzeElementStructure方法分析元素结构
      const segments = translator.analyzeElementStructure(element);
      // console.log('iframe内分析的文本段:', segments);
      
      if (!segments || segments.length === 0) {
        // console.log('iframe内没有分析到文本段，退出');
        return;
      }

      // 2. 复用translateText方法翻译每个文本段
      const translatedSegments = segments.map(segment => {
        const translatedText = translator.translateText(segment.text);
        return {
          ...segment,
          translatedText: translatedText,
          originalText: segment.text
        };
      });

      // console.log('iframe内翻译后的文本段:', translatedSegments);

      // 3. 使用显示格式化器构建JSON格式的翻译结果显示
      let tooltipContent = '';
      let hasTranslation = false;

      if (this.displayFormatter) {
        // console.log('iframe内使用DisplayFormatter进行JSON格式显示');
        // console.log('iframe内传入的segments:', translatedSegments);
        // 使用JSON格式显示
        tooltipContent = this.displayFormatter.formatAsJSON(element, translatedSegments);
        hasTranslation = tooltipContent !== null;
        // console.log('iframe内JSON格式tooltip内容:', tooltipContent);
        // console.log('iframe内hasTranslation:', hasTranslation);
      } else {
        // 降级到HTML格式显示
        translatedSegments.forEach((segment, index) => {
          // console.log(`iframe内文本段 ${index}:`, {
//             type: segment.type,
//             originalText: segment.originalText,
//             translatedText: segment.translatedText,
//             hasTranslation: segment.translatedText && segment.translatedText !== segment.originalText

//           });
          
          if (segment.translatedText && segment.translatedText !== segment.originalText) {
            hasTranslation = true;
            tooltipContent += `<div style="margin: 2px 0;">`;
            tooltipContent += `<span style="color: #ffeb3b;">"${segment.originalText}"</span>`;
            tooltipContent += ` → <span style="color: #4caf50;">"${segment.translatedText}"</span>`;
            tooltipContent += `</div>`;
          }
        });
        // console.log('iframe内HTML格式tooltip内容:', tooltipContent);
      }

      // console.log('iframe内是否有翻译:', hasTranslation);

      if (!hasTranslation) {
        // console.log('iframe内没有找到任何翻译，显示原始文本');
        this.showElementInfoInIframe(element.textContent, event, iframeElement);
        return;
      }

      // 计算iframe内元素在主窗口中的位置
      const iframeRect = iframeElement.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // 创建模拟事件对象，用于定位tooltip
      const simulatedEvent = {
        clientX: iframeRect.left + elementRect.left + elementRect.width / 2,
        clientY: iframeRect.top + elementRect.top + elementRect.height / 2
      };

      // 显示文本段翻译tooltip
      this.showTextSegmentTooltipForIframe(tooltipContent, simulatedEvent, iframeElement);

    } catch (error) {
      // console.error('iframe内文本段翻译失败:', error);
      // 降级到显示原始文本
      this.showElementInfoInIframe(element.textContent, event, iframeElement);
    }
  }

  /**
   * 为iframe内部元素显示文本段翻译tooltip
   * @param {string} tooltipContent - tooltip内容
   * @param {Object} simulatedEvent - 模拟事件对象
   * @param {Element} iframeElement - iframe元素
   */
  showTextSegmentTooltipForIframe(tooltipContent, simulatedEvent, iframeElement) {
    // console.log('=== showTextSegmentTooltipForIframe 开始执行 ===');
    
    // 清除之前的定时器
    if (this.translationTooltip.hoverTimeout) {
      clearTimeout(this.translationTooltip.hoverTimeout);
    }
    if (this.translationTooltip.hideTimeout) {
      clearTimeout(this.translationTooltip.hideTimeout);
    }
    
    // 延迟显示tooltip
    this.translationTooltip.hoverTimeout = setTimeout(() => {
      this.translationTooltip.currentElement = null;
      this.translationTooltip.tooltip.innerHTML = tooltipContent;
      
      // 使用模拟事件位置来定位tooltip
      this.translationTooltip.positionTooltip(simulatedEvent);
      
      // 强制设置显示状态
      this.translationTooltip.tooltip.style.display = 'block';
      this.translationTooltip.tooltip.style.visibility = 'visible';
      
      // 使用显示格式化器应用样式
      if (this.displayFormatter) {
        this.displayFormatter.applyTooltipStyles(this.translationTooltip.tooltip, 'iframe-text-segment');
      } else {
        // 降级到手动设置样式
        this.translationTooltip.tooltip.style.border = '2px solid #4CAF50';
        this.translationTooltip.tooltip.style.backgroundColor = 'rgba(76, 175, 80, 0.95)';
      }
      
      // console.log('iframe内文本段翻译Tooltip位置:', {
//         left: this.translationTooltip.tooltip.style.left,
//         top: this.translationTooltip.tooltip.style.top,
//         display: this.translationTooltip.tooltip.style.display,
//         visibility: this.translationTooltip.tooltip.style.visibility

// });
      
      // 使用requestAnimationFrame确保样式应用后再显示动画
      requestAnimationFrame(() => {
        this.translationTooltip.tooltip.style.setProperty('opacity', '1', 'important');
        this.translationTooltip.tooltip.style.setProperty('transform', 'translateY(0)', 'important');
        // console.log('iframe内文本段翻译Tooltip显示动画完成');
      });
    }, 200);
  }

  /**
   * 为iframe内部元素显示基本信息
   * @param {string} elementInfo - 元素信息
   * @param {Event} event - 鼠标事件
   * @param {Element} iframeElement - iframe元素
   */
  showElementInfoInIframe(elementInfo, event, iframeElement) {
    // console.log('=== IframeHandler: 为iframe内部元素显示基本信息 ===');
    // console.log('元素信息:', elementInfo);
    
    // 计算iframe内元素在主窗口中的位置
    const iframeRect = iframeElement.getBoundingClientRect();
    const elementRect = event.target.getBoundingClientRect();
    
    // 创建模拟事件对象，用于定位tooltip
    const simulatedEvent = {
      clientX: iframeRect.left + elementRect.left + elementRect.width / 2,
      clientY: iframeRect.top + elementRect.top + elementRect.height / 2
    };
    
    // 清除之前的定时器
    if (this.translationTooltip.hoverTimeout) {
      clearTimeout(this.translationTooltip.hoverTimeout);
    }
    if (this.translationTooltip.hideTimeout) {
      clearTimeout(this.translationTooltip.hideTimeout);
    }
    
    // 延迟显示tooltip
    this.translationTooltip.hoverTimeout = setTimeout(() => {
      this.translationTooltip.currentElement = null;
      this.translationTooltip.tooltip.textContent = elementInfo;
      
      // 使用模拟事件位置来定位tooltip
      this.translationTooltip.positionTooltip(simulatedEvent);
      
      // 强制设置显示状态
      this.translationTooltip.tooltip.style.display = 'block';
      this.translationTooltip.tooltip.style.visibility = 'visible';
      
      // 添加特殊样式标识这是iframe内部的元素信息
      this.translationTooltip.tooltip.style.border = '2px solid #FF9800';
      this.translationTooltip.tooltip.style.backgroundColor = 'rgba(255, 152, 0, 0.95)';
      
      // 使用requestAnimationFrame确保样式应用后再显示动画
      requestAnimationFrame(() => {
        this.translationTooltip.tooltip.style.setProperty('opacity', '1', 'important');
        this.translationTooltip.tooltip.style.setProperty('transform', 'translateY(0)', 'important');
        // console.log('iframe内部元素信息显示完成');
      });
    }, 200);
  }

  /**
   * 清理iframe事件监听器
   * @param {Element} iframeElement - iframe元素
   */
  cleanupIframeEvents(iframeElement) {
    // console.log('=== IframeHandler: 清理iframe事件 ===');
    
    try {
      // 移除translation observer
      if (iframeElement._translationObserver) {
        iframeElement._translationObserver.disconnect();
        delete iframeElement._translationObserver;
      }
      
      // 移除src变化监听器
      if (iframeElement._srcChangeObserver) {
        iframeElement._srcChangeObserver.disconnect();
        delete iframeElement._srcChangeObserver;
      }
      
      // 从已绑定集合中移除
      this.boundIframes.delete(iframeElement);
      
      // console.log('iframe事件清理完成');
    } catch (error) {
      // console.error('清理iframe事件时出错:', error);
    }
  }


  /**
   * 清理所有iframe事件监听器
   */
  cleanupAllIframeEvents() {
    // console.log('=== IframeHandler: 清理所有iframe事件 ===');
    
    this.boundIframes.forEach(iframeElement => {
      this.cleanupIframeEvents(iframeElement);
    });
    
    this.boundIframes.clear();
    // console.log('所有iframe事件清理完成');
  }

  /**
   * 主动检测并绑定页面中的所有iframe
   * 这个方法应该在页面初始化时调用
   */
  detectAndBindAllIframes() {
    // console.log('=== IframeHandler: 主动检测页面中的所有iframe ===');
    
    const iframes = document.querySelectorAll('iframe');
    // console.log(`找到 ${iframes.length} 个iframe元素`);
    
    iframes.forEach((iframe, index) => {
      // console.log(`处理iframe ${index + 1}:`, {
//         id: iframe.id,
//         src: iframe.src,
//         className: iframe.className,
//         width: iframe.width,
//         height: iframe.height

// });
      
      // 检查是否已经绑定过
      if (this.boundIframes.has(iframe)) {
        // console.log(`iframe ${index + 1} 已绑定，跳过`);
        return;
      }
      
      // 为每个iframe添加src变化监听器
      this.addIframeSrcChangeListener(iframe);
      
      // 尝试访问iframe内容
      this.tryBindIframeEvents(iframe, 0);
    });
    
    // console.log('所有iframe检测和绑定完成');
  }

  /**
   * 为iframe添加src变化监听器
   * @param {Element} iframe - iframe元素
   */
  addIframeSrcChangeListener(iframe) {
    // 监听iframe的src属性变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
          const oldSrc = mutation.oldValue || 'unknown';
          const newSrc = iframe.src;
          console.log('检测到iframe src变化:', oldSrc, '->', newSrc);
          
          // 特殊处理从about:blank到实际URL的变化
          if (oldSrc === 'about:blank' && newSrc !== 'about:blank') {
            console.log('iframe从about:blank加载到实际内容，延迟绑定事件');
            setTimeout(() => {
              this.tryBindIframeEvents(iframe, 0); // 重置重试次数
            }, 2000); // 给更多时间加载
          } else if (newSrc !== 'about:blank') {
            // 其他src变化
            setTimeout(() => {
              this.tryBindIframeEvents(iframe, 0); // 重置重试次数
            }, 1000);
          }
        }
      });
    });
    
    observer.observe(iframe, {
      attributes: true,
      attributeFilter: ['src'],
      attributeOldValue: true // 记录旧值
    });
    
    // 存储observer引用
    iframe._srcChangeObserver = observer;
  }

  /**
   * 尝试绑定iframe事件（带重试机制）
   * @param {Element} iframe - iframe元素
   * @param {number} retryCount - 当前重试次数
   */
  tryBindIframeEvents(iframe, retryCount = 0) {
    const maxRetries = 5; // 最大重试次数
    
    // 检查是否已经绑定过
    if (this.boundIframes.has(iframe)) {
      // console.log('iframe已绑定，跳过:', iframe.src);
      return;
    }
    
    // 检查重试次数
    if (retryCount >= maxRetries) {
      // console.log(`iframe重试次数已达上限(${maxRetries})，停止重试:`, iframe.src);
      return;
    }
    
    // 特殊处理about:blank
    if (iframe.src === 'about:blank') {
      if (retryCount === 0) {
        // console.log('iframe src为about:blank，等待实际内容加载...');
        // 对于about:blank，只重试3次，间隔更长
        setTimeout(() => {
          this.tryBindIframeEvents(iframe, retryCount + 1);
        }, 3000);
      } else if (retryCount < 3) {
        // console.log(`about:blank iframe重试(${retryCount + 1}/3)，等待内容加载...`);
        setTimeout(() => {
          this.tryBindIframeEvents(iframe, retryCount + 1);
        }, 3000);
      } else {
        // console.log('about:blank iframe重试次数已达上限(3)，停止重试');
      }
      return;
    }
    
    // 检查iframe是否有有效的src
    if (!iframe.src || iframe.src === '') {
      // console.log(`iframe src为空，延迟重试(${retryCount + 1}/${maxRetries}):`, iframe.src);
      // 延迟重试
      setTimeout(() => {
        this.tryBindIframeEvents(iframe, retryCount + 1);
      }, 2000);
      return;
    }
    
    // 尝试访问iframe内容
    try {
      const iframeWindow = iframe.contentWindow;
      const iframeDocument = iframe.contentDocument;
      
      if (!iframeWindow || !iframeDocument) {
        // console.log(`iframe无法访问，可能是跨域限制或未加载完成(${retryCount + 1}/${maxRetries})`);
        // 延迟重试
        setTimeout(() => {
          this.tryBindIframeEvents(iframe, retryCount + 1);
        }, 2000);
        return;
      }
      
      // 使用新的严格检查方法
      if (!this.isIframeTrulyReady(iframe, iframeDocument, iframeWindow)) {
        // console.log(`iframe未完全准备好，延迟重试(${retryCount + 1}/${maxRetries})`);
        // 延迟重试
        setTimeout(() => {
          this.tryBindIframeEvents(iframe, retryCount + 1);
        }, 1500);
        return;
      }
      
      // console.log('iframe完全准备好，开始绑定事件:', iframe.src);
      this.bindIframeEvents(iframe, iframeDocument, iframeWindow);
      
    } catch (error) {
      // console.error(`访问iframe时出错(${retryCount + 1}/${maxRetries}):`, error);
      // 延迟重试
      setTimeout(() => {
        this.tryBindIframeEvents(iframe, retryCount + 1);
      }, 2000);
    }
  }

  /**
   * 延迟检测iframe（用于处理动态加载的iframe）
   * @param {number} delay - 延迟时间（毫秒）
   */
  delayedDetectIframes(delay = 2000) {
    // 防止重复延迟检测
    if (this._delayedDetectionScheduled) {
      console.log('延迟检测已安排，跳过重复检测');
      return;
    }
    
    this._delayedDetectionScheduled = true;
    console.log(`延迟 ${delay}ms 后检测iframe`);
    
    setTimeout(() => {
      console.log('开始延迟检测iframe');
      this.detectAndBindAllIframes();
      this._delayedDetectionScheduled = false; // 重置标志
    }, delay);
  }

  /**
   * 调试iframe状态的方法
   * @param {Element} iframeElement - iframe元素
   */
  debugIframeStatus(iframeElement) {
    // console.log('=== IframeHandler: 调试iframe状态 ===');
    
    try {
      const iframeWindow = iframeElement.contentWindow;
      const iframeDocument = iframeElement.contentDocument;
      
      // console.log('iframe基本信息:', {
//         id: iframeElement.id,
//         src: iframeElement.src,
//         width: iframeElement.width,
//         height: iframeElement.height,
//         className: iframeElement.className,
//         isBound: this.boundIframes.has(iframeElement)

// });
      
      // console.log('iframe访问状态:', {
//         canAccessWindow: !!iframeWindow,
//         canAccessDocument: !!iframeDocument,
//         documentReadyState: iframeDocument ? iframeDocument.readyState : 'N/A',
//         hasBody: iframeDocument ? !!iframeDocument.body : false,
//         bodyChildrenCount: iframeDocument && iframeDocument.body ? iframeDocument.body.children.length : 0

// });
      
      if (iframeDocument) {
        // console.log('iframe文档信息:', {
//           title: iframeDocument.title,
//           url: iframeWindow ? iframeWindow.location.href : 'N/A',
//           elementCount: iframeDocument.querySelectorAll('*').length,
//           buttonCount: iframeDocument.querySelectorAll('button').length,
//           textElements: iframeDocument.querySelectorAll('span, div, p').length

// });
      }
      
      // console.log('translationTooltip状态:', {
//         exists: !!this.translationTooltip,
//         tooltipExists: !!this.translationTooltip?.tooltip,
//         textSegmentTranslatorExists: !!this.translationTooltip?.textSegmentTranslator,
//         displayFormatterExists: !!this.translationTooltip?.displayFormatter

// });
      
    } catch (error) {
      // console.error('调试iframe状态时出错:', error);
    }
  }

  /**
   * 为iframe内部设置弹窗检测功能
   * 复用轻量级弹窗检测器
   * @param {Document} iframeDocument - iframe文档
   * @param {Window} iframeWindow - iframe窗口
   */
  setupIframePopupDetection(iframeDocument, iframeWindow) {
    console.log('为iframe内部设置弹窗检测功能（复用轻量级弹窗检测器）');
    
    // 检查LightweightPopupDetector是否可用
    if (typeof LightweightPopupDetector === 'undefined') {
      console.warn('LightweightPopupDetector不可用，iframe内部弹窗检测功能将不可用');
      return;
    }
    
    // 创建iframe内部的轻量级弹窗检测器实例
    const iframePopupDetector = new LightweightPopupDetector(this, 'iframe');
    
    // 设置iframe上下文
    iframePopupDetector.setupIframeContext(iframeDocument, iframeWindow);
    
    // 设置用户交互触发器
    iframePopupDetector.setupUserInteractionTriggers();
    
    // 存储检测器引用，便于后续使用
    this.iframePopupDetector = iframePopupDetector;
    
    console.log('iframe内部弹窗检测功能设置完成（使用轻量级弹窗检测器）');
  }

  /**
   * 重置iframe内元素的pointer-events样式
   * 调用主窗口的公共方法，传入'iframe'上下文
   * @param {Element} element - iframe内要重置样式的元素
   */
  resetIframeElementPointerEvents(element) {
    // 调用主窗口的公共方法
    if (this.translationTooltip && this.translationTooltip.resetElementPointerEvents) {
      this.translationTooltip.resetElementPointerEvents(element, 'iframe');
    } else {
      // console.warn('无法访问主窗口的resetElementPointerEvents方法');
    }
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IframeHandler;
} else if (typeof window !== 'undefined') {
  window.IframeHandler = IframeHandler;
}
