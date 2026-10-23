<template>
  <div class="page alarm-list">
    <!-- ---------------- 查询条件 ---------------- -->
    <div class="filter-bar">
      <div class="filter-item">
        <!-- 接口的 SearchTitle 是模糊搜索（报警编号/产品名称/产品编号/传感器/传感器编号），
             所以标签用通用的"搜索"，不要写成"报警编号" -->
        <span class="filter-label">{{ t('common.search') }}</span>
        <el-input
          v-model="query.SearchTitle"
          :placeholder="t('common.pleaseInput')"
          clearable
          class="filter-control"
          @keyup.enter="handleQuery"
        />
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('alarm.fields.level') }}</span>
        <el-select v-model="query.Level" :placeholder="t('common.pleaseSelect')" clearable class="filter-control">
          <el-option v-for="lv in [1, 2, 3]" :key="lv" :label="t(`alarm.levels.${lv}`)" :value="lv" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('alarm.fields.processStatus') }}</span>
        <el-select
          v-model="query.ProcessStatus"
          :placeholder="t('common.pleaseSelect')"
          clearable
          class="filter-control"
        >
          <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.processStatus.${v}`)" :value="v" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('alarm.fields.userStatus') }}</span>
        <el-select
          v-model="query.UserStatus"
          :placeholder="t('common.pleaseSelect')"
          clearable
          class="filter-control"
        >
          <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.userStatus.${v}`)" :value="v" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('alarm.fields.status') }}</span>
        <el-select v-model="query.Status" :placeholder="t('common.pleaseSelect')" clearable class="filter-control">
          <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.recordStatus.${v}`)" :value="v" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('alarm.filters.dateRange') }}</span>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :start-placeholder="t('common.pleaseSelect')"
          :end-placeholder="t('common.pleaseSelect')"
          unlink-panels
          class="filter-control filter-control--date"
        />
      </div>

      <div class="filter-actions">
        <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.query') }}</el-button>
        <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
      </div>
    </div>

    <!-- ---------------- 表格 ---------------- -->
    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">{{ pageTitle }}</span>
        <div class="batch-actions">
          <el-tooltip v-if="writeDenied" :content="t('account.permissionDenied')" placement="top">
            <span class="denied-hint">{{ t('account.permissionDenied') }}</span>
          </el-tooltip>
          <span class="selected-text">
            {{ t('common.selected') }}: {{ selectedIds.length }} {{ t('common.records') }}
          </span>
          <el-button size="small" :disabled="!canWrite" @click="handleBatchHide(1)">
            {{ t('alarm.actions.markHide') }}
          </el-button>
          <el-button size="small" :disabled="!canWrite" @click="handleBatchHide(0)">
            {{ t('alarm.actions.revokeHide') }}
          </el-button>
          <el-button size="small" type="warning" plain :disabled="!canWrite" @click="handleBatchStatus(1)">
            {{ t('alarm.actions.close') }}
          </el-button>
          <el-button size="small" type="success" plain :disabled="!canWrite" @click="handleBatchStatus(0)">
            {{ t('alarm.actions.open') }}
          </el-button>
          <!-- 删除：文档明确只有后端管理员（Role=1）有权限，前端这里只做显示控制 -->
          <el-button
            v-permission="P.alarmDelete"
            size="small"
            type="danger"
            plain
            :disabled="!canWrite || !selectedIds.length"
            @click="handleBatchDelete"
          >
            {{ t('alarm.actions.delete') }}
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="table.loading.value"
        :data="table.list.value"
        stripe
        height="100%"
        class="alarm-table"
        row-class-name="alarm-row"
        @selection-change="onSelectionChange"
        @row-click="handleRowClick"
      >
        <!--
          列宽策略（改之前先读）：
          全部用 `min-width` —— 窗口宽时列自动撑开、不留白；窄时按下面的最小值排。
          这组最小值是照着 **1130px 可用宽度**（1386px 视口 - 238px 侧边栏 - 内边距）调的，
          合计刚好放得下，不出现横向滚动条。
          文字列都带 `show-overflow-tooltip`：放不下就省略号 + 悬浮看全文，绝不折行。
        -->
        <el-table-column type="selection" width="44" align="center" fixed="left" />
        <el-table-column prop="SN" :label="t('alarm.fields.sn')" min-width="86" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <!-- 做成链接样式：告诉用户"这行可以点开看详情" -->
            <span class="sn-link">{{ row.SN }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="ProductName"
          :label="t('alarm.fields.productName')"
          min-width="86"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="SensorDevice"
          :label="t('alarm.fields.sensorDevice')"
          min-width="92"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="Description"
          :label="t('alarm.fields.description')"
          min-width="110"
          show-overflow-tooltip
        />
        <el-table-column prop="AlarmValue" :label="t('alarm.fields.alarmValue')" min-width="76" align="center">
          <template #default="{ row }">{{ row.AlarmValue || '--' }}</template>
        </el-table-column>
        <el-table-column
          prop="ConstSite"
          :label="t('alarm.fields.constSite')"
          min-width="80"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column prop="Floor" :label="t('alarm.fields.floor')" width="56" align="center">
          <template #default="{ row }">{{ row.Floor ?? '--' }}</template>
        </el-table-column>
        <el-table-column prop="Level" :label="t('alarm.fields.level')" min-width="112" align="center">
          <template #default="{ row }">
            <span class="level-tag" :class="levelClass(row.Level)">{{ levelText(row.Level) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="AlarmTime" :label="t('alarm.fields.alarmTime')" min-width="138" align="center">
          <template #default="{ row }">
            <!-- 列表里省掉秒（省 30px）；完整时间在「編輯」弹窗里看 -->
            <span class="nowrap">{{ shortTime(row.AlarmTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="UserStatus" :label="t('alarm.fields.userStatus')" min-width="66" align="center">
          <template #default="{ row }">{{ t(`alarm.userStatus.${row.UserStatus ?? 0}`) }}</template>
        </el-table-column>
        <el-table-column prop="Status" :label="t('alarm.fields.status')" min-width="62" align="center">
          <template #default="{ row }">{{ t(`alarm.recordStatus.${row.Status ?? 0}`) }}</template>
        </el-table-column>

        <el-table-column :label="t('common.operation')" width="112" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openMedia(row as AlarmRow)">
              {{ row.VideoUrl ? t('alarm.actions.viewVideo') : t('alarm.fields.imageUrl') }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              :disabled="!canWrite"
              @click="openEdit(row as AlarmRow)"
            >
              {{ t('common.edit') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-foot">
        <span class="total-text">{{ t('common.total', { total: table.total.value }) }}</span>
        <el-pagination
          v-model:current-page="table.pageNum.value"
          v-model:page-size="table.pageSize.value"
          :page-sizes="[10, 20, 50, 100]"
          :total="table.total.value"
          layout="prev, pager, next, sizes, jumper"
          background
          @size-change="table.handleSizeChange"
        />
      </div>
    </div>

    <!-- ---------------- 修改警报 ---------------- -->
    <el-dialog v-model="editVisible" :title="t('alarm.editTitle')" width="460px">
      <el-form :model="editForm" label-width="110px">
        <el-form-item :label="t('alarm.fields.falsePositive')">
          <el-switch v-model="editForm.FalsePositive" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item :label="t('alarm.fields.processStatus')">
          <el-select v-model="editForm.ProcessStatus" class="w-full">
            <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.processStatus.${v}`)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('alarm.fields.userStatus')">
          <el-select v-model="editForm.UserStatus" class="w-full">
            <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.userStatus.${v}`)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('alarm.fields.status')">
          <el-select v-model="editForm.Status" class="w-full">
            <el-option v-for="v in [0, 1]" :key="v" :label="t(`alarm.recordStatus.${v}`)" :value="v" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('alarm.fields.remark')">
          <el-input v-model="editForm.Remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ---------------- 图片 / 视频预览 ---------------- -->
    <el-dialog v-model="mediaVisible" :title="mediaTitle" width="640px">
      <video v-if="mediaVideo" :src="mediaVideo" controls class="media-video" />
      <el-image v-else-if="mediaImage" :src="mediaImage" fit="contain" class="media-image" />
      <el-empty v-else :description="t('common.noData')" />
    </el-dialog>

    <!--
      ---------------- 警报详情 ----------------
      旧站是一整页竖排「字段：值」，这里用抽屉（28 个字段弹窗太窄）。
      内容是"后端返回什么就显示什么"：已知字段按顺序 + 友好格式化，
      未知字段进「其他欄位」原样展示，不会被吞掉。
    -->
    <el-drawer v-model="detailVisible" :title="t('alarm.detailTitle')" size="520px">
      <div v-loading="detailLoading" class="detail-wrap">
        <el-descriptions v-if="detailRow" :column="1" border size="small">
          <el-descriptions-item v-for="f in detailFields" :key="f.key" :label="f.label">
            <!-- 图片：缩略图 + 点击放大（el-image 的 preview 自带缩放/旋转） -->
            <div v-if="f.key === 'ImageUrl' && f.raw" class="detail-image">
              <el-image
                :src="withBase(f.raw)"
                :preview-src-list="[withBase(f.raw)]"
                :initial-index="0"
                preview-teleported
                hide-on-click-modal
                fit="cover"
                class="detail-thumb"
              >
                <template #error>
                  <span class="detail-empty">{{ t('alarm.imageLoadFailed') }}</span>
                </template>
              </el-image>
              <span class="detail-image-tip">{{ t('alarm.clickToZoom') }}</span>
            </div>
            <el-link
              v-else-if="f.key === 'VideoUrl' && f.raw"
              type="primary"
              :href="withBase(f.raw)"
              target="_blank"
            >
              {{ t('alarm.actions.viewVideo') }}
            </el-link>
            <span v-else :class="{ 'detail-empty': !f.value }">{{ f.value || '--' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <el-empty v-else-if="!detailLoading" :description="t('common.noData')" />

        <!-- 后端多返回的字段（前端没预定义）也不会丢 -->
        <template v-if="detailExtra.length">
          <div class="detail-extra-title">{{ t('alarm.otherFields') }}</div>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item v-for="f in detailExtra" :key="f.key" :label="f.label">
              <span class="mono">{{ f.value || '--' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 警报列表 —— **7 个分类共用这一个页面**
 * ============================================================
 * 7 个菜单项（E-Lock / Mobile Plant / Crane Lifting / Frontline / AI /
 * Confined Space / VR Training）在 `config/menu.ts` 里指向同一个组件，
 * 靠路由 props 传进来的 `categoryId` 区分（值 1~7，以接口为准）。
 *
 * 分页/筛选的分工：
 *   - **筛选走后端**（接口支持 SearchTitle / Level / Status / 时间范围等组合查询）
 *   - **分页走前端**（后端明确不做分页，一次返回全量）
 *   所以点"查询"会重新请求，翻页不会。
 */
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'
import {
  deleteAlarms,
  getAlarmDetail,
  getAlarmList,
  getAlarmPage,
  setAlarmStatus,
  setAlarmUserStatus,
  updateAlarm,
  type AlarmRow
} from '@/api/alarm'
import { checkPermissionApi } from '@/api/auth'
import { useTableList } from '@/composables/useTableList'
import { P } from '@/config/permission'
import { formatServerDateTime } from '@/utils/format'

defineOptions({ name: 'AlarmList' })

const props = defineProps<{
  /** 产品分类 Id（1~7），由菜单配置传入 */
  categoryId: number
}>()

const { t } = useI18n()

/**
 * 能不能改这条警报 —— 由**后端**说了算，不问前端权限点
 *
 * 文档：`CustomerAdmin`（客户管理员）才能改警报状态；超管天然包含。
 * 这里在页面挂载时问一次 `/api/permission`，没权限就把所有写操作按钮禁掉，
 * 免得用户点了才失败（后端仍会拒绝，这只是提前告知）。
 *
 * 默认 true：先在"允许"状态，后端确认没权限后再禁 ——
 * 反过来的话有权限的用户会先看到一个灰按钮闪一下，很别扭。
 */
const canWrite = ref(true)
const writeDenied = ref(false)

onMounted(async () => {
  // 只有后端**明确拒绝**才禁用写操作；
  // 「问不出结论」（302 跳登录页 / 空响应 / 连不上）保持可用，
  // 否则后端一没实现好，所有人都变成只读。
  const verdict = await checkPermissionApi('CustomerAdmin')
  canWrite.value = verdict !== 'denied'
  writeDenied.value = verdict === 'denied'
})

/** categoryId → i18n key 后缀（只为取标题用） */
const MENU_KEY_BY_CATEGORY: Record<number, string> = {
  1: 'eLockAndKeySys',
  2: 'unsafeActsMobilePlant',
  3: 'unsafeActsCraneLifting',
  4: 'smartMonitoringForFrontline',
  5: 'safetyMonitoringSysUsingAI',
  6: 'confinedSpaceMonitoring',
  7: 'vrTraining'
}

/** 页面标题就用菜单名（菜单名来自 i18n，会跟着语言变） */
const pageTitle = computed(
  () => t(`menu.dataReceivingItems.${MENU_KEY_BY_CATEGORY[props.categoryId] || 'eLockAndKeySys'}`)
)

/* ---------------- 查询条件 ---------------- */
const query = reactive<{
  SearchTitle: string
  Level?: number
  ProcessStatus?: number
  UserStatus?: number
  Status?: number
}>({
  SearchTitle: '',
  Level: undefined,
  ProcessStatus: undefined,
  UserStatus: undefined,
  Status: undefined
})

/** 日期范围单独放：接口要的是 StartTime / EndTime 两个字段 */
const dateRange = ref<[string, string] | null>(null)

// 服务端分页（后端 2026-10-20 新增）：7 个分类共用，靠 categoryId 区分
const table = useTableList<AlarmRow>({
  mode: 'server',
  fetchPage: ({ page, pageSize }) =>
    getAlarmPage({
      CategoryId: props.categoryId,
      SearchTitle: query.SearchTitle,
      Level: query.Level,
      ProcessStatus: query.ProcessStatus,
      UserStatus: query.UserStatus,
      Status: query.Status,
      StartTime: dateRange.value?.[0] ? `${dateRange.value[0]} 00:00:00` : undefined,
      EndTime: dateRange.value?.[1] ? `${dateRange.value[1]} 23:59:59` : undefined,
      page,
      pageSize
    })
})

/** 查询 = 重新请求 + 回到第 1 页 */
async function handleQuery() {
  table.search()
  await table.load().catch(() => void 0)
}

async function handleReset() {
  query.SearchTitle = ''
  query.Level = undefined
  query.ProcessStatus = undefined
  query.UserStatus = undefined
  query.Status = undefined
  dateRange.value = null
  await handleQuery()
}

/* ---------------- 选中与批量操作 ---------------- */
const selectedIds = ref<number[]>([])

function onSelectionChange(rows: AlarmRow[]) {
  selectedIds.value = rows.map((r) => r.Id)
}

/** 批量隐藏 / 撤销隐藏 */
async function handleBatchHide(userStatus: number) {
  if (!selectedIds.value.length) {
    ElMessage.warning(t('alarm.selectRowsFirst'))
    return
  }
  const action =
    userStatus === 1 ? t('alarm.actions.markHide') : t('alarm.actions.revokeHide')
  const ok = await ElMessageBox.confirm(
    t('alarm.messages.confirmMarkHide', { action, count: selectedIds.value.length }),
    t('common.warmTip'),
    { type: 'warning' }
  ).catch(() => false)
  if (!ok) return

  try {
    await setAlarmUserStatus(selectedIds.value, userStatus)
    ElMessage.success(
      userStatus === 1 ? t('alarm.messages.markHideSuccess') : t('alarm.messages.revokeHideSuccess')
    )
    await table.load()
  } catch {
    ElMessage.error(
      userStatus === 1 ? t('alarm.messages.markHideFailed') : t('alarm.messages.revokeHideFailed')
    )
  }
}

/** 批量关闭 / 开启 */
async function handleBatchStatus(status: number) {
  if (!selectedIds.value.length) {
    ElMessage.warning(t('alarm.selectRowsFirst'))
    return
  }
  const action = status === 1 ? t('alarm.actions.close') : t('alarm.actions.open')
  const ok = await ElMessageBox.confirm(
    t('alarm.messages.confirmMarkHide', { action, count: selectedIds.value.length }),
    t('common.warmTip'),
    { type: 'warning' }
  ).catch(() => false)
  if (!ok) return

  try {
    await setAlarmStatus(selectedIds.value, status)
    ElMessage.success(t('common.operationSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('alarm.messages.statusModifiedFailed'))
  }
}

/**
 * 列表里的时间省掉秒：`2026-10-14 09:10`（省 30px 宽度）
 * 完整到秒的时间在「編輯」弹窗里显示。
 */
function shortTime(value: string) {
  return formatServerDateTime(value).slice(0, 16)
}

/* ---------------- 批量删除 ---------------- */
/**
 * ⚠️ 文档原文："删除只有后端管理员账号才有权限"。
 * 前端这里的 v-permission 只是**显示控制**，真正的把关必须由后端做
 * （否则改一下 JS 就能删）。接口是 /api/alarmDeletes，IdArr 逗号分隔。
 */
async function handleBatchDelete() {
  if (!selectedIds.value.length) {
    ElMessage.warning(t('alarm.selectRowsFirst'))
    return
  }
  const ok = await ElMessageBox.confirm(
    t('alarm.messages.confirmDelete', { count: selectedIds.value.length }),
    t('common.warmTip'),
    { type: 'warning', confirmButtonClass: 'el-button--danger' }
  ).catch(() => false)
  if (!ok) return

  try {
    await deleteAlarms(selectedIds.value)
    ElMessage.success(t('alarm.messages.deleteSuccess'))
    selectedIds.value = []
    await table.load()
  } catch {
    ElMessage.error(t('alarm.messages.deleteFailed'))
  }
}

/* ---------------- 修改单条 ---------------- */
const editVisible = ref(false)
const saving = ref(false)
const editForm = reactive({
  Id: 0,
  FalsePositive: 0,
  ProcessStatus: 0,
  UserStatus: 0,
  Status: 0,
  Remark: ''
})

function openEdit(row: AlarmRow) {
  editForm.Id = row.Id
  editForm.FalsePositive = row.FalsePositive ?? 0
  editForm.ProcessStatus = row.ProcessStatus ?? 0
  editForm.UserStatus = row.UserStatus ?? 0
  editForm.Status = row.Status ?? 0
  editForm.Remark = row.Remark ?? ''
  editVisible.value = true
}

async function submitEdit() {
  saving.value = true
  try {
    await updateAlarm({ ...editForm })
    ElMessage.success(t('alarm.editSuccess'))
    editVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('alarm.editFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 图片 / 视频 ---------------- */
const mediaVisible = ref(false)
const mediaImage = ref('')
const mediaVideo = ref('')
const mediaTitle = computed(() =>
  mediaVideo.value ? t('alarm.actions.videoPreview') : t('alarm.fields.imageUrl')
)

/** 后端给的是相对根目录路径（如 /user/xxx.png），要拼上接口主机 */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL as string | undefined) || ''

function openMedia(row: AlarmRow) {
  mediaVideo.value = row.VideoUrl ? withBase(row.VideoUrl) : ''
  mediaImage.value = row.ImageUrl ? withBase(row.ImageUrl) : ''
  mediaVisible.value = true
}

function withBase(url: string) {
  if (!url) return ''
  // 已经是完整地址 / 内联图片 / 对象地址，就不要再拼前缀了
  if (/^(https?:|data:|blob:|\/\/)/i.test(url)) return url
  return `${ASSET_BASE}${url}`
}

/* ---------------- 详情 ---------------- */
/**
 * 详情页的原则：**后端返回什么就显示什么**。
 *
 * 上面 DETAIL_FIELDS 是"已知字段 + 显示顺序"（顺序照旧站那张图排的），
 * 值会按类型做格式化（等级、状态走 i18n，时间格式化，经纬度保留 6 位）。
 *
 * 关键：**不在 DETAIL_FIELDS 里的字段不会被丢掉** —— 会进到"其他欄位"里原样展示。
 * 这样后端以后新增字段，前端不改代码也能看到，不会出现"接口有值但页面没有"。
 */
const detailVisible = ref(false)
const detailLoading = ref(false)
const detailRow = ref<AlarmRow | null>(null)

/** 显示顺序照旧站的详情页 */
const DETAIL_FIELDS = [
  'SN',
  'ProductName',
  'ProductSN',
  'ProductLocation',
  'SensorDevice',
  'SensorDeviceSN',
  'Description',
  'DescriptionEn',
  'AlarmValue',
  'Lon',
  'Lat',
  'Location',
  'ConstSite',
  'ConstSiteZone',
  'Floor',
  'CustomerSN',
  'Level',
  'ImageUrl',
  'VideoUrl',
  'AlarmTime',
  'UpdateTime',
  'CreateTime',
  'FalsePositive',
  'ProcessStatus',
  'UserStatus',
  'Status',
  'Remark'
] as const

/** 这些不往详情里放（纯内部 Id / 已由别的字段表达） */
const HIDDEN_KEYS = ['Id', 'CategoryId', 'CustomerId', 'Worker', 'WorkerEn', 'WorkerNFC']

interface DetailField {
  key: string
  label: string
  /** 格式化后的展示文本 */
  value: string
  /** 原始值（图片/视频要用） */
  raw: string
}

function fieldLabel(key: string): string {
  // 'SN' 全大写，直接转小写首字母会变成 'sN'，要单独处理
  const localeKey = key === 'SN' ? 'sn' : `${key.charAt(0).toLowerCase()}${key.slice(1)}`
  const path = `alarm.fields.${localeKey}`
  const translated = t(path)
  return translated === path ? key : translated
}

function formatField(key: string, raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return ''
  switch (key) {
    case 'Level':
      return levelText(Number(raw))
    case 'FalsePositive':
      return Number(raw) === 1 ? t('common.yes') : t('common.no')
    case 'ProcessStatus':
      return t(`alarm.processStatus.${raw}`)
    case 'UserStatus':
      return t(`alarm.userStatus.${raw}`)
    case 'Status':
      return t(`alarm.recordStatus.${raw}`)
    case 'AlarmTime':
    case 'UpdateTime':
    case 'CreateTime':
      return formatServerDateTime(String(raw))
    case 'Lon':
    case 'Lat':
      return Number(raw).toFixed(6)
    default:
      return String(raw)
  }
}

const detailFields = computed<DetailField[]>(() => {
  const row = detailRow.value as Record<string, unknown> | null
  if (!row) return []
  return DETAIL_FIELDS.map((key) => ({
    key,
    label: fieldLabel(key),
    value: formatField(key, row[key]),
    raw: row[key] === null || row[key] === undefined ? '' : String(row[key])
  }))
})

/** 后端多返回的、我们没有预定义的字段 —— 原样列出来，绝不吞掉 */
const detailExtra = computed<DetailField[]>(() => {
  const row = detailRow.value as Record<string, unknown> | null
  if (!row) return []
  const known = new Set<string>([...DETAIL_FIELDS, ...HIDDEN_KEYS])
  return Object.keys(row)
    .filter((k) => !known.has(k))
    .map((k) => ({
      key: k,
      label: fieldLabel(k),
      value: formatField(k, row[k]),
      raw: String(row[k] ?? '')
    }))
})

async function openDetail(row: AlarmRow) {
  detailRow.value = row
  detailVisible.value = true
  detailLoading.value = true
  try {
    // 列表里的字段可能不全（比如后端在列表接口里裁掉了 Worker），所以单独查一次
    const full = await getAlarmDetail({ Id: row.Id })
    if (full) detailRow.value = full
  } catch {
    // 查详情失败就先用列表行展示，不打断
  } finally {
    detailLoading.value = false
  }
}

/**
 * 点行打开详情；复选框列和操作列不触发。
 * 参数类型照 el-table 的 `row-click` 签名（column 可能为 null、还带 event），
 * 这里只声明用得到的部分，避免和组件类型定义冲突。
 */
function handleRowClick(
  row: AlarmRow,
  column?: { type?: string; label?: string } | null
): void {
  if (!column) return
  if (column.type === 'selection') return
  if (column.label === t('common.operation')) return
  openDetail(row)
}

/* ---------------- 等级展示 ---------------- */
function levelText(level: number | null) {
  return level ? t(`alarm.levels.${level}`) : '--'
}

function levelClass(level: number | null) {
  if (level === 3) return 'is-high'
  if (level === 2) return 'is-mid'
  if (level === 1) return 'is-low'
  return 'is-none'
}

/* ---------------- 初始化 & 分类切换 ---------------- */
watch(
  () => props.categoryId,
  () => {
    selectedIds.value = []
    handleQuery()
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.alarm-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.filter-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 18px;
  padding: 12px 16px;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  flex: none;
  font-size: 12px;
  color: $text-regular;
  white-space: nowrap;
}

.filter-control {
  width: 160px;
}

.filter-control--date {
  width: 280px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px;
}

.table-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.selected-text {
  font-size: 12px;
  color: $text-secondary;
}

.denied-hint {
  font-size: 12px;
  color: $text-secondary;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: help;
}

.alarm-table {
  flex: 1;
  min-height: 0;
}

.table-foot {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
}

.total-text {
  font-size: 12px;
  color: $text-secondary;
}

.nowrap {
  white-space: nowrap;
}

.level-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  /* 等级标签不许折行 —— 折成"3級（高風 / 險）"太丑 */
  white-space: nowrap;
  border-radius: 3px;
  border: 1px solid transparent;

  &.is-low {
    color: #10a394;
    background: #e9fbf6;
    border-color: #b6ebdd;
  }

  &.is-mid {
    color: #f08c14;
    background: #fff7e8;
    border-color: #ffe0a3;
  }

  &.is-high {
    color: #ef4444;
    background: #fef2f2;
    border-color: #fca5a5;
  }

  &.is-none {
    color: $text-secondary;
    background: #f4f5f7;
    border-color: #e4e7ed;
  }
}

.media-video,
.media-image {
  width: 100%;
  max-height: 60vh;
}

.w-full {
  width: 100%;
}

/* ---------------- 详情抽屉 ---------------- */
.detail-wrap {
  min-height: 200px;
}

.detail-thumb {
  width: 132px;
  height: 92px;
  border-radius: 4px;
  background: #f4f5f7;
  cursor: zoom-in;
}

.detail-image {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-image-tip {
  font-size: 11px;
  color: #a0a6b0;
}

.detail-empty {
  color: #c0c4cc;
}

.detail-extra-title {
  margin: 18px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: $text-main;
}

.mono {
  font-family: Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}

/* 整行可点：给个手型 + 编号做成链接样式，让人知道能点开 */
:deep(.alarm-row) {
  cursor: pointer;
}

.sn-link {
  color: $primary;

  &:hover {
    text-decoration: underline;
  }
}
</style>
