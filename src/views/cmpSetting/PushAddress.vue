<template>
  <div class="page push-address">
    <div class="pa-grid">
      <!-- ---------------- 左：推送地址清单 ---------------- -->
      <div class="page-card list-card">
        <div class="card-head">
          <span class="card-title">{{ t('menu.cmpSettingItems.pushAddress') }}</span>
          <el-tag size="small" type="info">{{ PUSH_ENDPOINTS.length }}</el-tag>
        </div>

        <ul class="endpoint-list">
          <li v-for="item in PUSH_ENDPOINTS" :key="item.key" class="endpoint">
            <div class="endpoint-head">
              <span class="endpoint-label">{{ endpointLabel(item) }}</span>
              <el-tag size="small" effect="plain">{{ item.method }}</el-tag>
            </div>
            <div class="endpoint-path">
              <span class="mono">{{ item.path }}</span>
              <el-button link type="primary" size="small" @click="copyPath(item.path)">
                {{ t('pushAddress.copy') }}
              </el-button>
            </div>
          </li>
        </ul>

        <el-alert type="info" :closable="false" class="pa-note" :title="t('pushAddress.sourceNote')" />
        <el-alert type="warning" :closable="false" class="pa-note" :title="t('pushAddress.legacyNote')" />
      </div>

      <!-- ---------------- 右：内嵌文档 ---------------- -->
      <div class="page-card doc-card">
        <div class="card-head">
          <span class="card-title">{{ t('pushAddress.docTitle') }}</span>
          <div class="doc-actions">
            <el-radio-group v-model="docKey" size="small">
              <el-radio-button v-for="p in DOC_PAGES" :key="p.key" :value="p.key">
                {{ t(`pushAddress.docPage.${p.key}`) }}
              </el-radio-button>
            </el-radio-group>
            <el-button link type="primary" size="small" @click="openInNewTab">
              {{ t('pushAddress.openInNewTab') }}
            </el-button>
          </div>
        </div>

        <div class="doc-frame-wrap">
          <!--
            内嵌官方文档站。
            ⚠️ 该站**只有 http、没有 https**，所以在 https 页面里 iframe 会被浏览器
            按"混合内容"直接拦掉（本地 http://localhost 开发时能正常显示）。
            因此这里做降级：https 环境不渲染 iframe，改成提示 + 新窗口打开。
          -->
          <iframe v-if="canEmbed" :key="docUrl" :src="docUrl" class="doc-frame" referrerpolicy="no-referrer" />
          <div v-else class="doc-fallback">
            <el-alert type="warning" :closable="false" :title="t('pushAddress.httpOnlyDoc')" />
            <el-button type="primary" plain class="doc-fallback-btn" @click="openInNewTab">
              {{ t('pushAddress.openInNewTab') }}
            </el-button>
          </div>
          <div class="doc-hint">{{ t('pushAddress.docHint') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 推送地址
 * ============================================================
 * 这页不是"配置页"，是**给对接方看的说明页**：
 *   - 左边：8 条第三方推送入口地址（可复制）
 *   - 右边：直接内嵌官方接口文档，省得再开一个标签页
 *
 * ⚠️ 两处数据来源的坑（页面下方有提示，别当 bug）：
 *   1. 地址清单目前是**静态配置** —— 旧站拉清单的 `/cmp/common/receiving-apis`
 *      在我们后端上实测 404（那是旧站后台接口）。等后端给了就换成动态。
 *   2. 内嵌的是**公开文档站**，完整版 v1.6.0（含配置同步/统计同步）只在旧站。
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { DOC_BASE, DOC_PAGES, PUSH_ENDPOINTS, type PushEndpoint } from '@/config/pushAddress'

defineOptions({ name: 'PushAddress' })

const { t } = useI18n()

/** 当前内嵌的文档页（默认通用说明） */
const docKey = ref<string>(DOC_PAGES[0].key)

const docUrl = computed(() => {
  const page = DOC_PAGES.find((p) => p.key === docKey.value) || DOC_PAGES[0]
  return `${DOC_BASE}${page.path}`
})

/**
 * 能不能内嵌文档：只有当前页面和文档站**同为 http**时才行。
 * 文档站没有 https，所以在 https 部署环境下 iframe 会被浏览器拦掉（混合内容），
 * 这时改成提示 + 新窗口打开，而不是留一块白屏。
 */
const canEmbed = computed(() => {
  const docIsHttps = DOC_BASE.startsWith('https://')
  const pageIsHttps = window.location.protocol === 'https:'
  return docIsHttps || !pageIsHttps
})

/** 地址标题：系统名（英文品牌，不翻译）+ 用途后缀（走 i18n） */
function endpointLabel(item: PushEndpoint): string {
  const suffix = t(`pushAddress.kind.${item.kind}`)
  return item.system ? `${item.system} · ${suffix}` : suffix
}

/** 复制接口路径（很多对接方就是要拷这个） */
async function copyPath(path: string) {
  try {
    await navigator.clipboard.writeText(`${DOC_BASE.replace(/\/+$/, '')}${path}`)
    ElMessage.success(t('pushAddress.copied'))
  } catch {
    // 非 https / 老浏览器下 clipboard 不可用，退回手动提示
    ElMessage.warning(path)
  }
}

function openInNewTab() {
  window.open(docUrl.value, '_blank', 'noopener')
}
</script>

<style scoped lang="scss">
.push-address {
  height: 100%;
}

.pa-grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 12px;
  height: 100%;
}

.list-card,
.doc-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.card-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* ---------------- 地址清单 ---------------- */
.endpoint-list {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.endpoint {
  padding: 8px 10px;
  margin-bottom: 6px;
  background: #fafbfd;
  border: 1px solid #eef1f6;
  border-radius: 6px;

  &:hover {
    border-color: $primary;
  }
}

.endpoint-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.endpoint-label {
  font-size: 12px;
  font-weight: 500;
  color: $text-main;
  line-height: 1.4;
}

.endpoint-path {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.mono {
  flex: 1;
  min-width: 0;
  font-family: Consolas, monospace;
  font-size: 11px;
  color: $text-secondary;
  word-break: break-all;
}

.pa-note {
  flex: none;
  margin-top: 8px;
}

/* ---------------- 文档 ---------------- */
.doc-frame-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.doc-frame {
  flex: 1;
  min-height: 0;
  width: 100%;
  border: 1px solid #eef1f6;
  border-radius: 6px;
  background: #fff;
}

/* https 环境下的降级块：不渲染 iframe，改成提示 + 新窗口打开 */
.doc-fallback {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  border: 1px dashed #e4e7ed;
  border-radius: 6px;
  background: #fafbfd;
}

.doc-fallback-btn {
  min-width: 160px;
}

.doc-hint {
  flex: none;
  padding-top: 6px;
  font-size: 11px;
  color: $text-secondary;
}
</style>
