# CMP 3.0 Admin

类后台管理系统前端**壳子**（Vue3 + Vite + TypeScript + Element Plus）。

当前阶段目标：**能跑、能看、能点**。所有数据都是本地 mock，后续按模块一个一个对接真实接口
（`.env` 里把 `VITE_USE_MOCK` 改成 `false`，api 层就会自动改走 axios 真实请求）。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173（启动后自动打开浏览器）
```

演示账号：`admin` / `123456`（另有 `viewer` / `123456`）

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务 |
| `npm run build` | 打包到 `dist/` |
| `npm run preview` | 预览打包结果（注意：用 `npx vite preview --port 4173`，`npm run preview -- --port` 的参数会被 npm 吞掉） |
| `npm run type-check` | TypeScript 类型检查（**打包不跑它**，提交前建议手动跑一遍） |
| `npm run format` | Prettier 格式化 |

> Element Plus 的 **JS 按需引入**（unplugin-vue-components），但 **CSS 是全量引入**的。
> 原因：`ElMessage` / `ElMessageBox` 这类命令式调用的组件样式不会被自动引入，只引 JS 会让弹窗渲染成没有样式的裸 DOM（按钮错位到左上角）。
> 全量 CSS 约 350KB（gzip 后约 50KB，且只加载一次），换配置简单 + 不会再缺样式，值。

## 环境变量（`.env.development` / `.env.production`）

| 变量 | 说明 |
| --- | --- |
| `VITE_API_BASE_URL` | 后端接口前缀，默认 `/api`（可配合 vite proxy 使用） |
| `VITE_USE_MOCK` | `true` = 走本地 mock 数据；`false` = 走真实接口 |
| `VITE_USE_AUTH` | `true` = 未登录跳登录页；`false` = 免登录直接看页面（纯看壳子时用） |
| `VITE_MENU_SOURCE` | 菜单来源：`static`（默认）/ `remote` / `auto`，见下方"菜单是数据驱动的" |
| `VITE_APP_TITLE` | 浏览器标题 |

> 也可以在项目根目录建一个 `.env.development.local`（已在 .gitignore 里）做本地覆盖，例如 `VITE_USE_AUTH=false`。

## 目录结构

```
src/
├── api/            # 接口层：request.ts(axios 封装) + auth/permitWork/role/dashboard
├── components/     # 通用组件：AppLogo、DonutChart(纯 SVG 环形图，没引图表库)
├── config/menu.ts  # ★ 菜单配置：顶部两个大 Tab + 左侧菜单全部由这里驱动
├── layout/         # MainLayout：顶栏信息条 + 大 Tab + 左侧菜单 + 内容区
├── mock/           # 假数据：auth / permitWork / role / dashboard（helper.ts 控制整体开关）
├── router/         # 路由 + 登录守卫；子路由由 menu.ts 动态展开
├── store/          # Pinia：用户态（token/userInfo，手写 localStorage 持久化）
├── styles/         # variables.scss(注入到每个 scss) / index.scss(全局) / element-vars.scss(主题变量)
├── types/          # api.ts(统一返回结构/分页) + env.d.ts
├── utils/          # storage.ts / format.ts(日期时间农历)
└── views/          # 页面
    ├── login/LoginView.vue                     # 登录页（背景是纯 CSS 搭的城市，没用图片）
    ├── dashboard/DashboardView.vue             # 系统监控概览（统计卡 + 环形图）
    ├── dataReceiving/PermittedToWork.vue       # 许可作业列表（查询 + 表格 + 分页）
    ├── cmpSetting/RoleManagement.vue           # 角色管理（查询 + 表格 + 分页 + 增删改弹窗）
    ├── placeholder/MenuPlaceholder.vue         # 其余菜单的统一占位页
    └── error/NotFound.vue
```

## 怎么改

- **改菜单名 / 加菜单项**：只动 `src/config/menu.ts`。不写 `component` 的菜单项会自动用占位页。
- **接一个真实接口**：改 `src/api/xxx.ts`，把 `if (USE_MOCK) return mock...` 那段删掉即可，URL 已经按 REST 风格写好注释。
- **换登录背景/logo**：登录页是纯 CSS 画的，有设计图后直接替换 `.bg` / `AppLogo.vue` 即可。
- **主题色**：改 `src/styles/variables.scss`（`$primary`）和 `src/styles/element-vars.scss`（`--el-color-primary`）。

## 菜单是"数据驱动"的（为动态菜单预留）

**后续两个模块的左侧菜单大概率会由后端按角色下发**，所以菜单做成了"换源不改渲染"的结构：

```
菜单源（静态 config/menu.ts  /  后端 /menu/routes）
      ↓  config/menuTree.ts 归一化成统一的 MenuNode 树
   MenuNode 树
      ↓  store/menu.ts 按权限过滤整个树（父级没子项就整块消失）
   渲染 layout/MenuTree.vue（递归）  +  路由 router/index.ts（按 path 绑定组件）
```

| 文件 | 作用 |
| --- | --- |
| `config/menu.ts` | 静态源（同时是路由表的数据源） |
| `config/menuTypes.ts` | `MenuNode` 统一形状 + 过滤/展平/找祖先等工具 |
| `config/menuTree.ts` | 两个源的适配器：`buildStaticMenus()` / `normalizeRemoteMenus()` |
| `store/menu.ts` | 菜单状态 + **权限过滤**（唯一入口，布局不再自己判断权限） |
| `layout/MenuTree.vue` | 递归渲染，**不认识任何具体菜单** |
| `layout/MenuIcon.vue` | 图标解析（唯一的图标映射点） |
| `api/menu.ts` | 菜单接口占位（`VITE_MENU_SOURCE` 控制是否启用） |

### 切换菜单来源

```bash
# .env.development.local（该文件已 gitignore）
VITE_MENU_SOURCE=auto     # 先试后端接口，失败自动回退静态配置
```

- `static`（默认）：读静态配置，界面和设计图一致
- `remote` / `auto`：调 `GET /menu/routes`；接口没数据或报错都会**回退静态配置**，不会白屏
- 想看动态菜单长什么样：建上面那个文件 + 重启 dev server，用 admin 登录
  → 左侧会出现二级分组「现场监测」、带角标的菜单项、以及被 `visible:0` 隐藏的项（假数据在 `src/mock/menu.ts`）

### 已经支持的菜单能力（都是可选字段，后端给了就显示）

`icon` / `badge` / `order`（排序）/ `hidden`（隐藏但保留路由）/ `externalLink`（外链新窗口）/ `disabled` / `children`（**任意层级**，渲染是递归的）

### 后端接口约定（可直接发给后端）

`GET /menu/routes` 返回当前用户的菜单树，节点字段见 `config/menuTree.ts` 的 `RemoteMenuNode`
（已兼容 `name`/`menuName`、`path`/`url`、`permission`/`perms`、`orderNum`/`sort`、`visible`/`hidden` 等常见命名）。

**建议后端不要返回前端组件路径**：页面组件必须在前端注册，所以路由表由前端维护，
后端只返回"哪些菜单可见 + 顺序 + 层级"，两边用 `path` 对齐即可。
万一后端返回了前端没实现的 path，会落到兜底路由显示"页面未实现"，而不是白屏。

## 权限设计（守卫的三层职责）

权限相关代码集中在 4 个地方，**不要**在业务页面里自己判断角色：

| 文件 | 职责 |
| --- | --- |
| `src/config/permission.ts` | 权限点注册表 `P.xxx` + 角色→权限映射表（临时，等后端下发权限清单） |
| `src/router/index.ts` | 守卫，**页级**拦截 |
| `src/directives/permission.ts` | `v-permission` 指令，**按钮级**显示控制 |
| `src/store/user.ts` | `permissions` getter + `hasPermission()`，唯一判断入口 |

守卫按顺序做三件事，**别把它们混在一起**（这是之前最容易写乱的地方）：

1. **认证**：有没有登录（token）→ 没有则跳 `/login` 并记住原地址
2. **身份**：当前用户是谁（角色/权限点）→ 刷新后 store 是空的，这里补齐；拉取失败**不阻断**导航
3. **授权**：这个身份能不能进这个页面 → 页面在路由 `meta.permission` 里声明权限点，不满足跳 `/forbidden`

三层各自的"待明确"都写在 `router/index.ts` 顶部注释里（权限点谁维护、token 续期、是否改成后端下发动态菜单）。

### 怎么加一个需要权限的菜单 / 按钮

```ts
// 1) 注册权限点
export const P = { roleAdd: 'role:add', /* ... */ }

// 2) 菜单挂权限（不填 = 登录就能进，所以"要不要权限"请显式写出来）
{ title: '角色管理', path: 'roles', component: '...', permission: P.roleQuery }

// 3) 按钮挂权限
<el-button v-permission="P.roleAdd">新增</el-button>
```

演示账号：`admin`（全权限）、`viewer`（只有 `data:view`）——用 viewer 登录可以看到 CMP Setting 整个 Tab 消失、手敲 URL 会被送到 403。

> ⚠️ 前端隐藏菜单/按钮只是**显示控制**，真正的鉴权必须由后端做。

## 部署（Cloudflare Pages）

**域名还没到，先用 Pages 默认域名 `https://cmp-admin.pages.dev` 看线上效果**（免 ICP、全球边缘节点）。

```bash
npx wrangler@3 login      # 一次性授权（凭证在 %APPDATA%\xdg.config\.wrangler）
bash deploy.sh            # 构建 + 部署
```

脚本内容与隔壁 `web-portal` 的部署方案一致，已经踩过的坑都写在 `deploy.sh` 注释里：

1. **必须带 `--branch main`**，否则算"预览部署"，生产地址 404
2. Cloudflare Pages **单文件上限 25MB**
3. Windows 下素材的**只读位**会导致上传失败，部署前先 `chmod`

域名到位后：Cloudflare 后台 → Workers & Pages → `cmp-admin` → Custom domains 绑定即可，
只需改 `deploy.sh` 里的 `CF_URL`，**前端代码不用动**（用的是 hash 路由，不依赖域名或子路径）。

## 已知待办（等需求/接口明确）

- 弹窗类页面（新增/编辑）除角色管理外都还没做
- 导出按钮只有提示，没有真实导出
- 权限控制（按角色显示菜单/按钮）未做
- 多语言（现在中文是简体凑合，正文原图是繁体）
- 顶栏「微网环境监测 / 报警通知」是静态假数据
- Data Receiving 左侧菜单目前 9 项，还差 2 项名字待确认
