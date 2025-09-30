/**
 * 显示格式化器 - 统一处理翻译结果的显示格式
 * 支持JSON格式和HTML格式的tooltip显示
 */

class DisplayFormatter {
  constructor() {
    // console.log('DisplayFormatter 初始化完成');
  }

  /**
   * 格式化翻译结果为JSON显示格式
   * @param {Element} element - 原始元素
   * @param {Array} translatedSegments - 翻译后的文本段
   * @returns {string} - 格式化的HTML内容
   */
  formatAsJSON(element, translatedSegments) {
    // console.log('=== DisplayFormatter.formatAsJSON 开始 ===');
    // console.log('原始元素:', element);
    // console.log('翻译段数量:', translatedSegments.length);
    // console.log('翻译段数据:', translatedSegments);

    // 构建简洁的翻译数据 - 保持拆分顺序
    const translationPairs = [];

    let hasTranslation = false;

    translatedSegments.forEach((segment, index) => {
      // console.log(`文本段 ${index}:`, {
//         type: segment.type,
//         originalText: segment.originalText,
//         translatedText: segment.translatedText,
//         hasTranslation: segment.translatedText && segment.translatedText !== segment.originalText

// });
      
      if (segment.translatedText && segment.translatedText !== segment.originalText) {
        hasTranslation = true;
        // 保持顺序，添加为数组格式
        translationPairs.push({
          original: segment.originalText,
          translated: segment.translatedText
        });
      }
    });

    // console.log('是否有翻译:', hasTranslation);
    // console.log('翻译对:', translationPairs);

    if (!hasTranslation) {
      return null;
    }

    // 构建JSON字符串，保持顺序并换行显示
    let jsonString;
    try {
      // 手动构建JSON字符串以保持顺序
    //   const jsonParts = translationPairs.map(pair => 
    //     `  "${pair.original.replace(/"/g, '\\"')}": "${pair.translated.replace(/"/g, '\\"')}"`
    //   );
    //   jsonString = `{\n${jsonParts.join(',\n')}\n}`;
      //临时修改为仅展示翻译内容，空格分隔多个中文
      const jsonParts = translationPairs.reduce((acc, pair)  => 
        acc + `  ${pair.translated.replace(/"/g, '\\"') } ` +' ', '');
      jsonString = jsonParts;
      
      // console.log('构建的JSON字符串:', jsonString);
      // console.log('JSON字符串长度:', jsonString.length);
      // console.log('包含换行符数量:', (jsonString.match(/\n/g) || []).length);
    } catch (error) {
      // console.error('JSON构建失败:', error);
      jsonString = '{}';
    }
    
    // 返回格式化的HTML内容 - 确保换行显示
    return `<pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; color: #e0e0e0; background: rgba(0, 0, 0, 0.1); padding: 8px; border-radius: 4px; max-width: 400px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;">${jsonString}</pre>`;
  }

  /**
   * 格式化翻译结果为HTML显示格式
   * @param {Array} translatedSegments - 翻译后的文本段
   * @returns {string} - 格式化的HTML内容
   */
  formatAsHTML(translatedSegments) {
    // console.log('=== DisplayFormatter.formatAsHTML 开始 ===');
    
    let tooltipContent = '';
    let hasTranslation = false;

    translatedSegments.forEach((segment, index) => {
      // console.log(`文本段 ${index}:`, {
//         type: segment.type,
//         originalText: segment.originalText,
//         translatedText: segment.translatedText,
//         hasTranslation: segment.translatedText && segment.translatedText !== segment.originalText

//       });
      
      if (segment.translatedText && segment.translatedText !== segment.originalText) {
        hasTranslation = true;
        tooltipContent += `<div style="margin: 2px 0;">`;
        tooltipContent += `<span style="color: #ffeb3b;">"${segment.originalText}"</span>`;
        tooltipContent += ` → <span style="color: #4caf50;">"${segment.translatedText}"</span>`;
        tooltipContent += `</div>`;
      }
});

    // console.log('是否有翻译:', hasTranslation);
    // console.log('Tooltip内容:', tooltipContent);

    if (!hasTranslation) {
      return null;
    }

    return tooltipContent;
  }

  /**
   * 格式化简单文本翻译
   * @param {string} originalText - 原始文本
   * @param {string} translatedText - 翻译文本
   * @returns {string} - 格式化的HTML内容
   */
  formatSimpleTranslation(originalText, translatedText) {
    // console.log('=== DisplayFormatter.formatSimpleTranslation 开始 ===');
    // console.log('原始文本:', originalText);
    // console.log('翻译文本:', translatedText);

    if (!translatedText || translatedText === originalText) {
      return null;
    }

    return `<div style="margin: 2px 0;">
      <span style="color: #ffeb3b;">"${originalText}"</span>
      → <span style="color: #4caf50;">"${translatedText}"</span>
    </div>`;
  }

  /**
   * 格式化元素信息显示
   * @param {string} elementInfo - 元素信息
   * @returns {string} - 格式化的HTML内容
   */
  formatElementInfo(elementInfo) {
    // console.log('=== DisplayFormatter.formatElementInfo 开始 ===');
    // console.log('元素信息:', elementInfo);

    return `<div style="color: #ff9800; font-style: italic;">${elementInfo}</div>`;
  }

  /**
   * 获取tooltip样式配置
   * @param {string} type - tooltip类型 ('iframe', 'iframe-element', 'iframe-text-segment', 'main', 'text-segment')
   * @returns {Object} - 样式配置对象
   */
  getTooltipStyles(type) {
    const baseStyles = {
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      transform: 'translateY(0)'
    };

    const typeStyles = {
      'iframe': {
        border: '2px solid #2196F3',
        backgroundColor: 'rgba(33, 150, 243, 0.95)'
      },
      'iframe-element': {
        border: '2px solid #4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.95)'
      },
      'iframe-text-segment': {
        border: '2px solid #4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.95)'
      },
      'main': {
        border: '1px solid #666',
        backgroundColor: 'rgba(0, 0, 0, 0.9)'
      },
      'text-segment': {
        border: '2px solid #FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.95)'
      }
    };

    return {
      ...baseStyles,
      ...typeStyles[type] || typeStyles['main']
    };
  }

  /**
   * 应用tooltip样式
   * @param {HTMLElement} tooltip - tooltip元素
   * @param {string} type - tooltip类型
   */
  applyTooltipStyles(tooltip, type) {
    // console.log('=== DisplayFormatter.applyTooltipStyles 开始 ===');
    // console.log('Tooltip类型:', type);

    const styles = this.getTooltipStyles(type);
    
    // 应用样式
    Object.entries(styles).forEach(([property, value]) => {
      if (property === 'opacity' || property === 'transform') {
        tooltip.style.setProperty(property, value, 'important');
      } else {
        tooltip.style[property] = value;
      }
    });

    // console.log('应用的样式:', styles);
  }
}

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DisplayFormatter;
} else if (typeof window !== 'undefined') {
  window.DisplayFormatter = DisplayFormatter;
}
