<template>
  <div class="page photo-wall">
    <!-- ---------------- 查询 + 新增 ---------------- -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        :placeholder="t('photoWall.inputNameCn')"
        clearable
        class="filter-input"
        @keyup.enter="handleQuery"
      />
      <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.query') }}</el-button>
      <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
      <el-button v-permission="P.photoWall" type="primary" plain :icon="Plus" @click="openDialog()">
        {{ t('common.add') }}
      </el-button>
    </div>

    <!-- ---------------- 列表 ---------------- -->
    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">{{ t('menu.cmpSettingItems.photoWall') }}</span>
        <span class="head-hint">{{ ARCHIVE_HINT }}</span>
      </div>

      <el-table v-loading="table.loading.value" :data="table.list.value" stripe height="100%">
        <el-table-column prop="Id" label="ID" width="80" align="center" />
        <el-table-column prop="Name" :label="t('photoWall.name')" min-width="220" />
        <el-table-column prop="FolderName" label="FolderName" min-width="320">
          <template #default="{ row }">
            <span class="mono">{{ row.FolderName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="UserId" label="UserId" width="100" align="center" />
        <el-table-column prop="CreateTime" :label="t('photoWall.createTime')" width="180" align="center">
          <template #default="{ row }">{{ formatServerDateTime(row.CreateTime) }}</template>
        </el-table-column>

        <el-table-column :label="t('common.operation')" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="P.photoWall" link type="primary" size="small" @click="openDialog(row as PhotoArchiveRow)">
              {{ t('common.edit') }}
            </el-button>
            <el-button v-permission="P.photoWall" link type="danger" size="small" @click="handleDelete(row as PhotoArchiveRow)">
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
          :page-sizes="[10, 20, 50, 100]"
          :total="table.total.value"
          layout="prev, pager, next, sizes, jumper"
          background
          @size-change="table.handleSizeChange"
        />
      </div>
    </div>

    <!-- ---------------- 新增 / 编辑 ---------------- -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="440px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item :label="t('photoWall.nameCn')" prop="Name">
          <el-input v-model="form.Name" :placeholder="t('photoWall.inputNameCn')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 照片牆檔案管理（= 相册 / 分类，**不是报警**）
 * ============================================================
 * 旧站的档案还有 名称中文/英文、排序、是否开启 等字段，
 * 但**公开接口的 album 只有 Name / UserId / FolderName**，所以本页只做这些。
 * 等新接口给了更多字段，只需要改表单 + 列。
 *
 * ⚠️ 删除必须同时传 Id 和 FolderName（后端会连服务器上的文件夹一起删），所以删除前不做二次确认是不够的。
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search } from '@element-plus/icons-vue'
import {
  createArchive,
  deleteArchive,
  getArchiveList,
  getArchivePage,
  updateArchive,
  type PhotoArchiveRow
} from '@/api/album'
import { useTableList } from '@/composables/useTableList'
import { useUserStore } from '@/store/user'
import { P } from '@/config/permission'
import { formatServerDateTime } from '@/utils/format'

defineOptions({ name: 'PhotoWall' })

const { t } = useI18n()
const userStore = useUserStore()

const keyword = ref('')

const ARCHIVE_HINT = computed(() => t('photoWall.hint'))

// 服务端分页（后端 2026-10-20 新增）
const table = useTableList<PhotoArchiveRow>({
  mode: 'server',
  fetchPage: ({ page, pageSize }) =>
    getArchivePage({ page, pageSize, SearchTitle: keyword.value })
})

async function handleQuery() {
  table.search()
  await table.load().catch(() => void 0)
}

async function handleReset() {
  keyword.value = ''
  await handleQuery()
}

/* ---------------- 新增 / 编辑 ---------------- */
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<{ Id?: number; Name: string }>({ Id: undefined, Name: '' })

const dialogTitle = computed(() =>
  form.Id ? t('photoWall.editTitle') : t('photoWall.addTitle')
)

const rules = computed<FormRules>(() => ({
  Name: [{ required: true, message: t('photoWall.inputNameCn'), trigger: 'blur' }]
}))

function openDialog(row?: PhotoArchiveRow) {
  form.Id = row?.Id
  form.Name = row?.Name ?? ''
  dialogVisible.value = true
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (form.Id) {
      await updateArchive(form.Id, form.Name)
    } else {
      // 新建必须带 UserId：用当前登录账号的 id（文档：档案归属于某个用户）
      await createArchive(userStore.userInfo?.userId ?? 1, form.Name)
    }
    ElMessage.success(t('common.saveSuccess'))
    dialogVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 删除 ---------------- */
async function handleDelete(row: PhotoArchiveRow) {
  const ok = await ElMessageBox.confirm(
    t('photoWall.deleteConfirm', { name: row.Name }),
    t('common.warmTip'),
    { type: 'warning' }
  ).catch(() => false)
  if (!ok) return

  try {
    await deleteArchive(row.Id, row.FolderName)
    ElMessage.success(t('common.deleteSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

table.load().catch(() => void 0)
</script>

<style scoped lang="scss">
.photo-wall {
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
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}

.head-hint {
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
</style>
