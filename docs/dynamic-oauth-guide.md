# 🚀 纯动态OAuth系统

## 完全革命性的OAuth集成方案

HiveChat现在支持**完全动态的OAuth配置**！彻底摆脱预定义限制：

- ✅ **支持任意OAuth 2.0提供商** - 无需预定义
- ✅ **运行时动态配置** - 无需修改代码或重新部署  
- ✅ **完全自定义映射** - 支持任何用户信息结构
- ✅ **零限制设计** - 想接入什么OAuth就接入什么

## 🎯 快速上手

### 1. 初始化数据库
```bash
npm run initdb
```

### 2. 添加任意OAuth提供商

只需要一个API调用，就能添加任何OAuth 2.0提供商：

#### 添加GitHub
```bash
curl -X POST /api/auth/oauth-providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "github",
    "name": "GitHub", 
    "authorizationUrl": "https://github.com/login/oauth/authorize",
    "tokenUrl": "https://github.com/login/oauth/access_token",
    "userinfoUrl": "https://api.github.com/user",
    "scopes": "user:email",
    "profileMapping": {
      "id": "id",
      "name": "name",
      "email": "email", 
      "image": "avatar_url"
    },
    "clientId": "your_github_client_id",
    "clientSecret": "your_github_client_secret",
    "enabled": true
  }'
```

#### 添加GitLab
```bash
curl -X POST /api/auth/oauth-providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "gitlab",
    "name": "GitLab",
    "authorizationUrl": "https://gitlab.com/oauth/authorize", 
    "tokenUrl": "https://gitlab.com/oauth/token",
    "userinfoUrl": "https://gitlab.com/api/v4/user",
    "scopes": "read_user",
    "profileMapping": {
      "id": "id",
      "name": "name",
      "email": "email",
      "image": "avatar_url"
    },
    "clientId": "your_gitlab_client_id",
    "clientSecret": "your_gitlab_client_secret",
    "enabled": true
  }'
```

#### 添加企业内部SSO
```bash
curl -X POST /api/auth/oauth-providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "company-sso",
    "name": "公司SSO",
    "authorizationUrl": "https://sso.company.com/oauth2/authorize",
    "tokenUrl": "https://sso.company.com/oauth2/token", 
    "userinfoUrl": "https://sso.company.com/api/userinfo",
    "scopes": "openid profile email",
    "profileMapping": {
      "id": "sub",
      "name": "preferred_username",
      "email": "email"
    },
    "config": {
      "checks": ["state", "pkce"],
      "additionalParams": {
        "prompt": "consent"
      }
    },
    "clientId": "your_sso_client_id", 
    "clientSecret": "your_sso_client_secret",
    "enabled": true
  }'
```

### 3. 立即生效

添加完成后，OAuth提供商立即可用！无需重启应用。

## 🌟 支持的OAuth提供商

**所有**符合OAuth 2.0标准的提供商都支持，包括但不限于：

### 代码托管平台
- GitHub, GitLab, Bitbucket
- Gitee, Coding, Azure DevOps

### 主流平台
- Google, Microsoft, Apple
- Facebook, Twitter, LinkedIn
- Discord, Slack, Spotify

### 企业服务
- 企业微信, 钉钉, 飞书 
- Okta, Auth0, Keycloak
- ADFS, Azure AD
- 任何企业内部SSO系统

### 自定义服务器
- 自建OAuth 2.0服务器
- 开源认证系统
- 任何标准实现

## ⚙️ 高级配置

### 复杂字段映射
```json
{
  "profileMapping": {
    "id": "user.uuid",
    "name": "profile.displayName", 
    "email": "contact.primaryEmail",
    "image": "avatar.large.url"
  }
}
```

### PKCE和安全配置
```json
{
  "config": {
    "checks": ["state", "pkce", "nonce"],
    "responseType": "code",
    "additionalParams": {
      "prompt": "consent",
      "access_type": "offline"
    },
    "headers": {
      "User-Agent": "HiveChat/1.0"
    }
  }
}
```

## 📚 API参考

### 获取预置模板
```bash
GET /api/auth/oauth-providers/templates
```

返回常用OAuth提供商的配置模板。

### 注册OAuth提供商
```bash
POST /api/auth/oauth-providers/register
```

### 获取启用的提供商
```bash
GET /api/auth/oauth-providers
```

### 管理提供商（管理员）
```bash
GET /api/admin/oauth-providers        # 获取所有提供商
PUT /api/admin/oauth-providers/{id}   # 更新提供商
DELETE /api/admin/oauth-providers/{id} # 删除提供商
```

## 🛡️ 安全特性

1. **自动缓存管理** - 配置变更自动清理缓存
2. **PKCE支持** - 支持最新OAuth安全标准
3. **字段验证** - 自动验证必需配置项
4. **错误处理** - 详细的错误信息和日志
5. **权限控制** - 管理员权限保护

## 💡 最佳实践

1. **回调URL格式**: `{NEXTAUTH_URL}/api/auth/callback/{provider_id}`
2. **字段映射**: 支持嵌套字段，如 `user.profile.name`
3. **测试配置**: 添加后先测试OAuth流程
4. **权限最小化**: 只请求必要的OAuth权限
5. **监控日志**: 关注OAuth认证日志

## 🔧 故障排除

### OAuth回调错误
- 检查`NEXTAUTH_URL`设置
- 确认OAuth应用回调URL配置正确
- 验证provider ID拼写

### 用户信息获取失败  
- 检查`profileMapping`字段路径
- 验证OAuth权限范围(scopes)
- 查看详细错误日志

### 配置不生效
- 确认OAuth提供商已启用
- 检查客户端凭据是否正确
- 验证数据库连接

---

🎉 **恭喜！** 现在你拥有了真正无限制的OAuth集成能力。任何OAuth 2.0提供商都能轻松接入，真正做到了"想接入什么就接入什么"！