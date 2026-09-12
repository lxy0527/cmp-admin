#!/usr/bin/env bash
# ============================================================
# 一键部署到 Cloudflare Pages（免 ICP，先跑通线上预览，域名到位后再绑自定义域名）
#
# 用法：bash deploy.sh
# 首次需先授权一次：npx wrangler@4 login
#
# ⚠️ 必须用 wrangler **v4**：v3（隔壁项目 DEPLOY.md 里写的版本）已经连不上 Cloudflare API，
#    会报 `fetch failed` / whoami 失败，看着像"没授权"，其实换 v4 就好。
#
# 与隔壁 web-portal 的 DEPLOY.md 同一套思路（那套已经踩过坑，这里照抄结论）：
#   1) 必须带 --branch main，否则会被当"预览部署"，生产地址 404
#   2) Cloudflare Pages 单文件上限 25MB
#   3) windows 下 public 素材带只读位会导致上传失败，先 chmod
#   4) --commit-dirty=true：本地有未提交改动时也照样部署（否则会警告/可能拒绝）
# ============================================================

CF_PROJECT="cmp-admin"                  # Cloudflare Pages 项目名 → 默认地址 https://cmp-admin.pages.dev
CF_BRANCH="main"                        # 生产分支，必须和项目里的 production-branch 一致
CF_CMD="npx --yes wrangler@4"

cd "$(dirname "$0")"
echo "==> 当前目录: $(pwd)"

# 域名还没到位，先用 Pages 默认域名；后面绑好自定义域名再改这里
CF_URL="https://${CF_PROJECT}.pages.dev"

# ---- 1. 清理只读属性（避免上传时"路径无读写权限"）----
echo "==> [1/3] 清理只读属性"
chmod -R a+w public 2>/dev/null || true
chmod -R a+w dist 2>/dev/null || true

# ---- 2. 构建（vite build）----
echo "==> [2/3] 构建"
if ! npm run build; then
  echo "构建失败，中止部署"
  exit 1
fi

# ---- 3. 部署 ----
echo "==> [3/3] 部署 Cloudflare Pages"
if $CF_CMD pages deploy dist --project-name="$CF_PROJECT" --branch "$CF_BRANCH" --commit-dirty=true; then
  echo "部署成功"
else
  echo "部署失败（若提示无权限/连不上，先跑一次: npx wrangler@4 login）"
  exit 1
fi

echo ""
echo "============ 部署结果 ============"
echo "  访问地址: $CF_URL"
echo "=================================="
echo ""
echo "提示："
echo "  - 首次部署若项目不存在，wrangler 会问是否创建，选 y"
echo "  - 以后绑自定义域名：Cloudflare 后台 → Workers & Pages → $CF_PROJECT → Custom domains"
echo "  - 验证新版本是否生效：curl -s \"$CF_URL/index.html\" -H \"Cache-Control: no-cache\" | grep -oE 'assets/[^\\\"]+\\.js'"
