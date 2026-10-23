<template>
  <div class="page permitted-work">
    <!-- ---------------- 查询条件 ---------------- -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">{{ t('permitWork.filters.permitArea') }}</span>
        <el-select
          v-model="query.permitArea"
          :placeholder="t('common.pleaseSelect')"
          clearable
          class="filter-control"
        >
          <el-option v-for="a in options.permitArea" :key="a" :label="a" :value="a" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('permitWork.filters.permitType') }}</span>
        <el-select
          v-model="query.permitType"
          :placeholder="t('common.pleaseSelect')"
          clearable
          class="filter-control"
        >
          <!-- 注意：循环变量不能叫 t，会和 i18n 的 t() 冲突 -->
          <el-option v-for="pt in options.permitType" :key="pt" :label="pt" :value="pt" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('permitWork.filters.company') }}</span>
        <el-select
          v-model="query.company"
          :placeholder="t('common.pleaseSelect')"
          clearable
          class="filter-control"
        >
          <el-option v-for="c in options.company" :key="c" :label="c" :value="c" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">{{ t('permitWork.filters.dateRange') }}</span>
        <el-date-picker
          v-model="query.dateRange"
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
        <span class="card-title">{{ t('permitWork.title') }}</span>
        <span class="head-hint">{{ t('permitWork.mockNote') }}</span>
      </div>

      <el-table v-loading="loading" :data="rows" stripe height="100%" class="permit-table">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="permitId" :label="t('permitWork.columns.permitId')" min-width="90" align="center" />
        <el-table-column
          prop="workPermitNo"
          :label="t('permitWork.columns.workPermitNo')"
          min-width="140"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="permitType"
          :label="t('permitWork.columns.permitType')"
          min-width="120"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column :label="t('permitWork.columns.status')" min-width="100" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="statusClass(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="modelContent"
          :label="t('permitWork.columns.modelContent')"
          min-width="120"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          prop="applicant"
          :label="t('permitWork.columns.applicant')"
          min-width="150"
          align="center"
          show-overflow-tooltip
        />
        <el-table-column
          :label="t('permitWork.columns.applyDate')"
          min-width="138"
          align="center"
        >
          <template #default="{ row }">
            <el-tooltip :content="row.applyDate" placement="top">
              <span>{{ shortTime(row.applyDate) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.operation')" width="90" align="center" fixed="right">
          <template #default>
            <el-button link type="primary" size="small">{{ t('common.detail') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-foot">
        <span class="total-text">{{ t('common.total', { total }) }}</span>
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="prev, pager, next, sizes, jumper"
          background
          @current-change="fetchData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Refresh, Search } from '@element-plus/icons-vue'
import { getPermitWorkOptions, getPermitWorkPageApi } from '@/api/permitWork'
import type { PermitWorkQuery, PermitWorkRow } from '@/mock'

defineOptions({ name: 'PermittedToWork' })

const { t } = useI18n()

const options = getPermitWorkOptions()

const loading = ref(false)
const rows = ref<PermitWorkRow[]>([])
const total = ref(0)

const query = reactive<PermitWorkQuery>({
  permitArea: '',
  permitType: '',
  company: '',
  dateRange: ['2026-08-28', '2026-09-12'],
  pageNum: 1,
  pageSize: 20
})

/** 列表里省掉秒，完整时间走 tooltip（宽度不够时先省次要信息，别让单元格折行） */
function shortTime(v?: string) {
  if (!v) return '--'
  return v.length > 16 ? v.slice(0, 16) : v
}

function statusClass(status: string) {
  switch (status) {
    case '申请待批':
      return 'is-orange'
    case '许可待批':
      return 'is-blue'
    case '工作结束':
      return 'is-green'
    default:
      return 'is-gray'
  }
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getPermitWorkPageApi({
      ...query,
      dateRange: query.dateRange?.length ? query.dateRange : undefined
    })
    rows.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || t('common.loadFailed'))
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  query.pageNum = 1
  fetchData()
}

function handleReset() {
  query.permitArea = ''
  query.permitType = ''
  query.company = ''
  query.dateRange = ['2026-08-28', '2026-09-12']
  query.pageNum = 1
  query.pageSize = 20
  fetchData()
}

function handleSizeChange() {
  query.pageNum = 1
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.permitted-work {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* ---------------- 查询区 ---------------- */
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
  /* 定宽：四个标签字数不同（4~6 字），不定宽会导致右边控件起点参差不齐 */
  min-width: 78px;
  font-size: 12px;
  color: $text-regular;
  white-space: nowrap;
}

.filter-control {
  width: 170px;
}

.filter-control--date {
  width: 300px;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* ---------------- 表格区 ---------------- */
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
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.head-hint {
  font-size: 12px;
  color: $text-secondary;
}

.permit-table {
  flex: 1;
  min-height: 0;
}

.status-tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  border-radius: 3px;
  border: 1px solid transparent;

  &.is-orange {
    color: #f08c14;
    background: #fff7e8;
    border-color: #ffe0a3;
  }

  &.is-blue {
    color: $primary;
    background: #eef5ff;
    border-color: #c9dfff;
  }

  &.is-green {
    color: #10a394;
    background: #e9fbf6;
    border-color: #b6ebdd;
  }

  &.is-gray {
    color: $text-secondary;
    background: #f4f5f7;
    border-color: #e4e7ed;
  }
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
</style>
