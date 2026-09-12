<template>
  <div class="page role-management">
    <!-- ---------------- 查询 + 操作 ---------------- -->
    <div class="filter-bar">
      <el-input
        v-model="query.roleName"
        placeholder="请输入角色名称"
        clearable
        class="filter-input"
        @keyup.enter="handleQuery"
      />
      <el-button type="primary" :icon="Search" @click="handleQuery">查询</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      <!-- 按钮级权限：v-permission 无权限时直接把按钮从 DOM 摘掉（观察者_Viewer 登录就看不到这个按钮） -->
      <el-button v-permission="P.roleAdd" type="primary" plain :icon="Plus" @click="openDialog()">
        新增
      </el-button>
    </div>

    <!-- ---------------- 表格 ---------------- -->
    <div class="page-card table-card">
      <el-table v-loading="loading" :data="rows" stripe height="100%">
        <el-table-column prop="id" label="ID" width="120" align="center" />
        <el-table-column prop="roleName" label="角色名称" min-width="200" align="center" />
        <el-table-column prop="roleDesc" label="角色描述" min-width="320" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="200" align="center" />
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-permission="P.roleEdit"
              link
              type="primary"
              size="small"
              @click="openDialog(row as RoleRow)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="P.roleDelete"
              link
              type="danger"
              size="small"
              @click="handleDelete(row as RoleRow)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-foot">
        <span class="total-text">共 {{ total }} 条记录</span>
        <el-pagination
          v-model:current-page="query.pageNum"
          v-model:page-size="query.pageSize"
          :total="total"
          layout="prev, pager, next, sizes, jumper"
          background
          @current-change="fetchData"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <!-- ---------------- 新增 / 编辑 ---------------- -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑角色' : '新增角色'" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="form.roleDesc" placeholder="请输入角色描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import { deleteRoleApi, getRolePageApi, saveRoleApi } from '@/api/role'
import { P } from '@/config/permission'
import type { RoleQuery, RoleRow } from '@/mock'

defineOptions({ name: 'RoleManagement' })

/* ---------------- 查询条件 / 列表 ---------------- */
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const rows = ref<RoleRow[]>([])
const total = ref(0)

const query = reactive<RoleQuery>({ roleName: '', pageNum: 1, pageSize: 20 })

/* ---------------- 新增 / 编辑表单 ---------------- */
const formRef = ref<FormInstance>()
const form = reactive<Partial<RoleRow>>({ id: undefined, roleName: '', roleDesc: '' })

const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

/** 拉列表（分页由 mock 内部处理，换真实接口后逻辑不变） */
async function fetchData() {
  loading.value = true
  try {
    const res = await getRolePageApi({ ...query })
    rows.value = res.list
    total.value = res.total
  } catch (e) {
    ElMessage.error((e as Error).message || '查询失败')
  } finally {
    loading.value = false
  }
}

/** 点"查询"：回到第 1 页再查（否则会停在旧页码导致空列表） */
function handleQuery() {
  query.pageNum = 1
  fetchData()
}

/** 点"重置"：清空条件 + 回第 1 页 */
function handleReset() {
  query.roleName = ''
  query.pageNum = 1
  fetchData()
}

/** 改每页条数：页码要归零，不然会停在超出范围的页 */
function handleSizeChange() {
  query.pageNum = 1
  fetchData()
}

/** 打开弹窗：传 row = 编辑，不传 = 新增（同一个弹窗复用） */
function openDialog(row?: RoleRow) {
  if (row) {
    Object.assign(form, { id: row.id, roleName: row.roleName, roleDesc: row.roleDesc })
  } else {
    Object.assign(form, { id: undefined, roleName: '', roleDesc: '' })
  }
  dialogVisible.value = true
}

/** 提交前先过表单校验；成功后关弹窗并刷新列表 */
async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await saveRoleApi({ ...form })
    ElMessage.success(form.id ? '修改成功' : '新增成功')
    dialogVisible.value = false
    fetchData()
  } finally {
    saving.value = false
  }
}

/** 删除：二次确认，取消则什么都不做 */
async function handleDelete(row: RoleRow) {
  const action = await ElMessageBox.confirm(`确认删除角色「${row.roleName}」吗？`, '提示', {
    type: 'warning'
  }).catch(() => 'cancel')
  if (action === 'cancel') return
  await deleteRoleApi(row.id)
  ElMessage.success('删除成功')
  fetchData()
}

onMounted(fetchData)
</script>

<style scoped lang="scss">
.role-management {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.filter-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
}

.filter-input {
  width: 200px;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px;
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
