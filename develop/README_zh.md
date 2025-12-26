# 开发与测试指南

[English](./README.md) | 中文

## 前置条件

- 已安装 **Docker** 与 **Docker Compose**
- 本地端口未被占用：`8080`（Web）、`5000`（tools）
- （可选）Chrome 插件 [**cookie-editor**](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)：用于快速导入测试用户 Cookie  

## 快速开始

### 1. 准备配置

复制 `config.docker.yaml` 作为本地开发配置文件：

```bash
cp config.docker.yaml config.yaml
```

### 2. 配置 OAuth2

1. 打开 LinuxDo 的应用接入页面并创建应用：  
  [https://connect.linux.do/dash/sso](https://connect.linux.do/dash/sso)
2. 回调地址填写为:
- `http://localhost:8080/login`
3. 创建后可获得 `client_id` 与 `client_secret`，填写到 `config.yaml`：

```yaml
oauth2:
  client_id: "your_linux_do_client_id"
  client_secret: "your_linux_do_client_secret"
  redirect_uri: "http://localhost:8080/login"
```

### 3. 创建 LinuxDO API Key

启动 tools 服务：

```bash
docker compose up -d tools
```

然后打开：

- [http://localhost:5000](http://localhost:5000)

根据页面提示创建一个 API Key，并将其填写到 `config.yaml` 的 `linuxDo.api_key` 变量中

### 4. 启动全部服务

```bash
docker compose up -d
```

启动后访问：

- [http://localhost:8080](http://localhost:8080) 进行测试

### 5. 生成测试用户

如需批量生成测试用户，使用 `dev_tool`：

```bash
# 查看帮助
docker exec credit-tools-dev dev_tool --help

# 批量生成 10 个测试用户
docker exec credit-tools-dev dev_tool --mode batch --count 10
```

执行过程中会输出类似日志（示例）：

```text
--- Batch Processing User 1/10 ---
👤 Target User: [11683] mock_user_011683 (Random Generation)
🔑 Sign Key: 9cfc0e270cd8121789b645f02e516b2e975726a882bcec33482be85cae626db1
💳 Pay Key (Encrypted '451080'): QonT0dIg3UEPyDrAe4QaSEPmVnufgIH3leZWLaIFtiHz+A==
✅ User inserted into Postgres successfully.
✅ Session saved to Redis automatically.

==================== SESSION RESULT ====================
🍪 BROWSER COOKIE:
linux_do_credit_session_id=MTc2NjczNzc2...
========================================================
```

### 6. 使用测试用户登录

1. 安装并打开 [cookie-editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
2. 将生成结果中的 Cookie（例如 `linux_do_credit_session_id=...`）添加到浏览器当前站点 [http://localhost:8080](http://localhost:8080/home) 对应的 Cookie 中（或者替换已有 Cookie）
3. 刷新页面，即可使用该测试用户登录并进行相关测试
