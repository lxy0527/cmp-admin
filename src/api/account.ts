/**
 * 帐号（Account）接口
 * ============================================================
 * 对应 CMP Setting → **帳號管理**（旧站叫「帳號管理」，不是"用户管理"）。
 *
 * ⚠️ 接口能力有限，页面必须按这个约束设计（别做接口做不到的事）：
 *   1. **没有"删除账号"接口** —— 只有 注册(新增) / 改资料 / 改权限状态
 *   2. **改资料和改权限是两个接口**，字段不通用：
 *        - /userProfile 只改 Name / Tele / SN / Title
 *        - /userSet     只改 Permission / Status
 *      所以编辑弹窗要按"资料"和"权限状态"两块分别提交
 *   3. **改不了 UserName / Email / Password**（注册之后没有对应接口）
 *   4. 返回的 `Role` 是 0普通 / 1后端管理员；`Permission` 是 0普通 / 1客户管理
 *
 * 说明：旧站后台用的是 /api/cmp/account/*，字段更丰富（roleId / organizeId / 平台logo 等），
 * 但那套接口在公开文档里没有、且后端说会重写。这里先按**已文档化的公开接口**实现，
 * 等新接口给了只需要替换本文件。
 */
import { request } from './request'
import {
  DEMO_MODE,
  demoAccountCreate,
  demoAccountList,
  demoAccountUpdateProfile,
  demoAccountUpdateSetting
} from '@/demo'

/** 帐号记录（字段名与 /api/user 返回一致） */
export interface AccountRow {
  Id: number
  UserName: string
  Email: string | null
  Name: string | null
  Tele: string | null
  /** 0 普通账号 / 1 后端管理员 */
  Role: number
  /** 0 普通账号 / 1 客户管理 */
  Permission: number
  Head: string | null
  SN: string | null
  Title: string | null
  CreateTime: string
  UpdateTime: string
  /** 0 开启 / 1 关闭 */
  Status: number
}

/** 新增帐号（= 注册接口，文档原话："超级管理员添加账号也通用"） */
export interface AccountCreatePayload {
  UserName: string
  Email: string
  Password: string
  /** 可以为空字符串 */
  Tele?: string
}

/** 资料字段（只这些能改） */
export interface AccountProfilePayload {
  Id: number
  Name: string
  Tele: string
  SN: string
  Title: string
}

/** 权限 + 状态 */
export interface AccountSettingPayload {
  Id: number
  /** 0 普通 / 1 客户管理 */
  Permission: number
  /** 0 开启 / 1 关闭 */
  Status: number
}

/**
 * 帐号列表：POST /api/user
 * 搜索字段 SearchTitle 是**模糊匹配**，命中 账号 / 姓名 / Email 三者之一。
 */
export async function getAccountList(SearchTitle = ''): Promise<AccountRow[]> {
  if (DEMO_MODE) return demoAccountList(SearchTitle)
  const { data } = await request<AccountRow[]>({
    url: '/user',
    method: 'post',
    data: SearchTitle ? { SearchTitle } : {}
  })
  return Array.isArray(data) ? data : []
}

/** 查询单个帐号（Id / UserName / Email 三选一，其余传 0 或空串） */
export async function getAccountDetail(params: {
  Id?: number
  UserName?: string
  Email?: string
}): Promise<AccountRow | null> {
  if (DEMO_MODE) {
    const list = await demoAccountList('')
    return list.find((a) => a.Id === params.Id) ?? null
  }
  const { data } = await request<AccountRow>({
    url: '/userSingle',
    method: 'post',
    data: {
      Id: params.Id ?? 0,
      UserName: params.UserName ?? '',
      Email: params.Email ?? ''
    }
  })
  return data || null
}

/** 新增帐号：POST /api/userRegister */
export async function createAccount(payload: AccountCreatePayload): Promise<void> {
  if (DEMO_MODE) return demoAccountCreate(payload)
  await request({
    url: '/userRegister',
    method: 'post',
    data: {
      UserName: payload.UserName,
      Email: payload.Email,
      Password: payload.Password,
      Tele: payload.Tele ?? ''
    }
  })
}

/** 改资料：POST /api/userProfile（每个字段都要传，除 Id 外可为空） */
export async function updateAccountProfile(payload: AccountProfilePayload): Promise<void> {
  if (DEMO_MODE) return demoAccountUpdateProfile(payload)
  await request({
    url: '/userProfile',
    method: 'post',
    data: {
      Id: payload.Id,
      Name: payload.Name ?? '',
      Tele: payload.Tele ?? '',
      SN: payload.SN ?? '',
      Title: payload.Title ?? ''
    }
  })
}

/** 改权限+状态：POST /api/userSet */
export async function updateAccountSetting(payload: AccountSettingPayload): Promise<void> {
  if (DEMO_MODE) return demoAccountUpdateSetting(payload)
  await request({
    url: '/userSet',
    method: 'post',
    data: {
      Id: payload.Id,
      Permission: payload.Permission,
      Status: payload.Status
    }
  })
}
