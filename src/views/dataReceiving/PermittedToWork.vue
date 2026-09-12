<template>
  <div class="page permitted-work">
    <!-- ---------------- 查询条件 ---------------- -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">许可作业区域</span>
        <el-select v-model="query.permitArea" placeholder="请选择" clearable class="filter-control">
          <el-option v-for="a in options.permitArea" :key="a" :label="a" :value="a" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">许可类型</span>
        <el-select v-model="query.permitType" placeholder="请选择" clearable class="filter-control">
          <el-option v-for="t in options.permitType" :key="t" :label="t" :value="t" />
        </el-select>
      </div>

      <div class="filter-item">
        <span class="filter-label">许可批准申请</span>
        <el-select v-model="query.company" placeholder="请选择" clearable class="filter-control">
          <el-option v-for="c in options.company" :key="c" :label="c" :value="c" />
        </el-select>
      </div>

      <div class="filter-item">
        <el-date-picker
          v-model="query.dateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="日期"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          unlink-panels
          class="filter-control filter-control--date"
        />
      </div>

      <div class="filter-actions">
        <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        <el-button type="warning" :icon="Download" @click="handleExport">导出</el-button>
      </div>
    </div>

    <!-- ---------------- 表格 ---------------- -->
    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">许可作业列表</span>
      </div>

      <el-table v-loading="loading" :data="rows" stripe height="100%" class="permit-table">
        <el-table-column type="index" label="序号" width="120" align="center" />
        <el-table-column prop="permitId" label="许可ID" min-width="140" align="center" />
        <el-table-column prop="workPermitNo" label="工作票编号" min-width="150" align="center" />
        <el-table-column prop="permitType" label="许可类型" min-width="130" align="center" />
        <el-table-column label="许可状态" min-width="110" align="center">
          <template #default="{ row }">
            <span class="status-tag" :class="statusClass(row.status)">{{ row.status }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="modelContent" label="模型内容" min-width="130" align="center" />
        <el-table-column prop="applicant" label="许可申请人" min-width="140" align="center" />
        <el-table-column prop="applyDate" label="申请日期" min-width="170" align="center" />
        <el-table-column label="操作" width="110" align="center" fixed="right">
          <template #default>
            <el-button link type="primary" size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-foot">
        <span class="total-text">共 {{ total }} 条记录</span>
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
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { exportPermitWorkApi, getPermitWorkOptions, getPermitWorkPageApi } from '@/api/permitWork'
import type { PermitWorkQuery, PermitWorkRow } from '@/mock'

defineOptions({ name: 'PermittedToWork' })

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
    ElMessage.error((e as Error).message || '查询失败')
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

async function handleExport() {
  await exportPermitWorkApi({ ...query })
  ElMessage.success('导出任务已提交（演示占位，等接口就绪后接真实导出）')
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
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
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
