/**
 * 警报（Alarm）接口
 * ============================================================
 * 已按真实接口实现（实测通），**不经过 mock 开关** —— 这些接口后端已经有了。
 *
 * ⚠️ 三个必须记住的点：
 *   1. **几乎全是 POST**（包括"查询"），CMP 的接口风格如此，不是 REST；
 *   2. 返回的 `data` 是**裸数组**，没有分页字段，分页在前端做（见 composables/useTableList）；
 *   3. 文档明确写了"int 不能为空字符串，要么不传要么传正确值"，
 *      所以参数里空值一律**整个字段省略**，不能传 `""`（见 compactParams）。
 *
 * 权限差异（文档原话）：
 *   - `/alarm`        → 只有**后端管理员**（Role=1）能用，查所有客户
 *   - `/alarmByUser`  → 普通账号用，只看自己关联公司的（身份由 token 决定；UserId 文档仍标必传，照传）
 *   - 删除            → 只有后端管理员有权限
 */
import { request } from './request'
import { toPaged, slicePage } from './paging'
import type { PagedData } from '@/composables/useTableList'
import { getSessionUserId, isAdmin } from '@/utils/session'
import {
  DEMO_MODE,
  demoAlarmDelete,
  demoAlarmDetail,
  demoAlarmList,
  demoAlarmSetStatus,
  demoAlarmSetUserStatus,
  demoAlarmUpdate
} from '@/demo'

/** 警报记录（字段名以接口为准，与旧站那套推送字段不是一回事） */
export interface AlarmRow {
  Id: number
  /** 警报编号 */
  SN: string
  ProductName: string | null
  ProductSN: string | null
  ProductLocation: string | null
  /** 传感器 */
  SensorDevice: string | null
  SensorDeviceSN: string | null
  CategoryId: number
  Description: string | null
  DescriptionEn: string | null
  /** 警报数值，值+单位一起存，如 "0.03m" */
  AlarmValue: string | null
  ConstSite: string | null
  ConstSiteZone: string | null
  Floor: number | null
  Lon: number | null
  Lat: number | null
  Location: string | null
  /** 1低 / 2中 / 3高 */
  Level: number | null
  ImageUrl: string | null
  VideoUrl: string | null
  Worker: string | null
  WorkerEn: string | null
  WorkerNFC: string | null
  CustomerId: number | null
  CustomerSN: string | null
  /** .NET 格式 "/Date(ms)/"，用 utils/format 的 parseServerDate 解析 */
  CreateTime: string
  UpdateTime: string
  AlarmTime: string
  /** 0 否 / 1 是 */
  FalsePositive: number
  /** 0 未处理 / 1 已处理 */
  ProcessStatus: number
  /** 0 显示 / 1 隐藏 */
  UserStatus: number
  /** 0 开启 / 1 关闭 */
  Status: number
  Remark: string | null
}

/** 查询条件（与接口字段同名；空值会被自动去掉） */
export interface AlarmQuery {
  /** 产品分类 Id，必传（值 1~7，见 config/menu.ts 的 ALARM_CATEGORY） */
  CategoryId: number
  /** 搜索：警报编号 / 产品名称 / 产品编号 / 传感器 / 传感器编号 */
  SearchTitle?: string
  FalsePositive?: number
  ProcessStatus?: number
  Level?: number
  UserStatus?: number
  Status?: number
  /** 与 EndTime 成对出现 */
  StartTime?: string
  EndTime?: string
}

/**
 * 去掉空值（undefined / null / ''），
 * 原因：后端对 int 字段不接受空字符串，传了就报"参数错误"。
 */
/**
 * 去掉空值参数（后端要求 int 不能传空字符串）
 * 用 `object` 而不是 `Record<string, unknown>` 作为约束：
 * 调用方普遍传的是 interface（没有索引签名），用 Record 会报
 * "Index signature for type 'string' is missing" 这种没意义的类型错。
 */
function compactParams(params: object): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') out[key] = value
  })
  return out
}

/**
 * 查询警报列表
 * ⚠️ 文档要求按角色分流：
 *   Role=1 后端管理员 → `/alarm`         跨客户看全部
 *   Role=0 普通账号   → `/alarmByUser`   只看自己关联公司的警报
 * 分流放在 api 层，页面不用感知。
 */
export async function getAlarmList(query: AlarmQuery): Promise<AlarmRow[]> {
  if (!isAdmin()) return getAlarmListByUser(query)
  if (DEMO_MODE) return demoAlarmList(query)
  const { data } = await request<AlarmRow[]>({
    url: '/alarm',
    method: 'post',
    data: compactParams(query)
  })
  return Array.isArray(data) ? data : []
}

/**
 * 查询警报列表（按登录账号，只看自己关联公司）
 *
 * ⚠️ `UserId` 仍然照传，原因：
 *   - 后端口头说「byUser 用 token 验证，UserId 传不传都没关系，只是用不到」；
 *   - 但 `alarmByUser.html` 文档表格里 `UserId` 仍标着「是否必须 = 是」。
 *   传一个用不到的字段没有任何副作用，而**不传**万一后端哪天加了必填校验就会炸。
 *   身份反正由 `Authorization` 头决定，这里传的只是让文档契约对得上。
 *   → 等文档把 `UserId` 改成非必须，这里再删。
 */
export async function getAlarmListByUser(query: AlarmQuery): Promise<AlarmRow[]> {
  if (DEMO_MODE) return demoAlarmList(query)
  const { data } = await request<AlarmRow[]>({
    url: '/alarmByUser',
    method: 'post',
    data: compactParams({ ...query, UserId: getSessionUserId() })
  })
  return Array.isArray(data) ? data : []
}

/** 查询单条警报（Id 与 SN 二选一，另一个传 0 / 空串） */
export async function getAlarmDetail(params: { Id?: number; SN?: string }): Promise<AlarmRow | null> {
  if (DEMO_MODE) return params.Id ? demoAlarmDetail(params.Id) : null
  const { data } = await request<AlarmRow>({
    url: '/alarmSingle',
    method: 'post',
    data: { Id: params.Id ?? 0, SN: params.SN ?? '' }
  })
  return data || null
}

/** 修改警报 —— 注意接口要求**这些字段全部必传**（不是只传要改的） */
export interface AlarmEditPayload {
  Id: number
  FalsePositive: number
  ProcessStatus: number
  UserStatus: number
  Status: number
  Remark: string
}

export async function updateAlarm(payload: AlarmEditPayload): Promise<void> {
  if (DEMO_MODE) return demoAlarmUpdate(payload)
  await request({
    url: '/alarmEdit',
    method: 'post',
    data: {
      Id: payload.Id,
      FalsePositive: payload.FalsePositive,
      ProcessStatus: payload.ProcessStatus,
      UserStatus: payload.UserStatus,
      Status: payload.Status,
      Remark: payload.Remark ?? ''
    }
  })
}

/** 批量设置隐藏/显示（接口收的是逗号分隔的字符串，不是数组） */
export async function setAlarmUserStatus(ids: number[], UserStatus: number): Promise<void> {
  if (DEMO_MODE) return demoAlarmSetUserStatus(ids, UserStatus)
  await request({
    url: '/alarmUserStatus',
    method: 'post',
    data: { IdArr: ids.join(','), UserStatus }
  })
}

/** 批量设置关闭/开启 */
export async function setAlarmStatus(ids: number[], Status: number): Promise<void> {
  if (DEMO_MODE) return demoAlarmSetStatus(ids, Status)
  await request({
    url: '/alarmStatus',
    method: 'post',
    data: { IdArr: ids.join(','), Status }
  })
}

/** 批量删除（文档明确：**只有后端管理员账号**有该权限） */
export async function deleteAlarms(ids: number[]): Promise<void> {
  if (DEMO_MODE) return demoAlarmDelete(ids)
  await request({
    url: '/alarmDeletes',
    method: 'post',
    data: { IdArr: ids.join(',') }
  })
}

/* ============================================================
 * 服务端分页版（2026-10-20 后端新增）
 * ============================================================
 * ⚠️ 后端 `page` 从 **0** 开始；这里的 `page` 从 **1** 开始，传之前统一 -1。
 * 空值处理沿用 compactParams（后端要求 int 不能传空字符串）。
 */
export async function getAlarmPage(
  query: AlarmQuery & { page: number; pageSize: number }
): Promise<PagedData<AlarmRow>> {
  if (!isAdmin()) {
    return getAlarmByUserPage(query)
  }
  if (DEMO_MODE) {
    const rows = await demoAlarmList(query)
    return slicePage(rows, query.page, query.pageSize)
  }
  const { page, pageSize, ...rest } = query
  const res = await request<AlarmRow[]>({
    url: '/alarm',
    method: 'post',
    data: {
      ...compactParams(rest),
      page: Math.max(0, page - 1),
      pagesize: pageSize
    }
  })
  return toPaged(res)
}

/** 普通账号分页查询自己公司的警报：POST /api/alarmByUser（UserId 照传，理由见 getAlarmListByUser） */
export async function getAlarmByUserPage(
  query: AlarmQuery & { page: number; pageSize: number }
): Promise<PagedData<AlarmRow>> {
  if (DEMO_MODE) {
    const rows = await demoAlarmList(query)
    return slicePage(rows, query.page, query.pageSize)
  }
  const { page, pageSize, ...rest } = query
  const res = await request<AlarmRow[]>({
    url: '/alarmByUser',
    method: 'post',
    data: {
      ...compactParams({ ...rest, UserId: getSessionUserId() }),
      page: Math.max(0, page - 1),
      pagesize: pageSize
    }
  })
  return toPaged(res)
}