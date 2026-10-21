/**
 * 演示模式（Demo Mode）
 * ============================================================
 * 为什么有这个东西：
 *   公网部署（Cloudflare Pages）**没有任何办法**访问内网接口（192.168.77.15），
 *   后端也还没给公网地址。为了能先把界面给需求方/客户看，这里内置一套示例数据。
 *
 * 开关：`VITE_DEMO_MODE=true`（只在 .env.production 打开，本地开发永远是真实数据）
 *
 * 三条原则（别破坏）：
 *   1. **绝不能让数据看起来像真的** —— 页面顶部常驻「演示数据」横幅，关不掉
 *   2. **增删改要真的生效**（内存里），否则别人点着点着就发现是假的，体验更差
 *   3. **不要污染开发环境** —— 本地 `npm run dev` 必须走真实接口
 *
 * 后端公网地址到位后：把 .env.production 的 VITE_DEMO_MODE 改成 false 即可，
 * 代码一行都不用删（各 api 模块里的分支会自动跳过）。
 */
import type { AlarmRow } from '@/api/alarm'
import type { AccountRow } from '@/api/account'
import type { PhotoArchiveRow, PhotoResourceRow } from '@/api/album'
import type { CustomerRow, CustomerUserRow } from '@/api/customer'

/** 是否处于演示模式 */
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

/** 演示模式下的统一延迟，让 loading / 分页效果看得见 */
const delay = (ms = 220) => new Promise((r) => setTimeout(r, ms))

/** 造一个后端那种 .NET 时间格式 */
const dotNetDate = (iso: string) => `/Date(${new Date(iso).getTime()})/`

/**
 * 演示用的内联图片（SVG data URL）—— 不依赖任何外部地址，离线也能显示。
 * 有真实图片才能验证"缩略图 + 点击放大"这条链路，否则详情页里永远是 `--`。
 */
const demoImage = (label: string, color: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400">` +
      `<rect width="640" height="400" fill="${color}"/>` +
      `<circle cx="520" cy="90" r="46" fill="rgba(255,255,255,.25)"/>` +
      `<text x="320" y="215" font-family="sans-serif" font-size="44" fill="#fff" text-anchor="middle">${label}</text>` +
      `<text x="320" y="262" font-family="sans-serif" font-size="20" fill="rgba(255,255,255,.8)" text-anchor="middle">CMP ALARM SNAPSHOT</text>` +
      `</svg>`
  )

/* ============================================================
 * 警报（7 个分类各给几条，保证每个页面都有东西看）
 * ============================================================ */

const ALARM_SEED: Array<Partial<AlarmRow> & { CategoryId: number; SN: string }> = [
  // 1 智能锁
  {
    CategoryId: 1,
    SN: 'LK-1003',
    ProductName: '智能锁',
    ProductSN: 'LOCK-03',
    SensorDevice: '智能锁 L01',
    SensorDeviceSN: 'L01',
    Description: '钢绳被剪',
    DescriptionEn: 'Wire cut',
    AlarmValue: null,
    ProductLocation: '一楼仓库门锁',
    Level: 3,
    Worker: '陈大文',
    WorkerEn: 'Chan Tai Man',
    WorkerNFC: 'NFC001'
  },
  {
    CategoryId: 1,
    SN: 'LK-1004',
    ProductName: '智能锁',
    ProductSN: 'LOCK-04',
    SensorDevice: '智能锁 L02',
    SensorDeviceSN: 'L02',
    Description: '非法开锁',
    DescriptionEn: 'Unauthorized unlock',
    AlarmValue: null,
    ProductLocation: '二楼电梯井安全锁',
    Level: 2,
    Worker: '李大明',
    WorkerEn: 'Lee Tai Ming',
    WorkerNFC: 'NFC002'
  },
  // 2 移动机械
  {
    CategoryId: 2,
    SN: 'MP-1001',
    ImageUrl: demoImage('MP-1001', '#3d8bfd'),
    ProductName: '挖机',
    ProductSN: 'N1001',
    SensorDevice: '监控M1',
    SensorDeviceSN: 'M1001',
    Description: '前方人员接近',
    DescriptionEn: 'Person approaching',
    AlarmValue: '0.03m',
    ProductLocation: '一楼A区',
    Level: 3,
    Worker: '黄志明',
    WorkerEn: 'Wong Chi Ming',
    WorkerNFC: 'NFC003'
  },
  {
    CategoryId: 2,
    SN: 'MP-1002',
    ImageUrl: demoImage('MP-1002', '#f5a623'),
    ProductName: '挖机',
    ProductSN: 'N1002',
    SensorDevice: '监控M2',
    SensorDeviceSN: 'M1002',
    Description: '高度超出',
    DescriptionEn: 'Height exceeded',
    AlarmValue: '8.22m',
    ProductLocation: '一楼B区',
    Level: 1
  },
  // 3 起重机
  {
    CategoryId: 3,
    SN: 'CR-2001',
    ProductName: '塔吊',
    ProductSN: 'CRANE-01',
    SensorDevice: '高度传感器',
    SensorDeviceSN: 'H01',
    Description: '吊重超载',
    DescriptionEn: 'Overload',
    AlarmValue: '12.5t',
    ProductLocation: 'B区吊装区',
    Level: 3
  },
  // 4 一线作业
  {
    CategoryId: 4,
    SN: 'FL-3001',
    ProductName: '智能安全帽',
    ProductSN: 'HELMET-01',
    SensorDevice: '安全帽',
    SensorDeviceSN: 'W01',
    Description: '人员紧急求助',
    DescriptionEn: 'Worker emergency SOS',
    AlarmValue: null,
    ProductLocation: 'Zone B',
    Level: 3,
    Worker: 'Peter Wong',
    WorkerEn: 'Peter Wong',
    WorkerNFC: 'NFC004'
  },
  // 5 AI 监控
  {
    CategoryId: 5,
    SN: 'AI-4001',
    ImageUrl: demoImage('AI-4001', '#10a394'),
    ProductName: 'AI 摄像头',
    ProductSN: 'CAM-AI-01',
    SensorDevice: 'AI Camera 01',
    SensorDeviceSN: 'A01',
    Description: '未佩戴安全帽',
    DescriptionEn: 'Safety helmet not detected',
    AlarmValue: '0.96',
    ProductLocation: 'Entrance A',
    Level: 2
  },
  // 6 密闭空间
  {
    CategoryId: 6,
    SN: 'CS-5001',
    ProductName: '多气体检测仪',
    ProductSN: 'GAS-01',
    SensorDevice: '四合一气体探头',
    SensorDeviceSN: 'G01',
    Description: '氧气浓度异常',
    DescriptionEn: 'Abnormal oxygen level',
    AlarmValue: '18.2%',
    ProductLocation: '密闭空间 1（B1）',
    Floor: -1,
    Level: 3
  },
  // 7 虚拟培训
  {
    CategoryId: 7,
    SN: 'VR-6001',
    ProductName: 'VR 培训终端',
    ProductSN: 'VR-01',
    SensorDevice: 'VR 终端',
    SensorDeviceSN: 'V01',
    Description: '高空作业培训合格',
    DescriptionEn: 'Working at height training passed',
    AlarmValue: '92',
    ProductLocation: '培训室',
    Level: 1
  }
]

/** 可变：让"修改/隐藏/关闭"在演示模式下真的能生效 */
const alarms: AlarmRow[] = ALARM_SEED.map((seed, index) => {
  const time = dotNetDate(`2026-10-${String(14 - (index % 5)).padStart(2, '0')}T09:${String(
    10 + index * 3
  ).padStart(2, '0')}:00`)
  return {
    Id: index + 1,
    SN: seed.SN,
    ProductName: seed.ProductName ?? null,
    ProductSN: seed.ProductSN ?? null,
    ProductLocation: seed.ProductLocation ?? null,
    SensorDevice: seed.SensorDevice ?? null,
    SensorDeviceSN: seed.SensorDeviceSN ?? null,
    CategoryId: seed.CategoryId,
    Description: seed.Description ?? null,
    DescriptionEn: seed.DescriptionEn ?? null,
    AlarmValue: seed.AlarmValue ?? null,
    ConstSite: '工会大厦',
    ConstSiteZone: 'A区',
    Floor: seed.Floor ?? 1,
    Lon: 114.13881,
    Lat: 22.49421,
    Location: '工会大厦东10m',
    Level: seed.Level ?? 1,
    ImageUrl: seed.ImageUrl ?? null,
    VideoUrl: seed.VideoUrl ?? null,
    Worker: seed.Worker ?? null,
    WorkerEn: seed.WorkerEn ?? null,
    WorkerNFC: seed.WorkerNFC ?? null,
    CustomerId: 1,
    CustomerSN: '6666',
    CreateTime: time,
    UpdateTime: time,
    AlarmTime: time,
    FalsePositive: 0,
    ProcessStatus: seed.CategoryId === 5 ? 1 : 0,
    UserStatus: 0,
    Status: 0,
    Remark: ''
  }
})

/** 按分类 + 几个常用条件过滤（模拟后端那套组合查询） */
export async function demoAlarmList(params: {
  CategoryId: number
  SearchTitle?: string
  Level?: number
  ProcessStatus?: number
  UserStatus?: number
  Status?: number
  StartTime?: string
  EndTime?: string
}): Promise<AlarmRow[]> {
  await delay()
  const keyword = (params.SearchTitle || '').trim().toLowerCase()
  return alarms.filter((a) => {
    if (a.CategoryId !== params.CategoryId) return false
    if (params.Level !== undefined && a.Level !== params.Level) return false
    if (params.ProcessStatus !== undefined && a.ProcessStatus !== params.ProcessStatus) return false
    if (params.UserStatus !== undefined && a.UserStatus !== params.UserStatus) return false
    if (params.Status !== undefined && a.Status !== params.Status) return false
    if (keyword) {
      const haystack = [a.SN, a.ProductName, a.ProductSN, a.SensorDevice, a.SensorDeviceSN]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(keyword)) return false
    }
    return true
  })
}

export async function demoAlarmUpdate(payload: {
  Id: number
  FalsePositive: number
  ProcessStatus: number
  UserStatus: number
  Status: number
  Remark: string
}): Promise<void> {
  await delay(160)
  const target = alarms.find((a) => a.Id === payload.Id)
  if (target) Object.assign(target, payload)
}

export async function demoAlarmSetUserStatus(ids: number[], userStatus: number): Promise<void> {
  await delay(160)
  alarms.forEach((a) => {
    if (ids.includes(a.Id)) a.UserStatus = userStatus
  })
}

export async function demoAlarmSetStatus(ids: number[], status: number): Promise<void> {
  await delay(160)
  alarms.forEach((a) => {
    if (ids.includes(a.Id)) a.Status = status
  })
}

/**
 * 单条警报详情（对应 `/alarmSingle`）
 * 详情页是"后端返回什么就显示什么"，所以这里返回完整的对象。
 */
export async function demoAlarmDetail(Id: number): Promise<AlarmRow | null> {
  await delay(180)
  const found = alarms.find((a) => a.Id === Id)
  return found ? { ...found } : null
}

/** 批量删除警报（对应 `/alarmDeletes`）
 * 演示模式下真的从数组里删掉，这样"删除"点完是看得见效果的，不是假成功。
 * 文档原话：删除只有**后端管理员**账号才有权限 —— 权限判断在前端只是显示控制，
 * 真正的把关必须由后端做。
 */
export async function demoAlarmDelete(ids: number[]): Promise<void> {
  await delay(200)
  ids.forEach((id) => {
    const i = alarms.findIndex((a) => a.Id === id)
    if (i > -1) alarms.splice(i, 1)
  })
}

/* ============================================================
 * 帐号
 * ============================================================ */

const accounts: AccountRow[] = [
  {
    Id: 1,
    UserName: 'admin',
    Email: '632035276@qq.com',
    Name: '管理員',
    Tele: '13600000001',
    Role: 1,
    Permission: 1,
    Head: null,
    SN: 'A001',
    Title: '系統管理員',
    CreateTime: dotNetDate('2026-07-01T10:00:00'),
    UpdateTime: dotNetDate('2026-07-01T10:00:00'),
    Status: 0
  },
  {
    Id: 1001,
    UserName: 'user01',
    Email: '1222@qq.com',
    Name: '翟先生',
    Tele: '13622222222',
    Role: 0,
    Permission: 1,
    Head: null,
    SN: 'U001',
    Title: '現場主管',
    CreateTime: dotNetDate('2026-07-08T14:20:00'),
    UpdateTime: dotNetDate('2026-07-08T14:20:00'),
    Status: 0
  },
  {
    Id: 1002,
    UserName: 'kccm_data',
    Email: 'data@kccm.com.hk',
    Name: 'KCCM Data',
    Tele: '13633333333',
    Role: 0,
    Permission: 0,
    Head: null,
    SN: 'U002',
    Title: '資料員',
    CreateTime: dotNetDate('2026-08-03T09:12:00'),
    UpdateTime: dotNetDate('2026-08-03T09:12:00'),
    Status: 1
  }
]

export async function demoAccountList(SearchTitle = ''): Promise<AccountRow[]> {
  await delay()
  const k = SearchTitle.trim().toLowerCase()
  if (!k) return [...accounts]
  return accounts.filter((a) =>
    [a.UserName, a.Name, a.Email].filter(Boolean).join(' ').toLowerCase().includes(k)
  )
}

export async function demoAccountCreate(payload: {
  UserName: string
  Email: string
  Tele?: string
}): Promise<void> {
  await delay(200)
  accounts.unshift({
    Id: Math.max(...accounts.map((a) => a.Id)) + 1,
    UserName: payload.UserName,
    Email: payload.Email,
    Name: null,
    Tele: payload.Tele || null,
    Role: 0,
    Permission: 0,
    Head: null,
    SN: null,
    Title: null,
    CreateTime: dotNetDate(new Date().toISOString()),
    UpdateTime: dotNetDate(new Date().toISOString()),
    Status: 0
  })
}

export async function demoAccountUpdateProfile(payload: {
  Id: number
  Name: string
  Tele: string
  SN: string
  Title: string
}): Promise<void> {
  await delay(160)
  const t = accounts.find((a) => a.Id === payload.Id)
  if (t) Object.assign(t, payload)
}

export async function demoAccountUpdateSetting(payload: {
  Id: number
  Permission: number
  Status: number
}): Promise<void> {
  await delay(160)
  const t = accounts.find((a) => a.Id === payload.Id)
  if (t) {
    t.Permission = payload.Permission
    t.Status = payload.Status
  }
}

/**
 * 注册页用的账号占用校验（对应接口 `/userUnRegister`）
 * 返回 true = 可以注册；false = 系统保留/已存在
 */
export async function demoCheckAccountAvailable(UserName: string): Promise<boolean> {
  await delay(200)
  const name = UserName.trim().toLowerCase()
  if (!name) return false
  // 演示环境：占位几个"系统保留"的名字，方便看到失败分支
  if (['admin', 'vision', 'root', 'system'].includes(name)) return false
  return !accounts.some((a) => a.UserName.toLowerCase() === name)
}

/** 注册（对应接口 `/userRegister`）：演示模式下真的会出现在账号列表里 */
export async function demoRegister(payload: {
  UserName: string
  Email: string
  Password: string
  Tele?: string
}): Promise<void> {
  await delay(260)
  accounts.push({
    Id: Math.max(...accounts.map((a) => a.Id)) + 1,
    UserName: payload.UserName,
    Email: payload.Email,
    Name: null,
    Tele: payload.Tele || null,
    Role: 0,
    Permission: 0,
    Head: null,
    SN: null,
    Title: null,
    CreateTime: dotNetDate(new Date().toISOString()),
    UpdateTime: dotNetDate(new Date().toISOString()),
    Status: 0
  })
}

/* ============================================================
 * 照片墙：档案 + 资源
 * ============================================================ */

const archives: PhotoArchiveRow[] = [
  {
    Id: 2,
    Name: '机械设备',
    UserId: 1,
    FolderName: '01bdce22-ef57-4a74-883b-6528530837bf',
    CreateTime: dotNetDate('2026-07-10T12:18:05'),
    UpdateTime: dotNetDate('2026-07-10T12:18:05')
  },
  {
    Id: 1,
    Name: '警报拍照',
    UserId: 1,
    FolderName: '50988395-f502-468c-8016-4c7324b14a4d',
    CreateTime: dotNetDate('2026-07-10T12:16:50'),
    UpdateTime: dotNetDate('2026-07-10T12:16:50')
  },
  {
    Id: 3,
    Name: '工地现场',
    UserId: 1001,
    FolderName: 'demo-folder-construction-site',
    CreateTime: dotNetDate('2026-08-01T08:30:00'),
    UpdateTime: dotNetDate('2026-08-01T08:30:00')
  }
]

const resources: Array<PhotoResourceRow & { AlbumId: number }> = [
  {
    Id: 1,
    AlbumId: 2,
    Name: '挖机',
    URL: '/user/01bdce22-ef57-4a74-883b-6528530837bf/e5b6fa68-eec7-4d31-84d9-b745d923ef31.png'
  },
  {
    Id: 3,
    AlbumId: 2,
    Name: 'QQ20260714-122602',
    URL: '/user/01bdce22-ef57-4a74-883b-6528530837bf/ee334b7a-a38a-473a-ae51-8566be4f2bff.png'
  },
  {
    Id: 4,
    AlbumId: 2,
    Name: 'VCG41N1149247392',
    URL: '/user/01bdce22-ef57-4a74-883b-6528530837bf/34185338-4fd7-4e6a-b670-ebd6f05414f2.jpg'
  },
  {
    Id: 5,
    AlbumId: 1,
    Name: '警报现场-01',
    URL: '/user/50988395-f502-468c-8016-4c7324b14a4d/demo-01.jpg'
  },
  {
    Id: 6,
    AlbumId: 3,
    Name: '工地全景',
    URL: '/user/demo-folder-construction-site/demo-panorama.jpg'
  }
]

export async function demoArchiveList(SearchTitle = ''): Promise<PhotoArchiveRow[]> {
  await delay()
  const k = SearchTitle.trim().toLowerCase()
  if (!k) return [...archives]
  return archives.filter((a) => a.Name.toLowerCase().includes(k))
}

export async function demoArchiveCreate(UserId: number, Name: string): Promise<void> {
  await delay(200)
  archives.unshift({
    Id: Math.max(...archives.map((a) => a.Id)) + 1,
    Name,
    UserId,
    FolderName: `demo-folder-${Date.now()}`,
    CreateTime: dotNetDate(new Date().toISOString()),
    UpdateTime: dotNetDate(new Date().toISOString())
  })
}

export async function demoArchiveUpdate(Id: number, Name: string): Promise<void> {
  await delay(160)
  const t = archives.find((a) => a.Id === Id)
  if (t) t.Name = Name
}

export async function demoArchiveDelete(Id: number): Promise<void> {
  await delay(160)
  const i = archives.findIndex((a) => a.Id === Id)
  if (i > -1) archives.splice(i, 1)
}

export async function demoResourceList(AlbumId: number, SearchTitle = ''): Promise<PhotoResourceRow[]> {
  await delay()
  const k = SearchTitle.trim().toLowerCase()
  return resources
    .filter((r) => r.AlbumId === AlbumId)
    .filter((r) => !k || r.Name.toLowerCase().includes(k))
    .map(({ AlbumId: _ignored, ...row }) => row)
}

export async function demoResourceUpdate(Id: number, Name: string): Promise<void> {
  await delay(160)
  const t = resources.find((r) => r.Id === Id)
  if (t) t.Name = Name
}

export async function demoResourceSetStatusPlaceholder(): Promise<void> {
  // 占位：接口里没有"图片状态"字段，保留函数位方便以后扩展
}

/**
 * 演示模式的上传：直接用 `URL.createObjectURL` 生成真实可显示的图片地址，
 * 所以上传完列表里**真的能看到那张图**，不是假占位。
 */
export async function demoResourceUpload(AlbumId: number, files: File[]): Promise<void> {
  await delay(320)
  let id = resources.reduce((max, r) => Math.max(max, r.Id), 0) + 1
  files.forEach((file) => {
    let url = ''
    try {
      url = URL.createObjectURL(file)
    } catch {
      url = ''
    }
    resources.push({
      Id: id++,
      AlbumId,
      Name: file.name,
      URL: url
    })
  })
}

/**
 * 演示模式的替换图片（对应 `/albumImageReplace`）
 * 用新的 objectURL 顶掉旧 URL —— 列表里**一眼能看出图换了**。
 * （真实后端是"原地覆盖、URL 不变"，那种情况前端靠时间戳破缓存，见 PhotoContent.vue 的 imgSrc）
 */
export async function demoResourceReplace(Id: number, file: File): Promise<void> {
  await delay(260)
  const target = resources.find((r) => r.Id === Id)
  if (!target) return
  try {
    target.URL = URL.createObjectURL(file)
  } catch {
    /* ignore */
  }
}

export async function demoResourceDelete(ids: number[]): Promise<void> {
  await delay(160)
  ids.forEach((id) => {
    const i = resources.findIndex((r) => r.Id === id)
    if (i > -1) resources.splice(i, 1)
  })
}

/* ============================================================
 * 分页压测数据（只在 VITE_DEMO_BULK=true 时注入）
 * ============================================================
 * 目的：验证"服务端分页"在前端的表现 —— 多页翻页、改页大小、删到空页。
 * 默认关闭，所以生产演示站的数据量不变；测试时用
 *   $env:VITE_DEMO_BULK='true'; npm run build
 * 然后把 dist 部到预览分支，不污染生产。
 */
if (import.meta.env.VITE_DEMO_BULK === 'true') {
  // ① 往「机械设备」相册塞 30 张，凑出多页
  for (let i = 1; i <= 30; i++) {
    resources.push({
      Id: 1000 + i,
      AlbumId: 2,
      Name: `批量測試圖片-${String(i).padStart(2, '0')}`,
      URL: demoImage(`BULK-${i}`, i % 2 ? '#7c8db5' : '#5aa9a2')
    })
  }
  // ② 往「移动机械」分类（CategoryId=2）塞 25 条警报
  for (let i = 1; i <= 25; i++) {
    const t = dotNetDate(`2026-09-${String((i % 28) + 1).padStart(2, '0')}T08:00:00`)
    alarms.push({
      Id: 2000 + i,
      SN: `BULK-${String(i).padStart(3, '0')}`,
      ProductName: '挖机',
      ProductSN: `N${2000 + i}`,
      ProductLocation: `一楼${i}区`,
      SensorDevice: '监控M9',
      SensorDeviceSN: 'M9',
      CategoryId: 2,
      Description: `批量測試警報 ${i}`,
      DescriptionEn: `Bulk test alarm ${i}`,
      AlarmValue: `${i}.00m`,
      ConstSite: '工会大厦',
      ConstSiteZone: 'A区',
      Floor: 1,
      Lon: 114.13881,
      Lat: 22.49421,
      Location: '工会大厦东10m',
      Level: ((i % 3) + 1) as 1 | 2 | 3,
      ImageUrl: null,
      VideoUrl: null,
      Worker: null,
      WorkerEn: null,
      WorkerNFC: null,
      CustomerId: 1,
      CustomerSN: '6666',
      CreateTime: t,
      UpdateTime: t,
      AlarmTime: t,
      FalsePositive: 0,
      ProcessStatus: 0,
      UserStatus: 0,
      Status: 0,
      Remark: ''
    })
  }
}

/* ============================================================
 * 客户 + 客户关联账号
 * ============================================================
 * ⚠️ 参考图上有「审批信息 / 第几步审批」，但**接口里完全没有这些字段**
 * （那是旧 .NET 后台的审批流概念）。这里不编造假字段，页面也不显示。
 */

const customers: CustomerRow[] = [
  {
    Id: 1,
    Company: '洪昌泥井有限公司',
    SN: '2026091614470963462',
    Manager: '王某某',
    Tele: '12345678',
    Logo: null,
    Remark: '長期合作',
    CreateTime: dotNetDate('2026-07-16T09:20:00'),
    UpdateTime: dotNetDate('2026-09-01T14:23:00'),
    Status: 0
  },
  {
    Id: 2,
    Company: '金力鋼結構有限公司',
    SN: '2026082110345508127',
    Manager: '李經理',
    Tele: '87654321',
    Logo: null,
    Remark: '',
    CreateTime: dotNetDate('2026-08-01T10:34:00'),
    UpdateTime: dotNetDate('2026-08-01T10:34:00'),
    Status: 0
  },
  {
    Id: 3,
    Company: '聲馳工程',
    SN: '2026080515222003391',
    Manager: '陳主管',
    Tele: '23334444',
    Logo: null,
    Remark: '已完結項目',
    CreateTime: dotNetDate('2026-07-05T15:22:00'),
    UpdateTime: dotNetDate('2026-09-20T08:00:00'),
    Status: 1
  }
]

const customerUsers: CustomerUserRow[] = [
  { Id: 1, CustomerId: 1, UserId: 1, Name: 'admin', UserName: 'admin', Status: 0 },
  { Id: 2, CustomerId: 1, UserId: 1001, Name: '翟先生', UserName: 'user01', Status: 0 },
  { Id: 3, CustomerId: 1, UserId: 1002, Name: null, UserName: 'user02', Status: 0 },
  { Id: 4, CustomerId: 2, UserId: 1002, Name: 'KCCM Data', UserName: 'kccm_data', Status: 0 },
  { Id: 5, CustomerId: 3, UserId: 1001, Name: '翟先生', UserName: 'user01', Status: 1 }
]

const nextId = (list: Array<{ Id: number }>) =>
  list.reduce((max, r) => Math.max(max, r.Id), 0) + 1

export async function demoCustomerList(SearchTitle = ''): Promise<CustomerRow[]> {
  await delay()
  const k = SearchTitle.trim().toLowerCase()
  if (!k) return [...customers]
  return customers.filter((c) =>
    [c.Company, c.SN, c.Manager].filter(Boolean).join(' ').toLowerCase().includes(k)
  )
}

export async function demoCustomerCreate(payload: {
  Company: string
  SN: string
  Manager?: string
  Tele?: string
  Logo?: string
  Remark?: string
}): Promise<void> {
  await delay(220)
  const now = dotNetDate(new Date().toISOString())
  customers.unshift({
    Id: nextId(customers),
    Company: payload.Company,
    SN: payload.SN,
    Manager: payload.Manager || null,
    Tele: payload.Tele || null,
    Logo: payload.Logo || null,
    Remark: payload.Remark || '',
    CreateTime: now,
    UpdateTime: now,
    Status: 0
  })
}

export async function demoCustomerUpdate(payload: {
  Id: number
  Company: string
  SN: string
  Manager?: string
  Tele?: string
  Logo?: string
  Remark?: string
  Status: number
}): Promise<void> {
  await delay(180)
  const t = customers.find((c) => c.Id === payload.Id)
  if (t) {
    t.Company = payload.Company
    t.SN = payload.SN
    t.Manager = payload.Manager || null
    t.Tele = payload.Tele || null
    t.Logo = payload.Logo || null
    t.Remark = payload.Remark || ''
    t.Status = payload.Status
    t.UpdateTime = dotNetDate(new Date().toISOString())
  }
}

export async function demoCustomerDelete(ids: number[]): Promise<void> {
  await delay(180)
  ids.forEach((id) => {
    const i = customers.findIndex((c) => c.Id === id)
    if (i > -1) customers.splice(i, 1)
  })
  // 客户删了，挂在他下面的关联账号也一并清掉（真实后端大概也是这个行为）
  ids.forEach((id) => {
    for (let i = customerUsers.length - 1; i >= 0; i--) {
      if (customerUsers[i].CustomerId === id) customerUsers.splice(i, 1)
    }
  })
}

export async function demoCustomerSetStatus(ids: number[], Status: number): Promise<void> {
  await delay(180)
  customers.forEach((c) => {
    if (ids.includes(c.Id)) c.Status = Status
  })
}

export async function demoCustomerUserList(
  CustomerId: number,
  SearchTitle = ''
): Promise<CustomerUserRow[]> {
  await delay()
  const k = SearchTitle.trim().toLowerCase()
  return customerUsers
    .filter((u) => u.CustomerId === CustomerId)
    .filter((u) => !k || [u.UserName, u.Name].filter(Boolean).join(' ').toLowerCase().includes(k))
}

export async function demoCustomerUserCreate(payload: {
  CustomerId: number
  UserId: number
  UserName: string
  Name?: string
}): Promise<void> {
  await delay(200)
  customerUsers.push({
    Id: nextId(customerUsers),
    CustomerId: payload.CustomerId,
    UserId: payload.UserId,
    Name: payload.Name || null,
    UserName: payload.UserName,
    Status: 0
  })
}

export async function demoCustomerUserUpdate(payload: {
  Id: number
  Name?: string
  Status: number
}): Promise<void> {
  await delay(160)
  const t = customerUsers.find((u) => u.Id === payload.Id)
  if (t) {
    t.Name = payload.Name || null
    t.Status = payload.Status
  }
}

export async function demoCustomerUserDelete(ids: number[]): Promise<void> {
  await delay(160)
  ids.forEach((id) => {
    const i = customerUsers.findIndex((u) => u.Id === id)
    if (i > -1) customerUsers.splice(i, 1)
  })
}

export async function demoCustomerUserSetStatus(ids: number[], Status: number): Promise<void> {
  await delay(160)
  customerUsers.forEach((u) => {
    if (ids.includes(u.Id)) u.Status = Status
  })
}
