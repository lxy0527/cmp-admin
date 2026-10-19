<template>
  <div class="page photo-content">
    <!-- ---------------- 选择档案 + 查询 ---------------- -->
    <div class="filter-bar">
      <div class="filter-item">
        <span class="filter-label">{{ t('photoContent.archive') }}</span>
        <el-select
          v-model="albumId"
          :placeholder="t('photoContent.selectArchive')"
          class="filter-control"
          @change="handleQuery"
        >
          <el-option v-for="a in archives" :key="a.Id" :label="a.Name" :value="a.Id" />
        </el-select>
      </div>

      <div class="filter-item">
        <el-input
          v-model="keyword"
          :placeholder="t('photoContent.inputName')"
          clearable
          class="filter-control"
          @keyup.enter="handleQuery"
        />
      </div>

      <div class="filter-actions">
        <el-button type="primary" :icon="Search" @click="handleQuery">{{ t('common.query') }}</el-button>
        <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
        <el-button v-permission="P.photoContent" type="primary" plain :icon="Plus" @click="openCreate">
          {{ t('photoContent.addTitle') }}
        </el-button>
      </div>
    </div>

    <!-- ---------------- 列表 ---------------- -->
    <div class="page-card table-card">
      <div class="table-head">
        <span class="card-title">{{ t('menu.cmpSettingItems.photoContent') }}</span>
        <div class="batch-actions">
          <span class="selected-text">
            {{ t('common.selected') }}: {{ selectedIds.length }} {{ t('common.records') }}
          </span>
          <el-button
            v-permission="P.photoContent"
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
        <el-table-column type="selection" width="46" align="center" />
        <el-table-column prop="Id" label="ID" width="80" align="center" />
        <el-table-column :label="t('photoContent.image')" width="110" align="center">
          <template #default="{ row }">
            <el-image
              :src="withBase(row.URL)"
              :preview-src-list="[withBase(row.URL)]"
              preview-teleported
              fit="cover"
              class="thumb"
            >
              <!-- 加载不到时显示占位（演示模式的示例路径、或真实环境文件缺失，都走这里） -->
              <template #error>
                <div class="thumb-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="Name" :label="t('photoContent.name')" min-width="240" />
        <el-table-column prop="URL" :label="t('photoContent.resourceUrl')" min-width="360">
          <template #default="{ row }">
            <span class="mono">{{ row.URL }}</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.operation')" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button v-permission="P.photoContent" link type="primary" size="small" @click="openEdit(row as PhotoResourceRow)">
              {{ t('common.edit') }}
            </el-button>
            <el-button v-permission="P.photoContent" link type="danger" size="small" @click="handleDelete(row as PhotoResourceRow)">
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

    <!--
      ---------------- 新增资源（对应 /albumImageUpload） ----------------
      对齐旧站的流程：**上传是"新增一条资源"的一部分**，不是在工具栏里做批量上传。
    -->
    <el-dialog v-model="createVisible" :title="t('photoContent.addTitle')" width="560px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="110px">
        <el-form-item :label="t('photoContent.name')" prop="Name">
          <el-input v-model="createForm.Name" :placeholder="t('photoContent.inputName')" />
        </el-form-item>

        <el-form-item :label="t('photoContent.type')">
          <el-tag size="small" type="info">{{ t('photoContent.typeImage') }}</el-tag>
          <span class="inline-hint">{{ t('photoContent.typeHint') }}</span>
        </el-form-item>

        <el-form-item :label="t('photoContent.upload')" prop="file">
          <div class="uploader-wrap">
            <el-upload
              drag
              :auto-upload="false"
              :limit="1"
              accept="image/*"
              :on-change="onCreateFileChange"
              :on-remove="onCreateFileRemove"
              :on-exceed="onCreateExceed"
              :show-file-list="true"
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">{{ t('photoContent.selectFile') }}</div>
            </el-upload>
            <div class="upload-hint">{{ t('photoContent.uploadHint') }}</div>
          </div>
        </el-form-item>

        <el-form-item :label="t('photoContent.archive')" prop="AlbumId">
          <el-select v-model="createForm.AlbumId" class="w-full">
            <el-option v-for="a in archives" :key="a.Id" :label="a.Name" :value="a.Id" />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 接口能力说明，避免被当成"漏做" -->
      <el-alert type="info" :closable="false" :title="t('photoContent.createNote')" />

      <template #footer>
        <el-button @click="createVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">
          {{ t('common.confirm') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ---------------- 修改资源（改名字 + 看当前图） ---------------- -->
    <el-dialog v-model="editVisible" :title="t('photoContent.editTitle')" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item :label="t('photoContent.image')">
          <el-image
            :src="withBase(form.URL)"
            :preview-src-list="[withBase(form.URL)]"
            preview-teleported
            fit="cover"
            class="thumb-lg"
          >
            <template #error>
              <div class="thumb-placeholder thumb-placeholder--lg">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </el-form-item>

        <el-form-item :label="t('photoContent.type')">
          <el-tag size="small" type="info">{{ t('photoContent.typeImage') }}</el-tag>
        </el-form-item>

        <el-form-item :label="t('photoContent.name')" prop="Name">
          <el-input v-model="form.Name" :placeholder="t('photoContent.inputName')" />
        </el-form-item>
      </el-form>

      <el-alert type="info" :closable="false" :title="t('photoContent.editNote')" />

      <template #footer>
        <el-button @click="editVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 照片牆資源管理（= 某个档案下的图片，**不是"图片报警"**）
 * ============================================================
 * 结构是两级：先选"档案"（相册），再看这个档案下的图片。
 * 所以进页面先拉档案列表，再拉第一个档案的图片。
 *
 * ⚠️ 接口约束：
 *   - 删单张必须 Id + URL 一起传
 *   - 批量删传逗号分隔的 IdArr
 *   - **没有"移动图片到别的档案"接口**，也没有"新建图片"，只有改名（上传算在档案里）
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh, Search, Picture, UploadFilled } from '@element-plus/icons-vue'
import {
  deleteResource,
  deleteResources,
  getArchiveList,
  getResourceList,
  updateResource,
  uploadResource,
  type PhotoArchiveRow,
  type PhotoResourceRow
} from '@/api/album'
import { useTableList } from '@/composables/useTableList'
import { P } from '@/config/permission'

defineOptions({ name: 'PhotoContent' })

const { t } = useI18n()

/** 后端给的是相对根目录路径，展示时拼上资源主机（没有配置就原样） */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL as string | undefined) || ''
function withBase(url: string) {
  if (!url) return ''
  return /^https?:\/\//i.test(url) ? url : `${ASSET_BASE}${url}`
}

/* ---------------- 档案下拉 ---------------- */
const archives = ref<PhotoArchiveRow[]>([])
const albumId = ref<number | undefined>(undefined)
const keyword = ref('')

async function loadArchives() {
  try {
    archives.value = await getArchiveList()
    if (!albumId.value && archives.value.length) {
      albumId.value = archives.value[0].Id
    }
  } catch {
    ElMessage.error(t('photoContent.loadArchiveFailed'))
  }
}

/* ---------------- 资源列表 ---------------- */
const table = useTableList<PhotoResourceRow>({
  fetcher: async () => {
    if (!albumId.value) return []
    return getResourceList(albumId.value, keyword.value)
  }
})

async function handleQuery() {
  table.search()
  await table.load().catch(() => void 0)
}

async function handleReset() {
  keyword.value = ''
  await handleQuery()
}

/* ---------------- 批量选择 ---------------- */
const selectedIds = ref<number[]>([])
function onSelectionChange(rows: PhotoResourceRow[]) {
  selectedIds.value = rows.map((r) => r.Id)
}

/* ---------------- 改名 ---------------- */
const editVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive<{ Id?: number; Name: string; URL: string }>({ Id: undefined, Name: '', URL: '' })

const rules = computed<FormRules>(() => ({
  Name: [{ required: true, message: t('photoContent.inputName'), trigger: 'blur' }]
}))

function openEdit(row?: PhotoResourceRow) {
  form.Id = row?.Id
  form.Name = row?.Name ?? ''
  form.URL = row?.URL ?? ''
  editVisible.value = true
}

async function submitEdit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !form.Id) return
  saving.value = true
  try {
    await updateResource(form.Id, form.Name)
    ElMessage.success(t('common.saveSuccess'))
    editVisible.value = false
    await table.load()
  } catch {
    ElMessage.error(t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

/* ---------------- 新增资源（上传是"新增"的一部分，不是批量上传） ---------------- */
/**
 * ⚠️ 接口能力边界（别改错）：
 *   `/api/uploadImage` **只收 folderId + file**，不接收名称；
 *   返回体只有 ReturnCode，**拿不到新图片的 Id**。
 *
 *   所以「資源名稱」这样落地：上传前后各拉一次列表，**Id 差集**就是刚传的那张，
 *   拿到 Id 后再调 `/albumImageEdit` 改名 —— 这样名称是真的生效，不是摆设。
 *   （差集比"按文件名匹配"可靠，因为后端可能改名/加时间戳）
 */
const createVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createFile = ref<File | undefined>(undefined)
const createForm = reactive<{ Name: string; AlbumId: number | undefined }>({
  Name: '',
  AlbumId: undefined
})

const createRules = computed<FormRules>(() => ({
  Name: [{ required: true, message: t('photoContent.inputName'), trigger: 'blur' }],
  AlbumId: [{ required: true, message: t('photoContent.selectArchive'), trigger: 'change' }]
}))

function openCreate() {
  createForm.Name = ''
  createForm.AlbumId = albumId.value ?? archives.value[0]?.Id
  createFile.value = undefined
  createVisible.value = true
}

function onCreateFileChange(_file: unknown, files: Array<{ raw?: File }>) {
  createFile.value = files[0]?.raw
}

function onCreateFileRemove() {
  createFile.value = undefined
}

function onCreateExceed() {
  ElMessage.warning(t('photoContent.exceedSingle'))
}

async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (!createFile.value) {
    ElMessage.warning(t('photoContent.noFiles'))
    return
  }
  const album = createForm.AlbumId as number

  creating.value = true
  // 记录上传前的 Id 基线，用来找出"新出现的那张"
  let beforeIds = new Set<number>()
  try {
    beforeIds = new Set((await getResourceList(album)).map((r) => r.Id))
  } catch {
    // 拿不到基线不阻塞上传，只是不会自动改名
  }

  try {
    await uploadResource(album, [createFile.value])

    const name = createForm.Name.trim()
    if (name) {
      try {
        const after = await getResourceList(album)
        const created = after.filter((r) => !beforeIds.has(r.Id))
        if (created.length === 1) {
          await updateResource(created[0].Id, name)
        }
      } catch {
        // 改名失败不阻塞主流程，用户仍可在列表里手动改
      }
    }

    ElMessage.success(t('photoContent.createSuccess'))
    createVisible.value = false
    // 传的档案可能不是当前正在看的那一个，切过去再刷新
    albumId.value = album
    keyword.value = ''
    await handleQuery()
  } catch {
    ElMessage.error(t('photoContent.uploadFailed'))
  } finally {
    creating.value = false
  }
}

/* ---------------- 删除 ---------------- */
async function handleDelete(row: PhotoResourceRow) {
  const ok = await ElMessageBox.confirm(t('common.deleteConfirm'), t('common.warmTip'), {
    type: 'warning'
  }).catch(() => false)
  if (!ok) return
  try {
    await deleteResource(row.Id, row.URL)
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
    await deleteResources(selectedIds.value)
    ElMessage.success(t('common.deleteSuccess'))
    await table.load()
  } catch {
    ElMessage.error(t('common.deleteFailed'))
  }
}

/* ---------------- 初始化 ---------------- */
;(async () => {
  await loadArchives()
  await handleQuery()
})()
</script>

<style scoped lang="scss">
.photo-content {
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
  width: 200px;
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

.thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background: #f4f5f7;
}

.thumb-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 18px;
  color: #c0c4cc;
  background: #f4f5f7;
  border-radius: 4px;
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

.w-full {
  width: 100%;
}

/* 上传弹窗 */
.uploader-wrap {
  width: 100%;
}

.upload-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: $text-secondary;
}

.inline-hint {
  margin-left: 8px;
  font-size: 12px;
  color: $text-secondary;
}

/* 修改弹窗里的大缩略图 */
.thumb-lg {
  width: 140px;
  height: 100px;
  border-radius: 6px;
  background: #f4f5f7;
}

.thumb-placeholder--lg {
  width: 140px;
  height: 100px;
  font-size: 26px;
  border-radius: 6px;
}

.mono {
  font-family: Consolas, monospace;
  font-size: 12px;
  color: $text-secondary;
}
</style>
