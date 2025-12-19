# LINUX DO Credit

🚀 Linux Do 社区 Credit 积分服务平台

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Go Version](https://img.shields.io/badge/Go-1.24-blue.svg)](https://golang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)

[![GitHub release](https://img.shields.io/github/v/release/linux-do/credit?include_prereleases)](https://github.com/linux-do/credit/releases)
[![GitHub stars](https://img.shields.io/github/stars/linux-do/credit)](https://github.com/linux-do/credit/stargazers) 
[![GitHub forks](https://img.shields.io/github/forks/linux-do/credit)](https://github.com/linux-do/credit/network)
[![GitHub issues](https://img.shields.io/github/issues/linux-do/credit)](https://github.com/linux-do/credit/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/linux-do/credit)](https://github.com/linux-do/credit/pulls)
[![GitHub contributors](https://img.shields.io/github/contributors/linux-do/credit)](https://github.com/linux-do/credit/graphs/contributors)

[![Backend Build](https://github.com/linux-do/credit/actions/workflows/build_backend.yml/badge.svg)](https://github.com/linux-do/credit/actions/workflows/build_backend.yml)
[![Frontend Build](https://github.com/linux-do/credit/actions/workflows/build_frontend.yml/badge.svg)](https://github.com/linux-do/credit/actions/workflows/build_frontend.yml)
[![Docker Build](https://github.com/linux-do/credit/actions/workflows/build_image.yml/badge.svg)](https://github.com/linux-do/credit/actions/workflows/build_image.yml)
[![CodeQL](https://github.com/linux-do/credit/actions/workflows/codeql.yml/badge.svg)](https://github.com/linux-do/credit/actions/workflows/codeql.yml)
[![ESLint](https://github.com/linux-do/credit/actions/workflows/eslint.yml/badge.svg)](https://github.com/linux-do/credit/actions/workflows/eslint.yml)

## 📖 项目简介

LINUX DO Credit 是一个为 Linux Do 社区打造的积分服务平台，旨在提供一系列积分相关服务，为社区开发者提供积分流转基础框架。
### ✨ 主要特性

- 🔐 **OAuth2 认证** - 集成 Linux Do 社区账号系统
- 🛡️ **风险控制** - 完善的信任等级和风险评估系统
- 📊 **实时监控** - 详细的分发统计和用户行为分析
- 🎨 **现代化界面** - 基于 Next.js 16 和 React 19 的响应式设计
- ⚡ **高性能** - Go 后端 + Redis 缓存 + PostgreSQL 数据库

## 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│     (Go)        │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Gin Framework │    │ • PostgreSQL    │
│ • TypeScript    │    │ • OAuth2        │    │ • Redis Cache   │
│ • Tailwind CSS  │    │ • OpenTelemetry │    │ • Session Store │
│ • Shadcn UI     │    │ • Swagger API   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ 技术栈

### 后端
- **[Go 1.25.4](https://go.dev/doc)** - 主要开发语言
- **[GIN](https://github.com/gin-gonic/gin)** - Web 框架
- **[GORM](https://github.com/go-gorm/gorm)** - ORM 框架
- **[Redis](https://github.com/redis/redis)** - 缓存和会话存储
- **[PostgreSQL](https://www.postgresql.org)** - 主数据库
- **[OpenTelemetry](https://opentelemetry.io)** - 可观测性
- **[Swagger](https://github.com/swaggo/swag)** - API 文档

### 前端
- **[Next.js 16](https://github.com/vercel/next.js)** - React 框架
- **[React 19](https://github.com/facebook/react)** - UI 库
- **[TypeScript](https://github.com/microsoft/TypeScript)** - 类型安全
- **[Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss)** - 样式框架
- **[Shadcn UI](https://github.com/shadcn-ui/ui)** - 组件库
- **[Lucide Icons](https://github.com/lucide-icons/lucide)** - 图标库

## 📋 环境要求

- **Go** >= 1.25.4
- **Node.js** >= 18.0
- **PostgreSQL** >= 18
- **Redis** >= 6.0
- **pnpm** >= 8.0 (推荐)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/linux-do/credit.git
cd credit
```

### 2. 配置环境

复制配置文件并编辑：

```bash
cp config.example.yaml config.yaml
```

编辑 `config.yaml` 文件，配置数据库连接、Redis、OAuth2 等信息。

### 3. 初始化数据库

```bash
# 创建数据库
createdb -h <主机> -p 5432 -U postgres linux_do_credit

# 如果需要指定字符集，可使用
# psql -h <主机> -p 5432 -U postgres -c "CREATE DATABASE linux_do_credit WITH ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8' TEMPLATE template0;"

# 运行迁移（启动后端时会自动执行）
```

### 4. 启动后端

```bash
# 安装 Go 依赖
go mod tidy

# 生成 API 文档
make swagger

# 启动后端服务
go run main.go api
```

### 5. 启动前端

```bash
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 6. 访问应用

- **前端界面**: http://localhost:3000
- **API 文档**: http://localhost:8000/swagger/index.html
- **健康检查**: http://localhost:8000/api/health

## ⚙️ 配置说明

### 主要配置项

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `app.addr` | 后端服务监听地址 | `:8000` |
| `oauth2.client_id` | OAuth2 客户端 ID | `your_client_id` |
| `database.host` | PostgreSQL 数据库地址 | `127.0.0.1` |
| `database.port` | PostgreSQL 数据库端口 | `5432` |
| `database.username` | PostgreSQL 数据库用户名 | `postgres` |
| `database.password` | PostgreSQL 数据库密码 | `password` |
| `database.database` | PostgreSQL 数据库名称 | `linux_do_credit` |
| `database.ssl_mode` | PostgreSQL SSL 模式 | `disable` |
| `database.application_name` | PostgreSQL 应用标识 | `credit-server` |
| `database.search_path` | PostgreSQL 搜索路径 | `public` |
| `database.default_query_exec_mode` | SQL 缓存模式 | `cache_statement` |
| `redis.host` | Redis 服务器地址 | `127.0.0.1` |

详细配置说明请参考 `config.example.yaml` 文件。

## 🔧 开发指南

### 后端开发

```bash
# 运行 API 服务器
go run main.go api

# 运行任务调度器
go run main.go scheduler

# 运行工作队列
go run main.go worker

# 生成 Swagger 文档
make swagger

# 代码格式化和检查
make tidy
```

### 前端开发

```bash
cd frontend

# 开发模式（使用 Turbopack）
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务
pnpm start

# 代码检查和格式化
pnpm lint
pnpm format
```

## 📚 API 文档

API 文档通过 Swagger 自动生成，启动后端服务后可访问：

```
http://localhost:8000/swagger/index.html
```

### 主要 API 端点

- `GET /api/health` - 健康检查
- `GET /api/oauth2/login` - OAuth2 登录
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建新项目

## 🧪 测试

```bash
# 后端测试
go test ./...

# 前端测试
cd frontend
pnpm test
```

## 🚀 部署

### Docker 部署

```bash
# 构建镜像
docker build -t linux-do-credit .

# 运行容器
docker run -d -p 8000:8000 linux-do-credit
```

### 生产环境部署

1. 构建前端资源：
   ```bash
   cd frontend && pnpm build
   ```

2. 编译后端程序：
   ```bash
   go build -o credit main.go
   ```

3. 配置生产环境的 `config.yaml`

4. 启动服务：
   ```bash
   ./credit api
   ```

## 🤝 贡献指南

我们欢迎社区贡献！请在提交代码前阅读：

- [贡献指南](CONTRIBUTING.md)
- [行为准则](CODE_OF_CONDUCT.md)
- [贡献者许可协议](CLA.md)

### 提交流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -am 'Add your feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [Apache2.0 许可证](LICENSE) 开源。

## 🔗 相关链接

- [Linux Do 社区](https://linux.do)
- [问题反馈](https://github.com/linux-do/credit/issues)
- [功能请求](https://github.com/linux-do/credit/issues/new?template=feature_request.md)

## ❤️ 致谢

感谢所有为本项目做出贡献的开发者和 Linux Do 社区的支持！

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=linux-do/credit&type=Date)](https://star-history.com/#linux-do/credit&Date)