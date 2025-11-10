# Jacky RAG Vue 项目

一个基于 Vue 3 + Vite 的企业级 RAG（检索增强生成）系统前端应用。

## 📋 项目描述

本项目是一个综合的文档分析和智能问答平台，具备以下核心功能：

- **文档管理系统** - 支持文档上传、分块处理和版本管理
- **RAG 问答系统** - 基于已上传文档的智能检索和问答
- **文档分块工具** - 灵活配置文档分块参数，优化检索效果
- **使用限制管理** - 管理员级别的使用额度控制和密码认证
- **用户认证系统** - 支持用户登录和身份验证
- **集合搜索** - 在多个文档集合中快速搜索

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0
- npm >= 6.0

### 安装依赖

```bash
npm install
```

### 开发模式

启动本地开发服务器（支持热重载）：

```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用

### 生产构建

构建优化后的生产版本：

```bash
npm run build
```

### 预览构建

在生产构建后预览应用：

```bash
npm run preview
```

## 📁 项目结构

```
src/
├── views/                      # 页面组件
│   ├── Home.vue               # 首页
│   ├── Login.vue              # 登录页
│   ├── DocumentLibrary.vue    # 文档库管理
│   ├── DocumentChunking.vue   # 文档分块工具
│   ├── RagQA.vue              # RAG 问答系统
│   ├── PermanentDocumentView.vue  # 永久文档查看
│   ├── CollectionSearch.vue   # 集合搜索
│   └── UsageLimitsManagement.vue  # 使用限制管理
├── components/                # 可复用组件
├── utils/                     # 工具函数
│   └── request.js            # HTTP 请求封装
├── router/                    # 路由配置
├── App.vue                   # 根组件
└── main.js                   # 入口文件
```

## 🛠️ 核心技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5.22 | 渐进式 JavaScript 框架 |
| Vite | 7.1.7 | 下一代前端构建工具 |
| Vue Router | 4.6.3 | Vue 的官方路由管理器 |
| Element Plus | 2.11.7 | Vue 3 UI 组件库 |
| Axios | 1.13.1 | HTTP 请求库 |

## ✨ 主要功能

### 1. 文档管理
- 上传和管理文档
- 查看文档详情
- 删除和更新文档

### 2. 文档分块
- 配置分块参数（分块大小、重叠等）
- 预览分块效果
- 支持多种文档格式

### 3. RAG 问答
- 基于上传文档的智能问答
- 显示查询耗时和使用统计
- 支持多轮对话

### 4. 使用限制管理
- 配置系统级别的使用限额
- 密码认证机制
- 支持无需认证的管理员验证

### 5. 集合搜索
- 跨多个文档集合搜索
- 快速定位相关内容

## 📦 依赖说明

### 生产依赖

- **vue** - 核心框架
- **vue-router** - 路由管理
- **axios** - 异步 HTTP 请求
- **element-plus** - 企业级 UI 组件库

### 开发依赖

- **vite** - 构建工具和开发服务器
- **@vitejs/plugin-vue** - Vite 的 Vue 3 支持

## 🔐 环保配置

项目使用 `.env.development` 文件管理开发环境变量。请确保：

```
# .env.development
VITE_API_BASE_URL=http://localhost:8000
```

## 📝 脚本命令

```bash
# 开发
npm run dev          # 启动开发服务器

# 构建
npm run build        # 构建生产版本

# 预览
npm run preview      # 预览生产构建
```

## 🔄 最近更新

- ✅ 添加了使用统计显示功能
- ✅ 添加了查询耗时展示
- ✅ 增强了使用限制管理界面
- ✅ 支持非认证用户访问管理员验证
- ✅ 优化了请求处理流程

## 📄 许可证

MIT

## 👤 作者

Namw

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

如有问题，请访问 [GitHub 项目](https://github.com/Namw/jacky_rag_vue_project)
