# 船小结填写工具

## 简介
一个用于辅助填写 **内贸玉米散粮船小结** 报告的网页工具。纯前端实现，无需安装任何软件，双击 `index.html` 即可在浏览器中使用。

本页面用于填写沿海大区船小结。

## 功能
- 📋 **7大板块表单**：覆盖到港前船舶情况、码头计划仓库情况、船靠泊卸货前情况、卸货过程、提货情况、成本分析、整船总结
- 📝 **实时预览**：右侧面板即时显示所填写内容的报告效果
- 💾 **自动保存**：每30秒自动保存草稿到浏览器本地存储，关闭不丢失
- 📸 **文件/照片上传**：支持拖拽或点击上传照片、运单扫描件等
- 📥 **导出Word (.docx)**：一键生成与原模板格式一致的 Word 文档
- 🖨️ **打印/PDF**：通过浏览器打印生成 PDF 报告
- 📱 **响应式布局**：支持电脑、平板等设备

## 使用方法

### 方式一：在线使用
访问 GitHub Pages 地址：
> `https://shihongwei572.github.io/ship-summary/`

### 方式二：本地使用
1. 下载整个项目文件夹
2. 双击 `index.html` 在浏览器中打开
3. 开始填写！

## 浏览器兼容性
- Chrome / Edge（推荐）
- Firefox
- Safari

## 文件结构
```
船小结填写网页/
├── index.html              # 主页面
├── css/
│   ├── main.css            # 主样式
│   └── print.css           # 打印/PDF样式
├── js/
│   ├── app.js              # 入口，初始化
│   ├── form-state.js       # 数据模型
│   ├── form-renderer.js    # 动态表单生成
│   ├── preview.js          # 实时预览
│   ├── export-docx.js      # Word (.docx) 导出
│   ├── export-print.js     # 打印/PDF 导出
│   ├── file-upload.js      # 文件上传
│   ├── storage.js          # 本地存储
│   └── validation.js       # 表单验证
└── README.md
```

## 技术栈
- 原生 HTML/CSS/JavaScript（零框架、零构建）
- [docx](https://github.com/dolanmedia/docx) — Word 文档生成
- [FileSaver.js](https://github.com/eligrey/FileSaver.js) — 浏览器文件下载
