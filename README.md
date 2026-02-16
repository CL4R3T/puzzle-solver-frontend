# 数独求解器 - 前端

基于 React + Vite 的数独求解器页面，对接后端 FastAPI 的求解与校验接口。

## 运行

```bash
# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:5173）
npm run dev
```

**请先启动后端**，否则「校验」「求解」会请求失败。开发时 Vite 会把 `/api` 代理到 `http://127.0.0.1:8000`。

## 功能

- **9×9 数独棋盘**：点击格子输入 1–9，留空表示未填
- **校验**：检查当前棋盘是否合法（无同行/同列/同宫重复）
- **求解**：请求后端求解，成功后将棋盘替换为解
- **清空**：重置为空棋盘

## 构建

```bash
npm run build
npm run preview   # 预览构建结果
```

构建后为静态资源，部署时需将 `/api` 反向代理到后端地址。

## 部署

构建后的静态文件位于 `dist` 目录。部署时需要配置 Web 服务器将 `/api` 路径反向代理到后端服务。

### Nginx 配置示例

假设后端服务运行在 `http://127.0.0.1:8000`，前端静态文件在 `/var/www/puzzle-solver-frontend/dist`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态文件根目录
    root /var/www/puzzle-solver-frontend/dist;
    index index.html;

    # 前端路由（React Router 等）
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Apache 配置示例

在 Apache 配置文件中启用 `mod_proxy` 和 `mod_rewrite`：

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/puzzle-solver-frontend/dist

    # 前端路由
    <Directory /var/www/puzzle-solver-frontend/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # API 反向代理
    ProxyPreserveHost On
    ProxyPass /api http://127.0.0.1:8000/api
    ProxyPassReverse /api http://127.0.0.1:8000/api
</VirtualHost>
```

### 其他部署方式

- **Vercel/Netlify**：在项目根目录创建 `vercel.json` 或 `netlify.toml` 配置重写规则
- **Docker + Nginx**：使用 Nginx 官方镜像，将上述配置写入容器
- **Node.js 服务器**：使用 `express` + `http-proxy-middleware` 或 `http-proxy`

**注意**：请根据实际后端地址修改代理目标 URL。
