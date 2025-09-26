/**
 * 翻译服务类
 * 负责处理文本翻译的核心逻辑
 * 支持多种匹配策略和扩展功能
 */
class TranslationService {
  constructor() {
    this.translationDict = {};
    this.cache = new Map(); // 翻译缓存
    this.matchStrategies = [
      'exact',
      'trimmed',
      'lowercase',
      'lowercaseTrimmed',
      'fuzzy',
      'partial'
    ];
  }

  /**
   * 设置翻译字典
   * @param {Object} dict - 翻译字典对象
   */
  setTranslationDict(dict) {
    this.translationDict = dict;
    // console.log('翻译服务字典已更新，包含', Object.keys(dict).length, '个条目');
  }

  /**
   * 获取翻译结果
   * @param {string} text - 要翻译的文本
   * @param {Object} options - 翻译选项
   * @param {Element} element - 可选的DOM元素，用于特殊匹配策略
   * @returns {string|null} - 翻译结果或null
   */
  getTranslation(text, options = {}, element = null) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    // 检查缓存
    const cacheKey = `${text}_${JSON.stringify(options)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = this.findTranslation(text, options, element);
    
    // 缓存结果
    this.cache.set(cacheKey, result);
    
    return result;
  }

  /**
   * 查找翻译的核心方法
   * @param {string} text - 要翻译的文本
   * @param {Object} options - 翻译选项
   * @param {Element} element - 可选的DOM元素，用于特殊匹配策略
   * @returns {string|null} - 翻译结果或null
   */
  findTranslation(text, options = {}, element = null) {
    // 首先检查是否为 hdrcell 特殊匹配
    if (element && this.isHdrCellElement(element)) {
      const hdrResult = this.hdrCellMatch(text, element);
      if (hdrResult) {
        // console.log(`使用 hdrcell 策略找到翻译:`, text, '->', hdrResult);
        return hdrResult;
      }
    }

    const strategies = options.strategies || this.matchStrategies;
    
    for (const strategy of strategies) {
      const result = this.tryStrategy(text, strategy);
      if (result) {
        // console.log(`使用策略 "${strategy}" 找到翻译:`, text, '->', result);
        return result;
      }
    }

    return null;
  }

  /**
   * 尝试特定的匹配策略
   * @param {string} text - 要翻译的文本
   * @param {string} strategy - 匹配策略
   * @returns {string|null} - 翻译结果或null
   */
  tryStrategy(text, strategy) {
    switch (strategy) {
      case 'exact':
        return this.exactMatch(text);
      
      case 'trimmed':
        return this.trimmedMatch(text);
      
      case 'lowercase':
        return this.lowercaseMatch(text);
      
      case 'lowercaseTrimmed':
        return this.lowercaseTrimmedMatch(text);
      
    //   case 'fuzzy':
    //     return this.fuzzyMatch(text);
      
    //   case 'partial':
    //     return this.partialMatch(text);
      
      default:
        return null;
    }
  }

  /**
   * 精确匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  exactMatch(text) {
    return this.translationDict[text] || null;
  }

  /**
   * 去除首尾空格匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  trimmedMatch(text) {
    const trimmedText = text.trim();
    return this.translationDict[trimmedText] || null;
  }

  /**
   * 小写匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  lowercaseMatch(text) {
    const normalizedText = text.toLowerCase();
    return this.translationDict[normalizedText] || null;
  }

  /**
   * 小写+去除首尾空格匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  lowercaseTrimmedMatch(text) {
    const normalizedTrimmedText = text.trim().toLowerCase();
    return this.translationDict[normalizedTrimmedText] || null;
  }

  /**
   * 模糊匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  fuzzyMatch(text) {
    const normalizedText = text.trim().toLowerCase();
    
    // 查找包含该文本的键
    for (const [key, value] of Object.entries(this.translationDict)) {
      const normalizedKey = key.trim().toLowerCase();
      
      // 如果键包含文本或文本包含键
      if (normalizedKey.includes(normalizedText) || normalizedText.includes(normalizedKey)) {
        return value;
      }
    }
    
    return null;
  }

  /**
   * 部分匹配
   * @param {string} text - 要翻译的文本
   * @returns {string|null} - 翻译结果或null
   */
  partialMatch(text) {
    const normalizedText = text.trim().toLowerCase();
    
    // 按长度排序，优先匹配较长的键
    const sortedKeys = Object.keys(this.translationDict)
      .sort((a, b) => b.length - a.length);
    
    for (const key of sortedKeys) {
      const normalizedKey = key.trim().toLowerCase();
      
      // 如果文本是键的子串
      if (normalizedKey.includes(normalizedText) && normalizedText.length >= 3) {
        return this.translationDict[key];
      }
    }
    
    return null;
  }

  /**
   * 检查是否为 hdrcell 元素
   * @param {Element} element - DOM元素
   * @returns {boolean} - 是否为 hdrcell 元素
   */
  isHdrCellElement(element) {
    if (!element || !element.classList) {
      return false;
    }
    
    // 检查元素是否有 hdrcell 类
    const hasHdrCellClass = element.classList.contains('hdrcell');
    
    // 检查父元素是否为 td 或 th
    const parentElement = element.parentElement;
    const isParentTableCell = parentElement && 
      (parentElement.tagName.toLowerCase() === 'td' || 
       parentElement.tagName.toLowerCase() === 'th');
    
    return hasHdrCellClass && isParentTableCell;
  }

  /**
   * hdrcell 特殊匹配策略
   * @param {string} text - 要翻译的文本
   * @param {Element} element - DOM元素
   * @returns {string|null} - 翻译结果或null
   */
  hdrCellMatch(text, element) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    const normalizedText = text.trim();
    
    // 遍历字典查找包含该文本的 key
    for (const [key, value] of Object.entries(this.translationDict)) {
      // 检查 key 是否包含该文本
      if (key.indexOf(normalizedText) !== -1) {
        // 将 key 按英文逗号分隔转为数组
        const keyArray = key.split(',');
        
        // 检查数组中是否包含该文本
        const textIndex = keyArray.findIndex(item => item.trim() === normalizedText);
        
        if (textIndex !== -1) {
          // 将 value 也按英文逗号分隔转为数组
          const valueArray = value.split(',');
          
          // 根据索引获取对应的中文翻译
          if (textIndex < valueArray.length) {
            return valueArray[textIndex].trim();
          }
        }
      }
    }
    
    return null;
  }

  /**
   * 批量翻译
   * @param {string[]} texts - 要翻译的文本数组
   * @param {Object} options - 翻译选项
   * @param {Element[]} elements - 可选的DOM元素数组，用于特殊匹配策略
   * @returns {Object} - 翻译结果对象
   */
  batchTranslation(texts, options = {}, elements = []) {
    const results = {};
    
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const element = elements[i] || null;
      results[text] = this.getTranslation(text, options, element);
    }
    
    return results;
  }

  /**
   * 获取翻译统计信息
   * @returns {Object} - 统计信息
   */
  getStats() {
    return {
      dictSize: Object.keys(this.translationDict).length,
      cacheSize: this.cache.size,
      strategies: this.matchStrategies
    };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
    // console.log('翻译缓存已清空');
  }

  /**
   * 添加自定义匹配策略
   * @param {string} name - 策略名称
   * @param {Function} strategy - 策略函数
   */
  addCustomStrategy(name, strategy) {
    this.matchStrategies.push(name);
    this[name + 'Match'] = strategy;
    // console.log(`自定义策略 "${name}" 已添加`);
  }

  /**
   * 移除匹配策略
   * @param {string} name - 策略名称
   */
  removeStrategy(name) {
    const index = this.matchStrategies.indexOf(name);
    if (index > -1) {
      this.matchStrategies.splice(index, 1);
      // console.log(`策略 "${name}" 已移除`);
    }
  }

  /**
   * 设置匹配策略顺序
   * @param {string[]} strategies - 策略名称数组
   */
  setStrategyOrder(strategies) {
    this.matchStrategies = strategies;
    // console.log('匹配策略顺序已更新:', strategies);
  }
}

// 导出类供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TranslationService;
}
