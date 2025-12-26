# Development & Testing Guide

[中文](./README_zh.md) | English

## Prerequisites

- **Docker** and **Docker Compose** installed
- Local ports are available: `8080` (Web), `5000` (tools)
- (Optional) Chrome extension [**cookie-editor**](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm): Useful for quickly importing test-user cookies.

## Quick Start

### 1. Prepare the development config

Copy `config.docker.yaml` as your local development config file:

```bash
cp config.docker.yaml config.yaml
```

### 2. Configure OAuth2

1. Open LinuxDo's SSO application page and create an application:  
   [https://connect.linux.do/dash/sso](https://connect.linux.do/dash/sso)
2. Set the callback URL to:
   - `http://localhost:8080/login`
3. After the app is created, you will get `client_id` and `client_secret`. Fill them into `config.yaml`:

```yaml
oauth2:
  client_id: "your_linux_do_client_id"
  client_secret: "your_linux_do_client_secret"
  redirect_uri: "http://localhost:8080/login"
```

### 3. Create a LinuxDO API Key

Start the tools service:

```bash
docker compose up -d tools
```

Then open:

- [http://localhost:5000](http://localhost:5000)

Follow the on-page instructions to create an API Key, and set it to `linuxDo.api_key` in `config.yaml`.

### 4. Start all services

```bash
docker compose up -d
```

After startup, visit:

- [http://localhost:8080](http://localhost:8080)

### 5. Generate test users

To batch-generate test users, use `dev_tool`:

```bash
# Show help
docker exec credit-tools-dev dev_tool --help

# Generate 10 test users in batch
docker exec credit-tools-dev dev_tool --mode batch --count 10
```

You will see logs like the following (example):

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

### 6. Log in with a test user

1. Install and open [cookie-editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
2. Add the cookie from the generated output (e.g., `linux_do_credit_session_id=...`) to the cookies for the current site [http://localhost:8080](http://localhost:8080/home) (or replace the existing cookie).
3. Refresh the page. You should now be logged in as that test user and can proceed with testing.
