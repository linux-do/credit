# LINUX DO Credit

🚀 Linux Do Community Credit Service Platform

[中文](./README_zh.md)

[![License: Apache2.0](https://img.shields.io/badge/License-Apache2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Go Version](https://img.shields.io/badge/Go-1.26-blue.svg)](https://golang.org/)
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

## 📖 Introduction

LINUX DO Credit is a credit service platform built for the Linux Do community, aimed at providing a series of credit-related services and offering a foundational framework for credit circulation for community developers.

### ✨ Key Features

- 🔐 **OAuth2 Authentication** - Integrated with Linux Do community account system
- 🛡️ **Risk Control** - Comprehensive trust level and risk assessment system
- 📊 **Real-time Monitoring** - Detailed distribution statistics and user behavior analysis
- 🎨 **Modern Interface** - Responsive design based on Next.js 16 and React 19
- ⚡ **High Performance** - Go Backend + Redis Cache + PostgreSQL Database

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│     (Go)        │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Gin Framework │    │ • PostgreSQL    │
│ • TypeScript    │    │ • OAuth2        │    │ • Redis Cache   │
│ • Tailwind CSS  │    │ • Session Store │    │                 │
│ • Shadcn UI     │    │ • OpenTelemetry │    │                 │
│                 │    │ • Swagger API   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Tech Stack

### Backend
- **[Go 1.26](https://go.dev/doc)** - Primary development language
- **[GIN](https://github.com/gin-gonic/gin)** - Web Framework
- **[GORM](https://github.com/go-gorm/gorm)** - ORM Framework
- **[Redis](https://github.com/redis/redis)** - Cache and session store
- **[PostgreSQL](https://www.postgresql.org)** - Primary Database
- **[OpenTelemetry](https://opentelemetry.io)** - Observability
- **[Swagger](https://github.com/swaggo/swag)** - API Documentation

### Frontend
- **[Next.js 16](https://github.com/vercel/next.js)** - React Framework
- **[React 19](https://github.com/facebook/react)** - UI Library
- **[TypeScript](https://github.com/microsoft/TypeScript)** - Type Safety
- **[Tailwind CSS 4](https://github.com/tailwindlabs/tailwindcss)** - Styling Framework
- **[Shadcn UI](https://github.com/shadcn-ui/ui)** - Component Library
- **[Lucide Icons](https://github.com/lucide-icons/lucide)** - Icon Library

## 📋 Requirements

- **Go** >= 1.26
- **Node.js** >= 18.0
- **PostgreSQL** >= 18
- **Redis** >= 6.0
- **pnpm** >= 8.0 (Recommended)

## 🚀 Quick Start

### 1. Clone the Project

```bash
git clone https://github.com/linux-do/credit.git
cd credit
```

### 2. Configure Environment

Copy the configuration file and edit it:

```bash
cp config.example.yaml config.yaml
```

Edit `config.yaml` to configure database connections, Redis, OAuth2, etc.

### 3. Initialize Database

```bash
# Create database
createdb -h <host> -p 5432 -U postgres linux_do_credit

# If you need to specify encoding, use:
# psql -h <host> -p 5432 -U postgres -c "CREATE DATABASE linux_do_credit WITH ENCODING 'UTF8' LC_COLLATE='zh_CN.UTF-8' LC_CTYPE='zh_CN.UTF-8' TEMPLATE template0;"

# Run migrations (automatically executed when starting the backend)
```

### 4. Start Backend

```bash
# Install Go dependencies
go mod tidy

# Generate API documentation
make swagger

# Start backend service
go run main.go api
```

### 5. Start Frontend

```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### 6. Access Application

- **Frontend Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/swagger/index.html
- **Health Check**: http://localhost:8000/api/v1/health
- **Readiness Check**: http://localhost:8000/api/v1/ready

## ⚙️ Configuration

### Main Configuration Options

| Option | Description | Example |
|--------|-------------|---------|
| `app.addr` | Backend service listening address | `:8000` |
| `worker.port` | Worker probe port | `8001` |
| `scheduler.port` | Scheduler probe port | `8002` |
| `oauth2.client_id` | OAuth2 Client ID | `your_client_id` |
| `database.host` | PostgreSQL database host | `127.0.0.1` |
| `database.port` | PostgreSQL database port | `5432` |
| `database.username` | PostgreSQL database username | `postgres` |
| `database.password` | PostgreSQL database password | `password` |
| `database.database` | PostgreSQL database name | `linux_do_credit` |
| `database.ssl_mode` | PostgreSQL SSL mode | `disable` |
| `database.application_name` | PostgreSQL application name | `credit-server` |
| `database.search_path` | PostgreSQL search path | `public` |
| `database.default_query_exec_mode` | SQL cache mode | `cache_statement` |
| `redis.host` | Redis server address | `127.0.0.1` |

For detailed configuration instructions, please refer to the `config.example.yaml` file.

## 🔧 Development Guide

### Backend Development

```bash
# Run API server
go run main.go api

# Run task scheduler
go run main.go scheduler

# Run worker queue
go run main.go worker

# Generate Swagger documentation
make swagger

# Format and check code
make tidy
```

### Frontend Development

```bash
cd frontend

# Development mode (using Turbopack)
pnpm dev

# Build production version
pnpm build

# Start production service
pnpm start

# Lint and format code
pnpm lint
pnpm format
```

## 📚 API Documentation

API documentation is automatically generated by Swagger and can be accessed after starting the backend service:

```
http://localhost:8000/swagger/index.html
```

## 🧪 Testing

```bash
# Backend testing
go test ./...

# Frontend testing
cd frontend
pnpm test
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build image
docker build -t linux-do-credit .

# Run container
docker run -d -p 8000:8000 linux-do-credit
```

### Production Environment Deployment

1. Build frontend resources:
   ```bash
   cd frontend && pnpm build
   ```

2. Compile backend program:
   ```bash
   go build -o credit main.go
   ```

3. Configure `config.yaml` for production

4. Start service:
   ```bash
   ./credit api
   ```

## 🤝 Contribution Guidelines

We welcome community contributions! Please read the following before submitting code:

- [Contribution Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributor License Agreement](CLA.md)

### Submission Process

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit changes (`git commit -am 'Add your feature'`)
4. Push to branch (`git push origin feature/your-feature`)
5. Create Pull Request

## 📄 License

This project is open source under the [Apache2.0 License](LICENSE).

## 🔗 Related Links

- [Linux Do Community](https://linux.do)
- [Issue Reporting](https://github.com/linux-do/credit/issues)
- [Feature Request](https://github.com/linux-do/credit/issues/new?template=feature_request.md)

## ❤️ Acknowledgements

Thanks to all developers who contributed to this project and the support of the Linux Do Community!

## 📈 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=linux-do/credit&type=Date)](https://star-history.com/#linux-do/credit&Date)
