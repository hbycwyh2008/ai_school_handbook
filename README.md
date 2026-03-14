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

## Deploy on Railway（一步步来）

**第一步**  
打开 https://railway.app ，登录，点 **New Project**。

**第二步**  
在项目里点 **+ New**，选 **Database**，再选 **PostgreSQL**。等它建好，不用改任何设置。

**第三步**  
再点 **+ New**，选 **GitHub Repo**。在列表里选你的仓库（例如 `csa_scores_tracker`），选好后 Railway 会开始从 GitHub 拉代码并部署。

**第四步**  
部署完成后，你会看到两个服务：一个 PostgreSQL，一个你的应用（Web Service）。点**你的应用**（不要点数据库）。

**第五步**  
在应用页面里点 **Variables**。先点 **Add Reference**（或 **New Variable** 里的 **Add Reference**），在列表里选 PostgreSQL 那个服务，再选 **DATABASE_URL**，确认。这样应用就能连上数据库。

**第六步**  
还是在 **Variables** 里，点 **New Variable**，一个一个加下面这些（名字和值都要填对）：

- 变量名：`JWT_SECRET`，值：随便一串长字母数字（例如 32 位）。
- 变量名：`TEACHER_USERNAME`，值：`teacher`（或你想用的用户名）。
- 变量名：`TEACHER_PASSWORD`，值：你想设的密码。
- 变量名：`TEACHER_EMAIL`，值：老师的邮箱（用来 Google 登录时识别老师）。

先加这 4 个，保存。

**第七步**  
在应用页面点 **Settings**，找到 **Networking**，点 **Generate Domain**。Railway 会给你一个地址，像 `xxxx.up.railway.app`。复制这个地址。

**第八步**  
回到 **Variables**，再加两个变量：

- 变量名：`BASE_URL`，值：`https://你刚才复制的地址`（例如 `https://xxxx.up.railway.app`，不要末尾斜杠）。
- 变量名：`GOOGLE_CALLBACK_URL`，值：`https://你刚才复制的地址/api/auth/google/callback`。

保存。

**第九步**  
（可选）如果你要用 Google 登录：打开 https://console.cloud.google.com/apis/credentials ，在你的 OAuth 客户端里，在「已授权的重定向 URI」里加一条：`https://你复制的 Railway 地址/api/auth/google/callback`。然后把 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 也填到 Railway 的 Variables 里。

**第十步**  
Variables 改过之后，在 **Deployments** 里点右上角 **⋯**，选 **Redeploy**，等部署完成。

**第十一步**  
浏览器打开 `https://你复制的 Railway 地址`，用 **第六步** 里设的 `TEACHER_USERNAME` 和 `TEACHER_PASSWORD` 登录。能进去就说明部署成功了。
