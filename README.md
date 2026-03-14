# AP Score Tracker

Web app for tracking AP CSA/CSP mock test scores with role-based access: teacher (full CRUD), students (read-only via login or share links), and viewer links for 行政/申请老师.

## Local setup

1. **Node.js 18+** and **PostgreSQL** required.

2. **Clone and install**
   ```bash
   npm install
   ```

3. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` (e.g. `postgres://user:password@localhost:5432/ap_tracker`).
   - Set `JWT_SECRET` (long random string).
   - For Google login, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, and `TEACHER_EMAIL`.
   - Teacher fallback login: `TEACHER_USERNAME`, `TEACHER_PASSWORD`.

4. **Database**
   ```bash
   npm run db:init
   ```

5. **Run**
   ```bash
   npm start
   ```
   Open `http://localhost:3000`.

## Google OAuth (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create OAuth 2.0 Client ID (Web application).
3. Add authorized redirect URI: `http://localhost:3000/api/auth/google/callback` (or your production URL).
4. Put Client ID and Client Secret in `.env` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
5. Set `TEACHER_EMAIL` to the Google account that should be the teacher.

## First run

- If no teacher exists, one is created from `TEACHER_EMAIL` / `TEACHER_USERNAME` / `TEACHER_PASSWORD`.
- Teacher can sign in with **username + password** or **Sign in with Google**.
- Teacher adds students, generates **invite links** (students sign in with Google to register) or **share links** (view one student’s report, no login).
- **Viewer links** (行政/申请老师): create a named link and choose which students it can see; anyone with the link gets read-only access to those students.

## Deploy on Render

1. New Web Service, connect repo.
2. Add PostgreSQL from Render dashboard; `DATABASE_URL` is set automatically.
3. In service Environment, set: `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TEACHER_EMAIL`, and optionally `TEACHER_USERNAME`, `TEACHER_PASSWORD`.
4. Build: `npm install`; Start: `npm run db:init && npm start`.
5. Set redirect URI in Google Console to `https://<your-service>.onrender.com/api/auth/google/callback`.

## Deploy on Railway

1. Go to [Railway](https://railway.app), sign in, and create a new project.
2. **Add PostgreSQL**: In the project, click **+ New** → **Database** → **PostgreSQL**. Railway 会自动生成 `DATABASE_URL` 等变量。
3. **从 GitHub 部署应用**：**+ New** → **GitHub Repo**，选择本仓库。Railway 会识别为 Node 项目。
4. **关联数据库**：在 Web Service 的 **Variables** 里，点击 **Add Reference**，选择该 PostgreSQL 的 `DATABASE_URL`，这样应用会拿到数据库连接串。
5. **设置环境变量**（在 Web Service 的 Variables 中）：
   - `JWT_SECRET`：随机长字符串
   - `BASE_URL`：部署后的访问地址，如 `https://xxx.up.railway.app`
   - `GOOGLE_CALLBACK_URL`：`https://xxx.up.railway.app/api/auth/google/callback`
   - `TEACHER_EMAIL`、`TEACHER_USERNAME`、`TEACHER_PASSWORD`（老师账号）
   - 若用 Google 登录：`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`
6. **启动命令**：Build 使用 `npm install`，Start 使用：
   ```bash
   npm run db:init && npm start
   ```
   若 Railway 未识别，在项目根目录添加 `railway.json` 或在该服务的 Settings 里设置 Start Command 为上述命令。
7. **Google OAuth**：在 Google Cloud Console 的授权重定向 URI 中加入 `https://你的域名/api/auth/google/callback`。
8. 首次访问用老师账号登录后，在后台执行过一次建表，之后即可正常使用。
