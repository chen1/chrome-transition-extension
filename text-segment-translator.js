/**
 * 文本段翻译器 - 处理混合节点结构的翻译
 * 以元素节点为分隔，分别获取文本段进行翻译并重新拼装
 */

class TextSegmentTranslator {
    constructor() {
        this.translationDict = {};
        this.loadTranslationDict();
    }

    /**
     * 加载翻译字典
     */
    loadTranslationDict() {
        // 如果已经有翻译字典，不覆盖
        if (Object.keys(this.translationDict).length > 0) {
            // console.log('TextSegmentTranslator: 使用已存在的翻译字典');
            return;
        }
    }

    /**
     * 翻译文本
     * @param {string} text - 要翻译的文本
     * @returns {string} - 翻译后的文本
     */
    translateText(text) {
        const trimmedText = text.trim();
        if (!trimmedText) return text;
        
        // 查找翻译
        if (this.translationDict[trimmedText]) {
            return this.translationDict[trimmedText];
        }
        
        // 如果没有找到翻译，返回原文本
        return text;
    }

    /**
     * 检查元素是否只有一个文本子节点
     * @param {Element} element - 要检查的元素
     * @returns {boolean} - 是否只有一个文本子节点
     */
    hasOnlyOneTextNode(element) {
        // console.log('=== TextSegmentTranslator.hasOnlyOneTextNode 检查开始 ===');
        // console.log('检查元素:', element);
        // console.log('子节点数量:', element.childNodes.length);
        
        if (!element.childNodes || element.childNodes.length === 0) {
            // console.log('没有子节点，返回false');
            return false;
        }
        
        // 统计文本子节点数量
        let textNodeCount = 0;
        for (let i = 0; i < element.childNodes.length; i++) {
            const child = element.childNodes[i];
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                textNodeCount++;
                // console.log(`文本子节点 ${textNodeCount}:`, child.textContent.trim());
            }
        }
        
        // console.log('文本子节点总数:', textNodeCount);
        
        // 如果只有一个文本子节点，返回true（不管有多少元素节点）
        if (textNodeCount === 1) {
            // console.log('返回true - 只有一个文本子节点');
            return true;
        }
        
        // console.log('返回false - 文本子节点数量不是1');
        return false;
    }

    /**
     * 分析元素的子节点，以元素节点为分隔提取文本段
     * @param {Element} element - 要分析的元素
     * @returns {Array} - 文本段数组，每个元素包含 {text, type, element}
     */
    analyzeElementStructure(element) {
        // console.log('=== TextSegmentTranslator.analyzeElementStructure 开始 ===');
        // console.log('分析元素:', element);
        // console.log('元素HTML:', element.innerHTML);
        
        const segments = [];
        const childNodes = Array.from(element.childNodes);
        // console.log('子节点数量:', childNodes.length);
        
        let currentText = '';
        
        for (let i = 0; i < childNodes.length; i++) {
            const node = childNodes[i];
            // console.log(`处理子节点 ${i}:`, {
            //     nodeType: node.nodeType,
            //     nodeName: node.nodeName,
            //     textContent: node.textContent,
            //     isTextNode: node.nodeType === Node.TEXT_NODE,
            //     isElementNode: node.nodeType === Node.ELEMENT_NODE,
            //     isCommentNode: node.nodeType === Node.COMMENT_NODE
            // });
            
            if (node.nodeType === Node.TEXT_NODE) {
                // 文本节点，累积文本
                currentText += node.textContent;
                // console.log('累积文本:', currentText);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 元素节点，作为分隔符
                if (currentText.trim()) {
                    // console.log('添加文本段:', currentText);
                    segments.push({
                        text: currentText,
                        type: 'text',
                        element: null
                    });
                    currentText = '';
                }
                
                // 添加元素节点信息
                // console.log('添加元素段:', node.textContent);
                segments.push({
                    text: node.textContent || '',
                    type: 'element',
                    element: node,
                    tagName: node.tagName,
                    attributes: this.getElementAttributes(node)
                });
            }
            // 忽略注释节点和其他节点类型
        }
        
        // 处理最后的文本段
        if (currentText.trim()) {
            // console.log('添加最后文本段:', currentText);
            segments.push({
                text: currentText,
                type: 'text',
                element: null
            });
        }
        
        // console.log('分析结果 - 文本段数量:', segments.length);
        // console.log('文本段详情:', segments);
        return segments;
    }

    /**
     * 获取元素的所有属性
     * @param {Element} element - 元素
     * @returns {Object} - 属性对象
     */
    getElementAttributes(element) {
        const attributes = {};
        for (let attr of element.attributes) {
            attributes[attr.name] = attr.value;
        }
        return attributes;
    }

    /**
     * 处理元素翻译
     * @param {Element} element - 要翻译的元素
     * @returns {Object} - 翻译结果
     */
    processElementTranslation(element) {
        // console.log('开始处理元素翻译:', element);
        
        // 分析元素结构
        const segments = this.analyzeElementStructure(element);
        // console.log('分析得到的文本段:', segments);
        
        const translatedSegments = [];
        
        // 处理每个文本段
        segments.forEach((segment, index) => {
            if (segment.type === 'text') {
                // 翻译文本段
                const translatedText = this.translateText(segment.text);
                translatedSegments.push({
                    ...segment,
                    translatedText: translatedText,
                    originalText: segment.text
                });
            } else if (segment.type === 'element') {
                // 处理元素节点
                const elementText = segment.element.textContent || '';
                const translatedElementText = this.translateText(elementText);
                
                translatedSegments.push({
                    ...segment,
                    translatedText: translatedElementText,
                    originalText: elementText
                });
            }
        });
        
        // console.log('翻译后的文本段:', translatedSegments);
        
        return {
            originalElement: element,
            segments: translatedSegments,
            reconstructedHTML: this.reconstructElement(translatedSegments)
        };
    }

    /**
     * 重新构建元素HTML
     * @param {Array} translatedSegments - 翻译后的文本段
     * @returns {string} - 重构的HTML
     */
    reconstructElement(translatedSegments) {
        let html = '';
        
        translatedSegments.forEach(segment => {
            if (segment.type === 'text') {
                html += segment.translatedText;
            } else if (segment.type === 'element') {
                // 重新构建元素，使用翻译后的文本
                const tagName = segment.tagName.toLowerCase();
                let elementHTML = `<${tagName}`;
                
                // 添加属性
                Object.entries(segment.attributes).forEach(([name, value]) => {
                    elementHTML += ` ${name}="${value}"`;
                });
                
                elementHTML += `>${segment.translatedText}</${tagName}>`;
                html += elementHTML;
            }
        });
        
        return html;
    }

    /**
     * 应用翻译到实际元素
     * @param {Element} element - 要应用翻译的元素
     * @param {Object} translationResult - 翻译结果
     */
    applyTranslation(element, translationResult) {
        // 清空原元素内容
        element.innerHTML = '';
        
        // 重新构建内容
        translationResult.segments.forEach(segment => {
            if (segment.type === 'text') {
                element.appendChild(document.createTextNode(segment.translatedText));
            } else if (segment.type === 'element') {
                // 创建新元素
                const newElement = document.createElement(segment.tagName.toLowerCase());
                
                // 设置属性
                Object.entries(segment.attributes).forEach(([name, value]) => {
                    newElement.setAttribute(name, value);
                });
                
                // 设置文本内容
                newElement.textContent = segment.translatedText;
                
                element.appendChild(newElement);
            }
        });
    }
}

// 使用示例函数
function translateSelectedElement() {
    const translator = new TextSegmentTranslator();
    
    // 获取当前选中的元素（这里需要从浏览器工具获取）
    // 假设我们有一个选中的元素
    const selectedElement = document.querySelector('.medType'); // 使用之前获取的元素
    
    if (selectedElement) {
        const result = translator.processElementTranslation(selectedElement);
        // console.log('翻译结果:', result);
        
        // 可以选择是否立即应用翻译
        // translator.applyTranslation(selectedElement, result);
        
        return result;
    } else {
        // console.log('未找到选中的元素');
        return null;
    }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TextSegmentTranslator;
}
