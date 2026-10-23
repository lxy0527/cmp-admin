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
import { toPaged, slicePage } from './paging'
import type { PagedData } from '@/composables/useTableList'
import { isAdmin } from '@/utils/session'
import {
  DEMO_MODE,
  demoArchiveCreate,
  demoArchiveDelete,
  demoArchiveList,
  demoArchiveUpdate,
  demoResourceDelete,
  demoResourceList,
  demoResourceReplace,
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
 *   Role=0 普通账号   → `/albumByUser`   只看自己账号下的档案
 * 分流放在 api 层，页面不用感知。
 */
export async function getArchiveList(SearchTitle = ''): Promise<PhotoArchiveRow[]> {
  if (!isAdmin()) return getArchiveListByUser(SearchTitle)
  if (DEMO_MODE) return demoArchiveList(SearchTitle)
  const { data } = await request<PhotoArchiveRow[]>({
    url: '/album',
    method: 'post',
    data: SearchTitle ? { SearchTitle } : {}
  })
  return Array.isArray(data) ? data : []
}

/**
 * 按登录账号查档案：POST /api/albumByUser（普通账号用）
 *
 * ⚠️ 不再传 `UserId`。2026-10-21 后端明确：byUser 系列用 token 验证，
 * UserId「传不传都没关系，只是用不到」。
 */
export async function getArchiveListByUser(SearchTitle = ''): Promise<PhotoArchiveRow[]> {
  if (DEMO_MODE) return demoArchiveList(SearchTitle)
  const { data } = await request<PhotoArchiveRow[]>({
    url: '/albumByUser',
    method: 'post',
    data: SearchTitle ? { SearchTitle } : {}
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

/**
 * 替换图片：POST /api/albumImageReplace（multipart 表单）
 *
 * 请求字段（文档 2026-10-18）：
 *   Id   —— **要替换的那张图片自身的 Id**（= PhotoResourceRow.Id），不是相册 Id
 *   file —— 文件本体
 *
 * ⚠️ 后端硬性要求：**扩展名必须和原图一致**（文档第 4 条）。
 *    因为它是在**原地覆盖同名文件**（数据库里存的 URL 不变），
 *    换了后缀就会出现"文件名叫 abc.png、内容却是 JPEG"的坏图。
 *
 * ⚠️ 由此推出两件事，前端必须处理，否则会以为没生效：
 *    1. 响应只返回 ReturnCode，**不返回新 URL** → 要重新拉列表
 *    2. URL 不变 → **浏览器会继续显示缓存的旧图** → 必须加时间戳破缓存
 *       （见 PhotoContent.vue 的 imgSrc()）
 */
export async function replaceResource(Id: number, file: File): Promise<void> {
  if (DEMO_MODE) return demoResourceReplace(Id, file)
  const form = new FormData()
  form.append('Id', String(Id))
  form.append('file', file)
  await request({ url: '/albumImageReplace', method: 'post', data: form })
}

/** 从 URL 里取扩展名（小写、不含点）；取不到返回空串 */
export function extOfUrl(url: string): string {
  if (!url) return ''
  const clean = url.split('?')[0].split('#')[0]
  const m = clean.match(/\.([a-zA-Z0-9]+)$/)
  return m ? m[1].toLowerCase() : ''
}

/* ============================================================
 * 服务端分页版（2026-10-20 后端新增）
 * ============================================================
 * ⚠️ 后端 `page` 从 **0** 开始；这里的 `page` 从 **1** 开始，传之前统一 -1。
 * 档案下拉框仍用 getArchiveList()（要全量），只有列表表格走分页版。
 */
export async function getArchivePage(params: {
  page: number
  pageSize: number
  SearchTitle?: string
}): Promise<PagedData<PhotoArchiveRow>> {
  if (!isAdmin()) {
    return getArchiveByUserPage(params)
  }
  const keyword = (params.SearchTitle || '').trim()
  if (DEMO_MODE) {
    const rows = await demoArchiveList(keyword)
    return slicePage(rows, params.page, params.pageSize)
  }
  const res = await request<PhotoArchiveRow[]>({
    url: '/album',
    method: 'post',
    data: {
      page: Math.max(0, params.page - 1),
      pagesize: params.pageSize,
      ...(keyword ? { SearchTitle: keyword } : {})
    }
  })
  return toPaged(res)
}

/** 普通账号分页查询自己的档案：POST /api/albumByUser（身份由 token 决定，不传 UserId） */
export async function getArchiveByUserPage(params: {
  page: number
  pageSize: number
  SearchTitle?: string
}): Promise<PagedData<PhotoArchiveRow>> {
  const keyword = (params.SearchTitle || '').trim()
  if (DEMO_MODE) {
    const rows = await demoArchiveList(keyword)
    return slicePage(rows, params.page, params.pageSize)
  }
  const res = await request<PhotoArchiveRow[]>({
    url: '/albumByUser',
    method: 'post',
    data: {
      page: Math.max(0, params.page - 1),
      pagesize: params.pageSize,
      ...(keyword ? { SearchTitle: keyword } : {})
    }
  })
  return toPaged(res)
}

/** 某个档案下的图片（分页）：POST /api/albumImage */
export async function getResourcePage(params: {
  AlbumId: number
  page: number
  pageSize: number
  SearchTitle?: string
}): Promise<PagedData<PhotoResourceRow>> {
  const keyword = (params.SearchTitle || '').trim()
  if (DEMO_MODE) {
    const rows = await demoResourceList(params.AlbumId, keyword)
    return slicePage(rows, params.page, params.pageSize)
  }
  const res = await request<PhotoResourceRow[]>({
    url: '/albumImage',
    method: 'post',
    data: {
      AlbumId: params.AlbumId,
      page: Math.max(0, params.page - 1),
      pagesize: params.pageSize,
      ...(keyword ? { SearchTitle: keyword } : {})
    }
  })
  return toPaged(res)
}