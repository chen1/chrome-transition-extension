# 嵌套iframe检测功能说明

## 功能概述

为iframe内部的新iframe添加了内容变化监听功能，类似content.js中的scheduleIframeDetection()逻辑。当iframe内部出现新的嵌套iframe时，系统会自动检测并绑定翻译事件。

## 实现的功能

### 1. 智能调度机制
- 在`IframeHandler`类中添加了`scheduleIframeDetection()`方法
- 支持防抖机制，避免频繁检测
- 根据不同的检测原因设置不同的延迟时间：
  - `new-iframe`: 300ms
  - `significant-change`: 400ms
  - `popup-change`: 500ms
  - `visibility-change`: 200ms
  - 默认: 1000ms

### 2. 嵌套iframe检测
- `detectNewIframesInParent()`: 在特定父iframe内检测新iframe
- `detectAllNestedIframes()`: 检测所有iframe内部的嵌套iframe
- 自动跳过已绑定的iframe，避免重复处理

### 3. 事件监听增强
- 更新了`onNewIframe`回调，添加智能调度机制
- 更新了`onSignificantChange`回调，检测内容变化后的新iframe
- 在iframe清理时自动清理调度定时器

## 代码变更

### iframe-handler.js
1. 添加了`scheduleIframeDetection()`方法
2. 添加了`detectNewIframesInParent()`方法
3. 添加了`detectAllNestedIframes()`方法
4. 更新了`onNewIframe`回调
5. 更新了`onSignificantChange`回调
6. 在`cleanupIframeEvents()`中添加了定时器清理

### 测试文件
- 创建了`test-nested-iframe-detection.html`测试页面
- 支持动态添加嵌套iframe进行功能测试

## 使用方式

1. 当iframe内部出现新的嵌套iframe时，系统会自动检测
2. 检测到新iframe后，会自动绑定翻译事件
3. 支持多层嵌套iframe的检测
4. 自动清理已移除的iframe缓存

## 测试方法

1. 打开`test-nested-iframe-detection.html`页面
2. 点击"添加嵌套iframe"按钮
3. 观察浏览器控制台日志，确认检测功能正常工作
4. 可以添加多个嵌套iframe进行批量测试

## 技术特点

- 使用防抖机制避免性能问题
- 智能跳过已处理的iframe
- 支持多层嵌套结构
- 自动清理和内存管理
- 详细的日志记录便于调试

## 兼容性

- 与现有的iframe处理逻辑完全兼容
- 不影响原有的翻译功能
- 支持所有现代浏览器
