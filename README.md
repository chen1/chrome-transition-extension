# 文本翻译悬浮提示 Chrome扩展

一个基于Manifest v3的Chrome扩展，实现鼠标悬浮元素时显示中文翻译功能。

## 功能特性

- ✅ 鼠标悬浮元素时自动显示中文翻译
- ✅ 支持自定义翻译字典配置
- ✅ 智能文本提取和匹配
- ✅ 流畅的动画效果
- ✅ 响应式设计，适配移动端
- ✅ 防止样式冲突，确保在各种网站正常工作
- ✅ 支持多种元素类型（按钮、链接、标签、标题等）
- ✅ **完全支持Vue.js自定义组件**
- ✅ **完全支持Angular自定义组件**
- ✅ **智能识别前端框架元素和指令**

## 安装使用

1. 下载或克隆此项目到本地
2. 打开Chrome浏览器，进入扩展管理页面 (`chrome://extensions/`)
3. 开启"开发者模式"（右上角开关）
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹 `transition-extension`
6. 扩展安装完成，即可在任意网页使用

## 使用方法

1. 安装扩展后，访问任何网页
2. 将鼠标悬浮到页面元素上（如按钮、链接、文本等）
3. 如果该元素的文本内容在翻译字典中有对应翻译，会自动显示中文tooltip
4. 移开鼠标，tooltip自动消失

## 配置翻译字典

编辑 `translation-dict.json` 文件来添加或修改翻译映射：

```json
{
  "hello": "你好",
  "world": "世界",
  "login": "登录",
  "register": "注册",
  "custom_text": "自定义翻译"
}
```

### 支持的匹配模式

1. **完全匹配**: 文本内容与字典键完全一致
2. **清理匹配**: 去除标点符号后匹配
3. **包含匹配**: 文本包含字典键或字典键包含文本

### 框架组件示例

**Vue.js组件支持**:
```html
<!-- 自定义组件 -->
<my-button>Login</my-button>  <!-- 显示: 登录 -->
<user-card title="Profile">Profile</user-card>  <!-- 显示: 个人资料 -->

<!-- Vue指令 -->
<div v-text="'Submit'"></div>  <!-- 显示: 提交 -->
<span :aria-label="'Close'">×</span>  <!-- 显示: 关闭 -->
```

**Angular组件支持**:
```html
<!-- Angular组件 -->
<app-button>Register</app-button>  <!-- 显示: 注册 -->
<mat-button>Save</mat-button>  <!-- 显示: 保存 -->

<!-- Angular指令 -->
<div [innerText]="'Delete'"></div>  <!-- 显示: 删除 -->
<span ng-bind="'Cancel'"></span>  <!-- 显示: 取消 -->
```

## 技术实现

- **Manifest v3**: 使用最新的Chrome扩展协议
- **Content Script**: 注入页面进行元素交互处理
- **智能匹配**: 支持多种文本匹配策略
- **性能优化**: 防抖处理、延迟显示、智能定位
- **样式隔离**: 使用!important确保样式不被网页覆盖

## 文件结构

```
transition-extension/
├── manifest.json          # 扩展配置文件 (Manifest v3)
├── content.js             # 主要逻辑脚本
├── styles.css            # 样式文件
├── translation-dict.json  # 翻译字典配置
└── README.md             # 说明文档
```

## 自定义配置

您可以通过修改 `content.js` 中的以下参数来自定义扩展行为：

- **悬浮延迟时间**: 默认300ms（第62行）
- **隐藏延迟时间**: 默认100ms（第73行）
- **最大文本长度限制**: 默认100字符（第119行）
- **Tooltip最大宽度**: 默认300px（CSS文件中）

## 支持的元素类型

### 标准HTML元素
- 按钮 (`<button>`)
- 链接 (`<a>`)
- 文本标签 (`<span>`, `<label>`, `<li>`, `<div>`)
- 标题元素 (`<h1>` - `<h6>`)
- 段落 (`<p>`)
- 表格元素 (`<td>`, `<th>`)
- 表单元素 (`<input>`, `<textarea>`, `<option>`)
- 语义化元素 (`<nav>`, `<aside>`, `<section>`, `<article>`, `<header>`, `<footer>`)

### Vue.js组件支持
- **自定义组件标签** (如 `<my-component>`, `<user-card>`)
- **Vue指令元素** (带有 `v-*`, `:*`, `@*` 属性的元素)
- **Vue实例元素** (检测 `__vue__`, `_vnode`, `__vueParentComponent`)
- **Vue特定属性**: `v-text`, `v-html`, `:text` 等

### Angular组件支持  
- **自定义组件标签** (如 `<app-component>`, `<mat-button>`)
- **Angular指令元素** (带有 `ng-*`, `*ng*`, `[]*`, `()*` 属性的元素)
- **Angular实例元素** (检测 `ng`, `__ngContext__`)
- **Angular特定属性**: `[innerText]`, `[innerHTML]`, `ng-bind` 等

### 属性文本支持
- `title` - 标准tooltip属性
- `alt` - 图片替代文本
- `placeholder` - 输入框占位符
- `aria-label` - 无障碍标签
- `data-title`, `data-tooltip` - 自定义tooltip属性
- `data-original-title` - Bootstrap tooltip
- `tooltip`, `label` - 通用tooltip属性

## 浏览器兼容性

- Chrome 88+
- Microsoft Edge 88+
- 其他基于Chromium的浏览器 (Brave, Opera等)

## 开发说明

### 调试方法

1. 在Chrome扩展管理页面找到该扩展
2. 点击"检查视图"中的"content script"
3. 在开发者工具中查看console输出和调试信息

### 常见问题

**Q: 为什么某些元素没有显示翻译？**
A: 检查以下几点：
- 元素文本是否在翻译字典中
- 文本长度是否超过100字符限制
- 元素类型是否在支持列表中

**Q: 如何添加更多翻译？**
A: 编辑 `translation-dict.json` 文件，添加新的键值对，重新加载扩展即可。

**Q: tooltip显示位置不正确？**
A: 扩展会自动调整tooltip位置避免超出屏幕边界，如有问题可能是页面样式冲突导致。

## 更新日志

### v1.0.0
- 初始版本发布
- 支持基本的文本翻译功能
- 实现自定义翻译字典
- 添加流畅的动画效果
- 支持多种元素类型识别

## 许可证

MIT License - 可自由使用和修改

## 贡献

欢迎提交Issue和Pull Request来改进这个扩展！
