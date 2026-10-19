/**
 * 照片墙接口（档案 + 资源）
 * ============================================================
 * 对应 CMP Setting →
 *   - **照片牆檔案管理**（archive / 相册）  → /api/album*
 *   - **照片牆資源管理**（图片 / 视频）      → /api/albumImage*
 *
 * ⚠️ 命名容易误解（旧站中文名会让人以为是"报警图片"，其实不是）：
 *   档案 = 一个相册/分类，字段只有 Name / UserId / FolderName
 *   资源 = 档案下面的一张图，字段只有 Name / URL
 *
 * ⚠️ 实测/文档约束：
 *   1. 删除档案必须**同时传 Id 和 FolderName**（FolderName 是服务器上的真实文件夹名）
 *   2. 删除图片必须**同时传 Id 和 URL**
 *   3. 上传是 **multipart 表单**（不是 JSON），字段名固定为 `folderId` + `file`
 *   4. 没有"移动资源到别的档案"接口
 */
import { request } from './request'
import { getSessionUserId, isAdmin } from '@/utils/session'
import {
  DEMO_MODE,
  demoArchiveCreate,
  demoArchiveDelete,
  demoArchiveList,
  demoArchiveUpdate,
  demoResourceDelete,
  demoResourceList,
  demoResourceUpdate,
  demoResourceUpload
} from '@/demo'

/* ============================================================
 * 档案（相册）
 * ============================================================ */

export interface PhotoArchiveRow {
  Id: number
  /** 相册名称 */
  Name: string
  /** 所属用户 Id */
  UserId: number
  /** 服务器上实际的文件夹名（删除时必传） */
  FolderName: string
  CreateTime: string
  UpdateTime: string
}

/**
 * 档案列表
 * ⚠️ 文档要求按角色分流：
 *   Role=1 后端管理员 → `/album`         看全部档案
 *   Role=0 普通账号   → `/albumByUser`   只看自己账号下的档案（必须带 UserId）
 * 分流放在 api 层，页面不用感知。
 */
export async function getArchiveList(SearchTitle = ''): Promise<PhotoArchiveRow[]> {
  if (!isAdmin()) return getArchiveListByUser(getSessionUserId(), SearchTitle)
  if (DEMO_MODE) return demoArchiveList(SearchTitle)
  const { data } = await request<PhotoArchiveRow[]>({
    url: '/album',
    method: 'post',
    data: SearchTitle ? { SearchTitle } : {}
  })
  return Array.isArray(data) ? data : []
}

/** 按登录账号查档案：POST /api/albumByUser（普通账号用） */
export async function getArchiveListByUser(
  UserId: number,
  SearchTitle = ''
): Promise<PhotoArchiveRow[]> {
  if (DEMO_MODE) return demoArchiveList(SearchTitle)
  const { data } = await request<PhotoArchiveRow[]>({
    url: '/albumByUser',
    method: 'post',
    data: { UserId, ...(SearchTitle ? { SearchTitle } : {}) }
  })
  return Array.isArray(data) ? data : []
}

/** 新建档案：POST /api/albumCreate（UserId + Name 必传） */
export async function createArchive(UserId: number, Name: string): Promise<void> {
  if (DEMO_MODE) return demoArchiveCreate(UserId, Name)
  await request({ url: '/albumCreate', method: 'post', data: { UserId, Name } })
}

/** 改档案名：POST /api/albumEdit（Id + Name 必传） */
export async function updateArchive(Id: number, Name: string): Promise<void> {
  if (DEMO_MODE) return demoArchiveUpdate(Id, Name)
  await request({ url: '/albumEdit', method: 'post', data: { Id, Name } })
}

/** 删档案：POST /api/albumDelete（Id + FolderName 必传，会把文件夹一起删掉） */
export async function deleteArchive(Id: number, FolderName: string): Promise<void> {
  if (DEMO_MODE) return demoArchiveDelete(Id)
  await request({ url: '/albumDelete', method: 'post', data: { Id, FolderName } })
}

/* ============================================================
 * 资源（图片）
 * ============================================================ */

export interface PhotoResourceRow {
  Id: number
  /** 图片名称 */
  Name: string
  /** 相对根目录的地址，如 /user/xxx/yyy.png */
  URL: string
}

/** 某个档案下的图片：POST /api/albumImage（AlbumId 必传） */
export async function getResourceList(AlbumId: number, SearchTitle = ''): Promise<PhotoResourceRow[]> {
  if (DEMO_MODE) return demoResourceList(AlbumId, SearchTitle)
  const { data } = await request<PhotoResourceRow[]>({
    url: '/albumImage',
    method: 'post',
    data: { AlbumId, ...(SearchTitle ? { SearchTitle } : {}) }
  })
  return Array.isArray(data) ? data : []
}

/** 改图片名：POST /api/albumImageEdit */
export async function updateResource(Id: number, Name: string): Promise<void> {
  if (DEMO_MODE) return demoResourceUpdate(Id, Name)
  await request({ url: '/albumImageEdit', method: 'post', data: { Id, Name } })
}

/** 删单张：POST /api/albumImageDelete（Id + URL 必传） */
export async function deleteResource(Id: number, URL: string): Promise<void> {
  if (DEMO_MODE) return demoResourceDelete([Id])
  await request({ url: '/albumImageDelete', method: 'post', data: { Id, URL } })
}

/** 批量删：POST /api/albumImageDeletes（IdArr 是逗号分隔的字符串） */
export async function deleteResources(ids: number[]): Promise<void> {
  if (DEMO_MODE) return demoResourceDelete(ids)
  await request({ url: '/albumImageDeletes', method: 'post', data: { IdArr: ids.join(',') } })
}

/**
 * 上传图片：POST /api/uploadImage
 * ⚠️ 这个接口**只收两个字段**（文档原文）：
 *    folderId —— 目标档案 Id
 *    file     —— 文件本体（支持单张或批量）
 *    它**不接收** 名称 / 类型 / 备注；返回体也只有 `ReturnCode`，
 *    拿不到新图片的 Id，所以"上传后立刻改名"这条路走不通 ——
 *    要改名只能等列表刷新后点「编辑」。
 *
 * 另外这是 **multipart 表单**，不是 JSON，所以直接构造 FormData 绕开 request() 的 JSON 序列化。
 */
export async function uploadResource(folderId: number, files: File[]): Promise<void> {
  if (DEMO_MODE) return demoResourceUpload(folderId, files)
  const form = new FormData()
  form.append('folderId', String(folderId))
  files.forEach((file) => form.append('file', file))

  await request({
    url: '/uploadImage',
    method: 'post',
    data: form
    // 注意：不要手动设置 Content-Type，交给浏览器带 boundary
  })
}
