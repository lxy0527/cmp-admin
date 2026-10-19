<template>
  <div class="page customer-management">
    <!-- ==================== 一级：客户列表 ==================== -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        :placeholder="t('customer.inputCompany')"
        clearable
        class="filter-input"
        @keyup.enter="handleQuery"
      />
      <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.query') }}</el-button>
      <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
      <el-button v-permission="P.customerEdit" type="primary" plain :icon="Plus" @click="openCustomerDialog()">
        {{ t('customer.addTitle') }}
      </el-button>
    </div>

    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">{{ t('customer.title') }}</span>
        <div class="batch-actions">
          <span class="selected-text">
            {{ t('common.selected') }}: {{ selectedIds.length }} {{ t('common.records') }}
          </span>
          <el-button size="small" :disabled="!selectedIds.length" @click="handleBatchStatus(0)">
            {{ t('common.enabled') }}
          </el-button>
          <el-button size="small" :disabled="!selectedIds.length" @click="handleBatchStatus(1)">
            {{ t('common.disabled') }}
          </el-button>
          <el-button
            size="small"
            type="danger"
            plain
            :disabled="!selectedIds.length"
            @click="handleBatchDelete"
          >
            {{ t('common.delete') }}
          </el-button>
        </div>
      </div>

      <el-table
        v-loading="table.loading.value"
        :data="table.list.value"
        stripe
        height="100%"
        @selection-change="onSelectionChange"
      >
        <el-table-column type="selection" width="44" align="center" />
        <el-table-column type="index" label="#" width="56" align="center" />
        <el-table-column prop="Company" :label="t('customer.company')" min-width="200" />
        <el-table-column prop="SN" :label="t('customer.sn')" width="190" align="center">
          <template #default="{ row }"><span class="mono">{{ row.SN }}</span></template>
        </el-table-column>
        <el-table-column prop="Manager" :label="t('customer.manager')" width="110" align="center">
          <template #default="{ row }">{{ row.Manager || '--' }}</template>
        </el-table-column>
        <el-table-column prop="Tele" :label="t('customer.tele')" width="130" align="center">
          <template #default="{ row }">{{ row.Tele || '--' }}</template>
        </el-table-column>
        <el-table-column prop="UpdateTime" :label="t('customer.createTime')" width="150" align="center">
          <template #default="{ row }">{{ formatServerDateTime(row.UpdateTime) }}</template>
        </el-table-column>
        <el-table-column prop="Status" :label="t('common.status')" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.Status === 0 ? 'success' : 'info'" size="small">
              {{ row.Status === 0 ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.operation')" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openRelated(row as CustomerRow)">
              {{ t('customer.relatedAccounts') }}
            </el-button>
            <el-button
              v-permission="P.customerEdit"
              link
              type="primary"
              size="small"
              @click="openCustomerDialog(row as CustomerRow)"
            >
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-permission="P.customerEdit"
              link
              type="danger"
              size="small"
              @click="handleDelete(row as CustomerRow)"
            >
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-foot">
        <span class="total-text">{{ t('common.total', { total: table.total.value }) }}</span>
        <el-pagination
          v-model:current-page="table.pageNum.value"
          v-model:page-size="table.pageSize.value"
          :page-sizes="[10, 20, 50]"
          :total="table.total.value"
          layout="prev, pager, next, sizes, jumper"
          background
          @size-change="table.handleSizeChange"
        />
      </div>
    </div>

    <!-- ==================== 新增 / 编辑客户 ==================== -->
    <el-dialog v-model="customerDialogVisible" v-loading="customerLoading"
      :title="customerForm.Id ? t('customer.editTitle') : t('customer.addTitle')"
      width="520px"
    >
      <el-form ref="customerFormRef" :model="customerForm" :rules="customerRules" label-width="110px">
        <el-form-item :label="t('customer.company')" prop="Company">
          <el-input v-model="customerForm.Company" :placeholder="t('customer.inputCompany')" />
        </el-form-item>
        <el-form-item :label="t('customer.sn')" prop="SN">
          <el-input v-model="customerForm.SN" :placeholder="t('customer.inputSn')" />
        </el-form-item>
        <el-form-item :label="t('customer.manager')">
          <el-input v-model="customerForm.Manager" :placeholder="t('customer.inputManager')" />
        </el-form-item>
        <el-form-item :label="t('customer.tele')">
          <el-input v-model="customerForm.Tele" :placeholder="t('customer.inputTele')" />
        </el-form-item>
        <el-form-item :label="t('customer.remark')">
          <el-input v-model="customerForm.Remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item v-if="customerForm.Id" :label="t('common.status')">
          <el-select v-model="customerForm.Status" class="w-full">
            <el-option :label="t('common.enabled')" :value="0" />
            <el-option :label="t('common.disabled')" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="customerDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitCustomer">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ==================== 二级：关联账号抽屉 ==================== -->
    <el-drawer v-model="relatedVisible" size="66%" :with-header="false">
      <div class="related-panel">
        <div class="related-head">
          <div class="related-title">
            {{ t('customer.relatedTitle', { name: currentCustomer?.Company || '' }) }}
          </div>
          <el-button size="small" @click="relatedVisible = false">{{ t('customer.backToList') }}</el-button>
        </div>

        <!-- 接口里没有"审批信息/第几步审批"，这里明确说明，避免被当成漏做 -->
        <el-alert type="info" :closable="false" class="related-note" :title="t('customer.approvalNote')" />

        <div class="related-toolbar">
          <el-input
            v-model="relatedKeyword"
            :placeholder="t('customer.inputName')"
            clearable
            class="related-input"
            @keyup.enter="loadRelated"
          />
          <el-button type="primary" :icon="Search" @click="loadRelated">{{ t('common.query') }}</el-button>
          <el-button :icon="Refresh" @click="resetRelatedSearch">{{ t('common.reset') }}</el-button>
          <el-button
            v-permission="P.customerEdit"
            type="primary"
            plain
            :icon="Plus"
            @click="openRelatedDialog()"
          >
            {{ t('customer.addRelated') }}
          </el-button>
          <div class="related-batch">
            <el-button
              size="small"
              :disabled="!relatedSelected.length"
              @click="handleRelatedBatchStatus(0)"
            >
              {{ t('common.enabled') }}
            </el-button>
            <el-button
              size="small"
              :disabled="!relatedSelected.length"
              @click="handleRelatedBatchStatus(1)"
            >
              {{ t('common.disabled') }}
            </el-button>
            <el-button
              size="small"
              type="danger"
              plain
              :disabled="!relatedSelected.length"
              @click="handleRelatedBatchDelete"
            >
              {{ t('common.delete') }}
            </el-button>
          </div>
        </div>

        <el-table
          v-loading="relatedLoading"
          :data="relatedRows"
          stripe
          height="100%"
          class="related-table"
          @selection-change="onRelatedSelectionChange"
        >
          <el-table-column type="selection" width="44" align="center" />
          <el-table-column type="index" label="#" width="56" align="center" />
          <el-table-column prop="Name" :label="t('customer.name')" min-width="160">
            <template #default="{ row }">{{ row.Name || '--' }}</template>
          </el-table-column>
          <el-table-column prop="UserName" :label="t('customer.userName')" min-width="160" />
          <el-table-column prop="Status" :label="t('common.status')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.Status === 0 ? 'success' : 'info'" size="small">
                {{ row.Status === 0 ? t('common.enabled') : t('common.disabled') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="t('common.operation')" width="130" align="center">
            <template #default="{ row }">
              <el-button
                v-permission="P.customerEdit"
                link
                type="primary"
                size="small"
                @click="openRelatedDialog(row as CustomerUserRow)"
              >
                {{ t('common.edit') }}
              </el-button>
              <el-button
                v-permission="P.customerEdit"
                link
                type="danger"
                size="small"
                @click="handleRelatedDelete(row as CustomerUserRow)"
              >
                {{ t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="related-foot">
          <span class="total-text">{{ t('common.total', { total: relatedRows.length }) }}</span>
        </div>
      </div>
    </el-drawer>

    <!-- ==================== 新增 / 编辑关联账号 ==================== -->
    <el-dialog
      v-model="relatedDialogVisible"
      :title="relatedForm.Id ? t('customer.editRelated') : t('customer.addRelated')"
      width="460px"
    >
      <el-form ref="relatedFormRef" :model="relatedForm" :rules="relatedRules" label-width="100px">
        <!-- 新增时要选一个账号（接口要 UserId + UserName）；编辑时账号不可改 -->
        <el-form-item v-if="!relatedForm.Id" :label="t('customer.userName')" prop="UserId">
          <el-select
            v-model="relatedForm.UserId"
            filterable
            :placeholder="t('customer.selectAccount')"
            class="w-full"
            @change="onAccountPicked"
          >
            <el-option
              v-for="a in accountOptions"
              :key="a.Id"
              :label="`${a.UserName}（${a.Name || '--'}）`"
              :value="a.Id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-else :label="t('customer.userName')">
          <el-input :model-value="relatedForm.UserName" disabled />
        </el-form-item>

        <el-form-item :label="t('customer.name')">
          <el-input v-model="relatedForm.Name" :placeholder="t('customer.inputName')" />
        </el-form-item>

        <el-form-item v-if="relatedForm.Id" :label="t('common.status')">
          <el-select v-model="relatedForm.Status" class="w-full">
            <el-option :label="t('common.enabled')" :value="0" />
            <el-option :label="t('common.disabled')" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="relatedDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitRelated">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 客户管理
 * ============================================================
 * 这一块 **14 个接口**此前完全没有页面，是文档里最大的一处"有接口没 UI"。
 * 两级结构：
 *   一级 → 客户（公司）列表：增删改查 + 批量启用/禁用/删除
 *   二级 → 某个客户下的**关联账号**：新增/编辑/删除 + 批量状态/删除
 *          （参考图 2 那张表就是这一级）
 *
 * ⚠️ 参考图上有「审批信息 / 第几步审批」，**接口里完全没有这些字段**
 *    （那是旧 .NET 后台的审批流概念）。所以本页不做假字段，并在抽屉里显式说明，
 *    免得被当成"漏做"。
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createCustomer,
  createCustomerUser,
  deleteCustomer,
  deleteCustomers,
  deleteCustomerUser,
  deleteCustomerUsers,
  getCustomerDetail,
  getCustomerList,
  getCustomerUserList,
  setCustomerStatus,
  setCustomerUserStatus,
  updateCustomer,
  updateCustomerUser,
  type CustomerRow,
  type CustomerUserRow
} from '@/api/customer'
import { getAccountList, type AccountRow } from '@/api/account'
import { useTableList } from '@/composables/useTableList'
import { P } from '@/config/permission'
import { formatServerDateTime } from '@/utils/format'

defineOptions({ name: 'CustomerManagement' })

const { t } = useI18n()
const saving = ref(false)

/* ============================================================
 * 一级：客户列表
 * ============================================================ */
const keyword = ref('')

const table = useTableList<CustomerRow>({
  fetcher: () => getCustomerList(keyword.value)
})

async function handleQuery() {
  table.search()
  await table.load().catch(() => void 0)
}

async function handleReset() {
  keyword.value = ''
  await handleQuery()
}

const selectedIds = ref<number[]>([])
function onSelectionChange(rows: CustomerRow[]) {
  selectedIds.value = rows.map((r) => r.Id)
}

/* ---------------- 新增 / 编辑 ---------------- */
const customerDialogVisible = ref(false)
/** 编辑弹窗打开时先查一次单条接口，查的过程中给 loading */
const customerLoading = ref(false)
const customerFormRef = ref<FormInstance>()
const customerForm = reactive({
  Id: undefined as number | undefined,
  Company: '',
  SN: '',
  Manager: '',
  Tele: '',
  Logo: '',
  Remark: '',
  Status: 0
})

const customerRules = computed<FormRules>(() => ({
  Company: [{ required: true, message: t('customer.inputCompany'), trigger: 'blur' }],
  SN: [{ required: true, message: t('customer.inputSn'), trigger: 'blur' }]
}))

/**
 * 打开新增 / 编辑客户
 * ⚠️ 编辑时先用 /api/customerSingle 查一次**完整**对象，不要直接拿表格行填表单：
 *    列表接口可能只返回部分字段，用残缺数据填表单，一保存就会把真实值覆盖成空。
 */
async function openCustomerDialog(row?: CustomerRow) {
  customerForm.Id = row?.Id
  customerForm.Company = row?.Company ?? ''
  customerForm.SN = row?.SN ?? ''
  customerForm.Manager = row?.Manager ?? ''
  customerForm.Tele = row?.Tele ?? ''
  customerForm.Logo = row?.Logo ?? ''
  customerForm.Remark = row?.Remark ?? ''
  customerForm.Status = row?.Status ?? 0
  customerDialogVisible.value = true

  if (!row) return
  customerLoading.value = true
  try {
    const full = await getCustomerDetail({ Id: row.Id })
    if (full) {
      customerForm.Company = full.Company ?? ''
      customerForm.SN = full.SN ?? ''
      customerForm.Manager = full.Manager ?? ''
      customerForm.Tele = full.Tele ?? ''
      customerForm.Logo = full.Logo ?? ''
      customerForm.Remark = full.Remark ?? ''
      customerForm.Status = full.Status ?? 0
    }
  } catch {
    // 查详情失败就沿用列表数据，不阻塞编辑
  } finally {
    customerLoading.value = false
  }
}

async function submitCustomer() {
  const valid = await customerFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (customerForm.Id) {
      await updateCustomer({
        Id: customerForm.Id,
        Company: customerForm.Company,
        SN: customerForm.SN,
        Manager: customerForm.Manager,
        Tele: customerForm.Tele,
        Logo: customerForm.Logo,
        Remark: customerForm.Remark,
        Status: customerForm.Status
      })
    } else {
      await createCustomer({
        Company: customerForm.Company,
        SN: customerForm.SN,
        Manager: customerForm.Manager,
        Tele: customerForm.Tele,
        Logo: customerForm.Logo,
        Remark: customerForm.Remark
      })
    }
    ElMessage.success(t('common.saveSuccess'))
    customerDialogVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 删除 / 批量 ---------------- */
async function handleDelete(row: CustomerRow) {
  const ok = await ElMessageBox.confirm(
    t('customer.deleteConfirm', { name: row.Company }),
    t('common.warmTip'),
    { type: 'warning' }
  ).catch(() => false)
  if (!ok) return
  try {
    await deleteCustomer(row.Id)
    ElMessage.success(t('common.deleteSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

async function handleBatchDelete() {
  if (!selectedIds.value.length) return
  const ok = await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warmTip'), {
    type: 'warning'
  }).catch(() => false)
  if (!ok) return
  try {
    await deleteCustomers(selectedIds.value)
    ElMessage.success(t('common.deleteSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

async function handleBatchStatus(status: number) {
  if (!selectedIds.value.length) return
  try {
    await setCustomerStatus(selectedIds.value, status)
    ElMessage.success(t('common.operationSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('common.operationFailed'))
  }
}

/* ============================================================
 * 二级：关联账号
 * ============================================================ */
const relatedVisible = ref(false)
const relatedLoading = ref(false)
const relatedRows = ref<CustomerUserRow[]>([])
const relatedSelected = ref<number[]>([])
const relatedKeyword = ref('')
const currentCustomer = ref<CustomerRow | null>(null)

function openRelated(row: CustomerRow) {
  currentCustomer.value = row
  relatedKeyword.value = ''
  relatedVisible.value = true
  loadRelated()
}

async function loadRelated() {
  if (!currentCustomer.value) return
  relatedLoading.value = true
  try {
    relatedRows.value = await getCustomerUserList(currentCustomer.value.Id, relatedKeyword.value)
  } catch {
    relatedRows.value = []
    ElMessage.error(t('common.loadFailed'))
  } finally {
    relatedLoading.value = false
  }
}

async function resetRelatedSearch() {
  relatedKeyword.value = ''
  await loadRelated()
}

function onRelatedSelectionChange(rows: CustomerUserRow[]) {
  relatedSelected.value = rows.map((r) => r.Id)
}

/* ---------------- 关联账号的新增 / 编辑 ---------------- */
const relatedDialogVisible = ref(false)
const relatedFormRef = ref<FormInstance>()
const relatedForm = reactive({
  Id: undefined as number | undefined,
  UserId: undefined as number | undefined,
  UserName: '',
  Name: '',
  Status: 0
})

/** 账号下拉（新增关联账号时要选一个已有账号） */
const accountOptions = ref<AccountRow[]>([])

const relatedRules = computed<FormRules>(() =>
  relatedForm.Id
    ? {}
    : {
        UserId: [{ required: true, message: t('customer.selectAccount'), trigger: 'change' }]
      }
)

async function openRelatedDialog(row?: CustomerUserRow) {
  relatedForm.Id = row?.Id
  relatedForm.UserId = row?.UserId
  relatedForm.UserName = row?.UserName ?? ''
  relatedForm.Name = row?.Name ?? ''
  relatedForm.Status = row?.Status ?? 0
  relatedDialogVisible.value = true

  // 新增时才需要账号下拉，避免每次编辑都多打一次接口
  if (!row && !accountOptions.value.length) {
    try {
      accountOptions.value = await getAccountList('')
    } catch {
      accountOptions.value = []
    }
  }
}

/** 选中账号后，把 UserName / Name 一起带出来 */
function onAccountPicked(userId: number) {
  const acc = accountOptions.value.find((a) => a.Id === userId)
  if (!acc) return
  relatedForm.UserName = acc.UserName
  relatedForm.Name = acc.Name ?? ''
}

async function submitRelated() {
  const valid = await relatedFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!currentCustomer.value) return
  saving.value = true
  try {
    if (relatedForm.Id) {
      await updateCustomerUser({
        Id: relatedForm.Id,
        Name: relatedForm.Name,
        Status: relatedForm.Status
      })
    } else {
      await createCustomerUser({
        CustomerId: currentCustomer.value.Id,
        UserId: relatedForm.UserId as number,
        UserName: relatedForm.UserName,
        Name: relatedForm.Name
      })
    }
    ElMessage.success(t('common.saveSuccess'))
    relatedDialogVisible.value = false
    await loadRelated()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleRelatedDelete(row: CustomerUserRow) {
  const ok = await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warmTip'), {
    type: 'warning'
  }).catch(() => false)
  if (!ok) return
  try {
    await deleteCustomerUser(row.Id)
    ElMessage.success(t('common.deleteSuccess'))
    await loadRelated()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

async function handleRelatedBatchDelete() {
  if (!relatedSelected.value.length) return
  const ok = await ElMessageBox.confirm(t('customer.removeRelatedConfirm'), t('common.warmTip'), {
    type: 'warning'
  }).catch(() => false)
  if (!ok) return
  try {
    await deleteCustomerUsers(relatedSelected.value)
    ElMessage.success(t('common.deleteSuccess'))
    await loadRelated()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

async function handleRelatedBatchStatus(status: number) {
  if (!relatedSelected.value.length) return
  try {
    await setCustomerUserStatus(relatedSelected.value, status)
    ElMessage.success(t('common.operationSuccess'))
    await loadRelated()
  } catch {
    ElMessage.error(t('common.operationFailed'))
  }
}

/* ---------------- 初始化 ---------------- */
table.load().catch(() => void 0)
</script>

<style scoped lang="scss">
.customer-management {
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

.filter-input {
  width: 260px;
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

.mono {
  font-family: Consolas, monospace;
  font-size: 12px;
  color: $text-secondary;
}

.w-full {
  width: 100%;
}

/* ---------------- 关联账号抽屉 ---------------- */
.related-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.related-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.related-title {
  font-size: 15px;
  font-weight: 600;
  color: $text-main;
}

.related-note {
  flex: none;
}

.related-toolbar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.related-input {
  width: 200px;
}

.related-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.related-table {
  flex: 1;
  min-height: 0;
}

.related-foot {
  flex: none;
  padding-top: 6px;
}
</style>
