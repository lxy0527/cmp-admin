<template>
  <div class="page account-management">
    <!-- ---------------- 查询 + 新增 ---------------- -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        :placeholder="t('account.inputAccount')"
        clearable
        class="filter-input"
        @keyup.enter="handleQuery"
      />
      <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.query') }}</el-button>
      <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
      <el-button v-permission="P.userEdit" type="primary" plain :icon="Plus" @click="openCreate">
        {{ t('common.add') }}
      </el-button>
    </div>

    <!-- ---------------- 列表 ---------------- -->
    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">{{ t('menu.cmpSettingItems.accountManagement') }}</span>
      </div>

      <el-table v-loading="table.loading.value" :data="table.list.value" stripe height="100%">
        <el-table-column prop="Id" label="ID" width="80" align="center" />
        <el-table-column prop="UserName" :label="t('account.account')" min-width="140" />
        <el-table-column prop="Name" :label="t('account.name')" min-width="120">
          <template #default="{ row }">{{ row.Name || '--' }}</template>
        </el-table-column>
        <el-table-column prop="Email" label="Email" min-width="190">
          <template #default="{ row }">{{ row.Email || '--' }}</template>
        </el-table-column>
        <el-table-column prop="Tele" :label="t('account.mobile')" min-width="130">
          <template #default="{ row }">{{ row.Tele || '--' }}</template>
        </el-table-column>
        <el-table-column prop="Role" :label="t('account.accountType')" width="140" align="center">
          <template #default="{ row }">
            {{ row.Role === 1 ? t('account.superAdmin') : t('account.normalAccount') }}
          </template>
        </el-table-column>
        <el-table-column prop="Permission" :label="t('account.role')" width="130" align="center">
          <template #default="{ row }">
            {{ row.Permission === 1 ? t('account.organization') : t('common.empty') }}
          </template>
        </el-table-column>
        <el-table-column prop="Status" :label="t('common.status')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.Status === 0 ? 'success' : 'info'" size="small">
              {{ row.Status === 0 ? t('common.enabled') : t('common.disabled') }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.operation')" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="P.userEdit" link type="primary" size="small" @click="openEdit(row as AccountRow)">
              {{ t('common.edit') }}
            </el-button>
            <el-button
              v-permission="P.userEdit"
              link
              :type="row.Status === 0 ? 'danger' : 'success'"
              size="small"
              @click="toggleStatus(row as AccountRow)"
            >
              {{ row.Status === 0 ? t('common.disabled') : t('common.enabled') }}
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

    <!-- ---------------- 新增帐号 ---------------- -->
    <el-dialog v-model="createVisible" :title="t('account.addTitle')" width="440px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item :label="t('account.account')" prop="UserName">
          <el-input v-model="createForm.UserName" :placeholder="t('account.inputAccount')" />
        </el-form-item>
        <el-form-item label="Email" prop="Email">
          <el-input v-model="createForm.Email" placeholder="name@example.com" />
        </el-form-item>
        <el-form-item :label="t('account.password')" prop="Password">
          <el-input v-model="createForm.Password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="t('account.mobile')">
          <el-input v-model="createForm.Tele" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ---------------- 编辑帐号 ---------------- -->
    <el-dialog v-model="editVisible" v-loading="editLoading" :title="t('account.editTitle')" width="480px">
      <el-alert type="info" :closable="false" class="edit-tip" :title="EDIT_TIP" />
      <el-form :model="editForm" label-width="110px">
        <el-divider content-position="left">{{ t('account.name') }}</el-divider>
        <el-form-item :label="t('account.name')">
          <el-input v-model="editForm.Name" />
        </el-form-item>
        <el-form-item :label="t('account.mobile')">
          <el-input v-model="editForm.Tele" />
        </el-form-item>
        <el-form-item label="SN">
          <el-input v-model="editForm.SN" />
        </el-form-item>
        <el-form-item label="Title">
          <el-input v-model="editForm.Title" />
        </el-form-item>

        <el-divider content-position="left">{{ t('account.role') }}</el-divider>
        <el-form-item :label="t('account.role')">
          <el-select v-model="editForm.Permission" class="w-full">
            <el-option :label="t('account.normalAccount')" :value="0" />
            <el-option :label="t('account.organization')" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.status')">
          <el-select v-model="editForm.Status" class="w-full">
            <el-option :label="t('common.enabled')" :value="0" />
            <el-option :label="t('common.disabled')" :value="1" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 帳號管理
 * ============================================================
 * ⚠️ 后端接口能力有限，页面刻意**只做接口能做到的事**：
 *   - 没有"删除账号"接口 → 只有"禁用"
 *   - 改资料（Name/Tele/SN/Title）和改权限状态（Permission/Status）是**两个接口**，
 *     所以编辑弹窗分两块，提交时也是两次请求
 *   - UserName / Email / 密码 注册后改不了（没有接口），弹窗里明确提示
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createAccount,
  getAccountDetail,
  getAccountList,
  getAccountPage,
  updateAccountProfile,
  updateAccountSetting,
  type AccountRow
} from '@/api/account'
import { useTableList } from '@/composables/useTableList'
import { P } from '@/config/permission'

defineOptions({ name: 'AccountManagement' })

const { t } = useI18n()

const keyword = ref('')

// 服务端分页（后端 2026-10-20 新增）：翻页只取当前页，搜索走接口
const table = useTableList<AccountRow>({
  mode: 'server',
  fetchPage: ({ page, pageSize }) =>
    getAccountPage({ page, pageSize, SearchTitle: keyword.value })
})

/** 搜索：重新请求 + 回第 1 页 */
async function handleQuery() {
  table.search()
  await table.load().catch(() => void 0)
}

async function handleReset() {
  keyword.value = ''
  await handleQuery()
}

/* ---------------- 新增 ---------------- */
const createVisible = ref(false)
const saving = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({ UserName: '', Email: '', Password: '', Tele: '' })

const createRules = computed<FormRules>(() => ({
  UserName: [{ required: true, message: t('account.inputAccount'), trigger: 'blur' }],
  Email: [
    { required: true, message: t('common.pleaseInput'), trigger: 'blur' },
    { type: 'email', message: 'Email', trigger: 'blur' }
  ],
  Password: [{ required: true, message: t('account.inputPassword'), trigger: 'blur' }]
}))

function openCreate() {
  createForm.UserName = ''
  createForm.Email = ''
  createForm.Password = ''
  createForm.Tele = ''
  createVisible.value = true
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await createAccount({ ...createForm })
    ElMessage.success(t('common.saveSuccess'))
    createVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 编辑 ---------------- */
const editVisible = ref(false)
/** 编辑弹窗打开时先查一次单条接口，查的过程中给 loading */
const editLoading = ref(false)
const editForm = reactive({
  Id: 0,
  Name: '',
  Tele: '',
  SN: '',
  Title: '',
  Permission: 0,
  Status: 0
})

/** 接口限制写清楚，免得用户以为改不了是 bug */
const EDIT_TIP = computed(() => t('account.editHint'))

/**
 * 打开编辑
 * ⚠️ 先用 /api/userSingle 查一次**完整**对象，不要直接拿表格行填表单：
 *    列表接口可能只返回部分字段，用残缺数据填表单，一保存就会把真实值覆盖成空。
 *    查失败才退回用行数据（至少能改可见字段）。
 */
async function openEdit(row: AccountRow) {
  editForm.Id = row.Id
  editForm.Name = row.Name ?? ''
  editForm.Tele = row.Tele ?? ''
  editForm.SN = row.SN ?? ''
  editForm.Title = row.Title ?? ''
  editForm.Permission = row.Permission ?? 0
  editForm.Status = row.Status ?? 0
  editVisible.value = true

  editLoading.value = true
  try {
    const full = await getAccountDetail({ Id: row.Id })
    if (full) {
      editForm.Name = full.Name ?? ''
      editForm.Tele = full.Tele ?? ''
      editForm.SN = full.SN ?? ''
      editForm.Title = full.Title ?? ''
      editForm.Permission = full.Permission ?? 0
      editForm.Status = full.Status ?? 0
    }
  } catch {
    // 查详情失败就沿用列表数据，不阻塞编辑
  } finally {
    editLoading.value = false
  }
}

async function submitEdit() {
  saving.value = true
  try {
    // 两个接口分开调：资料一个、权限状态一个
    await Promise.all([
      updateAccountProfile({
        Id: editForm.Id,
        Name: editForm.Name,
        Tele: editForm.Tele,
        SN: editForm.SN,
        Title: editForm.Title
      }),
      updateAccountSetting({
        Id: editForm.Id,
        Permission: editForm.Permission,
        Status: editForm.Status
      })
    ])
    ElMessage.success(t('common.saveSuccess'))
    editVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 启用 / 禁用 ---------------- */
async function toggleStatus(row: AccountRow) {
  const next = row.Status === 0 ? 1 : 0
  const ok = await ElMessageBox.confirm(
    next === 1 ? t('account.disableConfirm') : t('account.enableConfirm'),
    t('common.warmTip'),
    { type: 'warning' }
  ).catch(() => false)
  if (!ok) return

  try {
    await updateAccountSetting({ Id: row.Id, Permission: row.Permission ?? 0, Status: next })
    ElMessage.success(next === 1 ? t('account.disableSuccess') : t('account.enableSuccess'))
    await table.load()
  } catch {
    ElMessage.error(next === 1 ? t('account.disableFailed') : t('account.enableFailed'))
  }
}

table.load().catch(() => void 0)
</script>

<style scoped lang="scss">
.account-management {
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
  width: 240px;
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
  margin-bottom: 10px;
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

.edit-tip {
  margin-bottom: 12px;
}

.w-full {
  width: 100%;
}
</style>
