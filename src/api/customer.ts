/**
 * 客户（Customer）与客户关联账号（CustomerUser）接口
 * ============================================================
 * 对应 CMP Setting → **客户管理**（旧站没有这一项，新增的模块）。
 *
 * 这一块一共 **14 个接口**，文档齐全、全部可用，是本项目里唯一"有完整增删改查
 * 但之前完全没做页面"的模块。
 *
 * 结构是两级：
 *   客户（公司） 1 ─── n 关联账号
 *     customerAdd / customerEdit / customerDelete / customerStatus / customerDeletes
 *       ← 管客户本身
 *     customerUser / customerUserAdd / customerUserEdit / customerUserDelete
 *     customerUserStatus / customerUserDeletes
 *       ← 管某个客户下挂的登录账号
 *
 * ⚠️ 文档里没有的字段（参考图上有、但接口没有）：
 *   - "审批信息"（第1步 / 申请人 / 第2步）
 *   - "第几步审批"、审批流
 *   这些是旧系统（图 1 那个 .NET 后台）的概念，新接口**完全没有**。
 *   页面里不做假数据，等后端确认要不要补。
 */
import { request } from './request'
import { toPaged, slicePage } from './paging'
import type { PagedData } from '@/composables/useTableList'
import { getSessionUserId, isAdmin } from '@/utils/session'
import {
  DEMO_MODE,
  demoCustomerCreate,
  demoCustomerDelete,
  demoCustomerList,
  demoCustomerSetStatus,
  demoCustomerUpdate,
  demoCustomerUserCreate,
  demoCustomerUserDelete,
  demoCustomerUserList,
  demoCustomerUserSetStatus,
  demoCustomerUserUpdate
} from '@/demo'

/* ============================================================
 * 客户
 * ============================================================ */

export interface CustomerRow {
  Id: number
  /** 公司名称 */
  Company: string
  /** 编号 */
  SN: string
  /** 负责人 */
  Manager: string | null
  /** 负责人电话 */
  Tele: string | null
  /** logo（相对根目录路径） */
  Logo: string | null
  Remark: string | null
  CreateTime: string
  UpdateTime: string
  /** 0 开启 / 1 关闭 */
  Status: number
}

/** 新增客户（Company + SN 必填，其余可空） */
export interface CustomerCreatePayload {
  Company: string
  SN: string
  Manager?: string
  Tele?: string
  Logo?: string
  Remark?: string
}

/** 修改客户（每个字段都要传，Id/Company/SN/Status 不能空） */
export interface CustomerEditPayload extends CustomerCreatePayload {
  Id: number
  Status: number
}

/**
 * 客户列表
 * ⚠️ 文档要求按角色分流：
 *   Role=1 后端管理员 → `/customer`         看全部客户
 *   Role=0 普通账号   → `/customerByUser`   只能看自己关联的客户
 * 分流放在 api 层，页面不用感知。
 */
export async function getCustomerList(SearchTitle = ''): Promise<CustomerRow[]> {
  if (!isAdmin()) return getCustomerListByUser(getSessionUserId(), SearchTitle)
  if (DEMO_MODE) return demoCustomerList(SearchTitle)
  const { data } = await request<CustomerRow[]>({
    url: '/customer',
    method: 'post',
    data: SearchTitle ? { SearchTitle } : {}
  })
  return Array.isArray(data) ? data : []
}

/** 普通账号查询关联客户：POST /api/customerByUser（UserId 必传） */
export async function getCustomerListByUser(
  UserId: number,
  SearchTitle = ''
): Promise<CustomerRow[]> {
  if (DEMO_MODE) return demoCustomerList(SearchTitle)
  const { data } = await request<CustomerRow[]>({
    url: '/customerByUser',
    method: 'post',
    data: { UserId, ...(SearchTitle ? { SearchTitle } : {}) }
  })
  return Array.isArray(data) ? data : []
}

/** 查询单个客户（Id / SN 二选一，另一个传 0 / 空串） */
export async function getCustomerDetail(params: {
  Id?: number
  SN?: string
}): Promise<CustomerRow | null> {
  if (DEMO_MODE) {
    const list = await demoCustomerList('')
    return list.find((c) => c.Id === params.Id) ?? null
  }
  const { data } = await request<CustomerRow>({
    url: '/customerSingle',
    method: 'post',
    data: { Id: params.Id ?? 0, SN: params.SN ?? '' }
  })
  return data || null
}

/** 新增客户：POST /api/customerAdd */
export async function createCustomer(payload: CustomerCreatePayload): Promise<void> {
  if (DEMO_MODE) return demoCustomerCreate(payload)
  await request({
    url: '/customerAdd',
    method: 'post',
    data: {
      Company: payload.Company,
      SN: payload.SN,
      Manager: payload.Manager ?? '',
      Tele: payload.Tele ?? '',
      Logo: payload.Logo ?? '',
      Remark: payload.Remark ?? ''
    }
  })
}

/** 修改客户：POST /api/customerEdit */
export async function updateCustomer(payload: CustomerEditPayload): Promise<void> {
  if (DEMO_MODE) return demoCustomerUpdate(payload)
  await request({
    url: '/customerEdit',
    method: 'post',
    data: {
      Id: payload.Id,
      Company: payload.Company,
      SN: payload.SN,
      Manager: payload.Manager ?? '',
      Tele: payload.Tele ?? '',
      Logo: payload.Logo ?? '',
      Remark: payload.Remark ?? '',
      Status: payload.Status
    }
  })
}

/** 删除客户：POST /api/customerDelete */
export async function deleteCustomer(Id: number): Promise<void> {
  if (DEMO_MODE) return demoCustomerDelete([Id])
  await request({ url: '/customerDelete', method: 'post', data: { Id } })
}

/** 批量设置客户状态：POST /api/customerStatus（IdArr 是逗号分隔字符串） */
export async function setCustomerStatus(ids: number[], Status: number): Promise<void> {
  if (DEMO_MODE) return demoCustomerSetStatus(ids, Status)
  await request({ url: '/customerStatus', method: 'post', data: { IdArr: ids.join(','), Status } })
}

/** 批量删除客户：POST /api/customerDeletes */
export async function deleteCustomers(ids: number[]): Promise<void> {
  if (DEMO_MODE) return demoCustomerDelete(ids)
  await request({ url: '/customerDeletes', method: 'post', data: { IdArr: ids.join(',') } })
}

/* ============================================================
 * 客户关联账号
 * ============================================================ */

export interface CustomerUserRow {
  Id: number
  CustomerId: number
  UserId: number
  /** 姓名 */
  Name: string | null
  /** 账号 */
  UserName: string
  /** 0 开启 / 1 关闭 */
  Status: number
}

/** 某个客户下的关联账号：POST /api/customerUser（CustomerId 必传） */
export async function getCustomerUserList(
  CustomerId: number,
  SearchTitle = ''
): Promise<CustomerUserRow[]> {
  if (DEMO_MODE) return demoCustomerUserList(CustomerId, SearchTitle)
  const { data } = await request<CustomerUserRow[]>({
    url: '/customerUser',
    method: 'post',
    data: { CustomerId, ...(SearchTitle ? { SearchTitle } : {}) }
  })
  return Array.isArray(data) ? data : []
}

/** 添加关联账号：POST /api/customerUserAdd（CustomerId + UserId + UserName 必填） */
export async function createCustomerUser(payload: {
  CustomerId: number
  UserId: number
  UserName: string
  Name?: string
}): Promise<void> {
  if (DEMO_MODE) return demoCustomerUserCreate(payload)
  await request({
    url: '/customerUserAdd',
    method: 'post',
    data: {
      CustomerId: payload.CustomerId,
      UserId: payload.UserId,
      UserName: payload.UserName,
      Name: payload.Name ?? ''
    }
  })
}

/** 修改关联账号：POST /api/customerUserEdit（Id + Status 必填） */
export async function updateCustomerUser(payload: {
  Id: number
  Name?: string
  Status: number
}): Promise<void> {
  if (DEMO_MODE) return demoCustomerUserUpdate(payload)
  await request({
    url: '/customerUserEdit',
    method: 'post',
    data: { Id: payload.Id, Name: payload.Name ?? '', Status: payload.Status }
  })
}

/** 删除单个关联账号：POST /api/customerUserDelete */
export async function deleteCustomerUser(Id: number): Promise<void> {
  if (DEMO_MODE) return demoCustomerUserDelete([Id])
  await request({ url: '/customerUserDelete', method: 'post', data: { Id } })
}

/** 批量设置关联账号状态：POST /api/customerUserStatus */
export async function setCustomerUserStatus(ids: number[], Status: number): Promise<void> {
  if (DEMO_MODE) return demoCustomerUserSetStatus(ids, Status)
  await request({
    url: '/customerUserStatus',
    method: 'post',
    data: { IdArr: ids.join(','), Status }
  })
}

/** 批量删除关联账号：POST /api/customerUserDeletes */
export async function deleteCustomerUsers(ids: number[]): Promise<void> {
  if (DEMO_MODE) return demoCustomerUserDelete(ids)
  await request({ url: '/customerUserDeletes', method: 'post', data: { IdArr: ids.join(',') } })
}

/* ============================================================
 * 服务端分页版（2026-10-20 后端新增）
 * ============================================================
 * ⚠️ 后端 `page` 从 **0** 开始；这里的 `page` 从 **1** 开始（跟 el-pagination 一致），
 *    所以传之前统一 -1。
 * 文档要求按角色分流：管理员走 /customer 看全部，普通账号走 /customerByUser。
 */
export async function getCustomerPage(params: {
  page: number
  pageSize: number
  SearchTitle?: string
}): Promise<PagedData<CustomerRow>> {
  if (!isAdmin()) {
    return getCustomerByUserPage({ ...params, UserId: getSessionUserId() })
  }
  const keyword = (params.SearchTitle || '').trim()
  if (DEMO_MODE) {
    const rows = await demoCustomerList(keyword)
    return slicePage(rows, params.page, params.pageSize)
  }
  const res = await request<CustomerRow[]>({
    url: '/customer',
    method: 'post',
    data: {
      page: Math.max(0, params.page - 1),
      pagesize: params.pageSize,
      ...(keyword ? { SearchTitle: keyword } : {})
    }
  })
  return toPaged(res)
}

/** 普通账号分页查询自己关联的客户：POST /api/customerByUser（需要 token） */
export async function getCustomerByUserPage(params: {
  page: number
  pageSize: number
  SearchTitle?: string
  UserId: number
}): Promise<PagedData<CustomerRow>> {
  const keyword = (params.SearchTitle || '').trim()
  if (DEMO_MODE) {
    const rows = await demoCustomerList(keyword)
    return slicePage(rows, params.page, params.pageSize)
  }
  const res = await request<CustomerRow[]>({
    url: '/customerByUser',
    method: 'post',
    data: {
      UserId: params.UserId,
      page: Math.max(0, params.page - 1),
      pagesize: params.pageSize,
      ...(keyword ? { SearchTitle: keyword } : {})
    }
  })
  return toPaged(res)
}