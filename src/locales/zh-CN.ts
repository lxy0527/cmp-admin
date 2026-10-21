/**
 * 简体中文
 * ============================================================
 * ⚠️ 不是繁体→简体的字形转换！港式用语与内地用语差别很大，本文件按内地用词重写：
 *     地盤 → 工地         承辦商 → 承包商      資訊 → 信息
 *     升降機 → 电梯        吊機 → 起重机/吊车   搜尋 → 搜索
 *     重設 → 重置         報警 → 报警          帳號 → 账号
 *     檔案 → 档案         資源 → 资源          標記隱藏 → 标记隐藏
 *   详见随文件提交的术语对照（docs/术语表.md）。发现译法不对请直接改这里。
 *
 * 菜单名保持英文（Permit to Work / E-Lock and Key Sys …）——
 * 后端已给出一套中文译名（工作许可证系统 / 智能锁安全管控系统 …），
 * 但那套是**给后端文档用**的命名，界面上仍沿用旧站英文菜单名，待需求方最终拍板。
 */
export default {
  common: {
    confirm: '确定',
    cancel: '取消',
    reset: '重置',
    search: '搜索',
    query: '查询',
    submit: '提交',
    delete: '删除',
    edit: '编辑',
    add: '新增',
    save: '保存',
    back: '返回',
    export: '导出',
    detail: '详情',
    refresh: '刷新',
    operation: '操作',
    status: '状态',
    enabled: '启用',
    disabled: '禁用',
    open: '开启',
    close: '关闭',
    pleaseSelect: '请选择',
    pleaseInput: '请输入',
    loading: '加载中...',
    success: '成功',
    failed: '失败',
    operationSuccess: '操作成功',
    operationFailed: '操作失败',
    deleteConfirm: '确定要删除吗？',
    deleteSuccess: '删除成功',
    deleteFailed: '删除失败',
    loadFailed: '加载失败',
    retry: '重试',
    saveSuccess: '保存成功',
    saveFailed: '保存失败',
    formValidationFailed: '请检查表单填写是否正确',
    warmTip: '温馨提示',
    unknown: '未知',
    total: '共 {total} 条记录',
    records: '条',
    selected: '已选中',
    noData: '暂无数据',
    yes: '是',
    no: '否',
    empty: '--',
    weekdays: {
      0: '星期日',
      1: '星期一',
      2: '星期二',
      3: '星期三',
      4: '星期四',
      5: '星期五',
      6: '星期六'
    }
  },

  status: {
    normal: '正常',
    device: {
      normal: '正常',
      repairing: '维修中',
      deactivated: '停用',
      departure: '离场'
    },
    certificate: {
      normal: '正常',
      expiring: '即将过期',
      expired: '已经过期',
      unconfigured: '未设置证书'
    },
    permit: {
      pendingApproval: '等待审批',
      pendingAcceptance: '等待接受',
      accepted: '接受许可',
      completed: '完成工作',
      permitCompleted: '许可证完结',
      overtime: '工序超时',
      cancellationRequested: '申请注销',
      unknown: '未知'
    },
    recordRange: {
      day1: '过往1天记录',
      day7: '过往7天记录',
      day30: '过往30天记录',
      day30to60: '过往30-60天记录',
      day60to90: '过往60-90天记录'
    }
  },

  menu: {
    dashboard: '4S Dash Board',
    dataReceiving: 'Data Receiving',
    cmpSetting: 'CMP Setting',
    dataReceivingItems: {
      permitToWork: 'Permit to Work',
      digitizedTracking: 'Digitized Tracking',
      eLockAndKeySys: 'E-Lock and Key Sys',
      unsafeActsMobilePlant: 'Unsafe acts Mobile Plant',
      unsafeActsCraneLifting: 'Unsafe acts Crane Lifting',
      smartMonitoringForFrontline: 'Smart Monitoring for Frontline',
      safetyMonitoringSysUsingAI: 'Safety Monitoring Sys. Using AI',
      confinedSpaceMonitoring: 'Confined Space Monitoring',
      vrTraining: 'VR Training'
    },
    cmpSettingItems: {
      role: '角色管理',
      accountManagement: '账号管理',
      customerManagement: '客户管理',
      photoWall: '照片墙档案管理',
      photoContent: '照片墙资源管理',
      pushAddress: '推送地址'
    }
  },

  navigationBar: {
    switchOrganize: '切换组织结构',
    currentOrganize: '当前机构',
    changePassword: '重置密码',
    logout: '退出登录',
    logoutConfirmTitle: '确认退出',
    logoutConfirmMessage: '确定要退出登录吗？'
  },

  /** 演示模式横幅（公网部署连接不到内网接口时使用） */
  demo: {
    banner:
      '演示模式：本页数据为内置示例数据，未连接真实接口。（原因：后端接口仅在公司内网 192.168.77.15，尚未提供公网地址；前端已就绪，接口一到位即可切换为真实数据）'
  },

  /** 注册 / 找回密码 */
  authPage: {
    registerTitle: '注册账号',
    registerSubtitle: '创建一个新的登录账号',
    forgotTitle: '找回密码',
    forgotSubtitle: '重置你的登录密码',
    account: '登录账户',
    email: 'Email',
    password: '登录密码',
    confirmPassword: '确认密码',
    tele: '手机号（选填）',
    submitRegister: '注册',
    submitForgot: '提交',
    backToLogin: '返回登录',
    noAccount: '还没有账号？',
    goRegister: '立即注册',
    forgotPassword: '忘记密码？',
    accountRequired: '请输入登录账户',
    emailRequired: '请输入 Email',
    emailInvalid: 'Email 格式不正确',
    passwordRequired: '请输入密码',
    passwordTooShort: '密码至少 6 位',
    passwordMismatch: '两次输入的密码不一致',
    verifyCode: '验证码',
    verifyCodePlaceholder: '请输入邮箱收到的验证码',
    sendCode: '发送验证码',
    codeSent: '验证码已发送，请查收邮箱（10 分钟内有效）',
    codeSendFailed: '验证码发送失败',
    verifyCodeRequired: '请输入验证码',
    sendCodeFirst: '请先点「发送验证码」',
    changePwdTitle: '修改密码',
    changePwdSubtitle: '通过邮箱验证码重置登录密码',
    newPassword: '新密码',
    submitChangePwd: '确认修改',
    verifyCodeLength: '验证码为 6 位',
    changePwdSuccess: '密码已修改，请用新密码登录',
    changePwdFailed: '修改失败',    accountReserved: '该账户为系统保留或已被占用，请换一个',
    registerSuccess: '注册成功，请使用新账号登录',
    registerFailed: '注册失败',
    forgotNoApi: '后端尚未提供「找回密码」接口（接口文档中没有此项），本页仅为界面预留，不会真的发送邮件。',
    forgotHint: '如需重置密码，请联系管理员在后台处理。',
    forgotSubmitted: '当前环境无法自助找回，请联系管理员。'
  },

  login: {
    title: '系统登录',
    username: '用户名',
    password: '密码',
    submit: '登录',
    loading: '登录中...',
    usernameRequired: '请输入用户名',
    passwordRequired: '请输入密码',
    failed: '登录失败',
    demoHint: '演示账号：admin / 123456'
  },

  /** 顶栏信息条（目前是静态展示，接接口后值再换） */
  topbar: {
    projectType: '项目类型',
    projectNo: '工程编号',
    environmentMonitoring: '微网环境监测',
    gateway: '网关',
    windSpeed: '风速',
    productionDate: '生产日期',
    feelsLike: '体感温度',
    humidity: '湿度',
    lunar: '农历',
    alarmNotice: '报警通知',
    unprocessedAlarm: '未处理报警',
    maintenance: '注册总保养'
  },

  /** 角色管理 */
  role: {
    name: '角色名称',
    description: '角色描述',
    permission: '角色权限',
    createTime: '创建时间',
    inputName: '请输入角色名称',
    inputDescription: '请输入角色描述',
    addTitle: '新增角色',
    editTitle: '修改角色',
    deleteConfirm: '确定要删除角色「{name}」吗？',
    mockNote: '此模块后端尚未提供接口（旧站接口无文档），目前为演示数据。'
  },

  /** 许可作业（Permit to Work） */
  permitWork: {
    title: '许可作业列表',
    columns: {
      permitId: '许可ID',
      workPermitNo: '工作单编号',
      permitType: '许可证类型',
      status: '许可状态',
      modelContent: '模型内容',
      applicant: '许可申请人',
      applyDate: '申请时间'
    },
    filters: {
      permitArea: '许可作业区域',
      permitType: '许可证类型',
      company: '许可批准申请',
      dateRange: '申请日期'
    },
    exportPlaceholder: '导出任务已提交（占位，等接口就绪后接真实导出）',
    mockNote: '此模块后端尚未提供接口（后端文档问题 2 已确认），目前为演示数据。'
  },

  dashboard: {
    title: '系统监控概览',
    realtime: '实时监控',
    onlineRate: '设备在线率',
    /** 报警实时推送（WebSocket） */
    live: {
      title: '实时推送',
      on: '已连接',
      simulating: '模拟推送',
      closed: '已断开',
      connecting: '连接中',
      disabled: '未配置',
      alarmTitle: '新报警',
      received: '本次已收到 {count} 条',
      lastAt: '最近：{time}',
      disabledHint: '未配置 WebSocket 地址（VITE_WS_URL），无法接收实时报警。'
    },
    /** 首页 4 个统计卡（按旧站设计稿的指标名，口径待需求方确认） */
    cards: {
      offline: '离线设备',
      alarm: '未处理报警',
      online: '在线人员',
      site: '在建工地'
    },
    /** 系统监控概览环形图的图例 */
    monitor: {
      online: '在线设备',
      offline: '离线设备',
      alarm: '告警设备'
    },
    deviceTotal: '设备总数',
    repairingDeviceTotal: '维修中设备总数',
    certificateExpiringIn7DaysDevice: '7天内证书到期设备',
    expiredCertificateDevice: '已过期证书设备',
    todayPermitTotal: '今日许可证总数',
    todayActivePermitTotal: '今日进行中许可证总数',
    todayCompletedPermitTotal: '今日已完成许可证总数',
    todayExpiredPermitTotal: '今日过期许可证总数',
    todayNormalUnlockTotal: '今日正常开锁总数',
    lowPowerDeviceTotal: '低电量设备总数',
    todayAbnormalUnlockDeviceTotal: '今日异常解锁设备总数',
    currentOnlineTotal: '当前在线总数',
    currentOfflineTotal: '当前离线总数',
    todayActiveDeviceTotal: '今日活跃设备总数',
    todayAlertTotal: '今日报警总数',
    todayAlertNotificationTotal: '今日报警区通知总数',
    staffSosAlert: '员工求救报警',
    abnormalPhysicalCondition: '异常身体状况',
    processedWarningCount: '已处理警告数量',
    dailyAlertTotal: '当天报警总数',
    confinedSpacePersonnelTotal: '密闭空间人员总数',
    confinedSpacePersonnelUnwell: '密闭空间人员不适',
    confinedSpaceSafetyLevel: '密闭空间安全水平',
    dailyTrainingConducted: '当天是否进行训练',
    dailyQualifiedPersonnelTotal: '当天合格人员总数',
    dailyUnqualifiedPersonnelTotal: '当天不合格人员总数',
    has: '有',
    hasNot: '无',
    safe: '安全',
    danger: '危险',
    fetchDataFailed: '获取数据失败，请稍后重试'
  },

  alarm: {
    tabs: {
      receiveList: '报警记录接收清单',
      correctionList: '报警记录修正清单',
      displaySetting: 'CMP显示设置'
    },
    columns: {
      alarmId: '报警事件唯一编号',
      deviceId: '设备编号',
      deviceName: '设备名称',
      deviceType: '设备类别代码',
      machineId: '机械系统编号',
      machineName: '机械名称',
      machineType: '机械类型',
      machineModel: '机械型号',
      machineSN: '机械注册编号',
      category4S: '4S类别',
      alarmTime: '报警时间',
      alarmType: '报警类型代码',
      alarmDescChi: '报警描述(中文)',
      alarmDescEng: '报警描述(英文)',
      alarmValue: '报警数值',
      mlat: '报警发生的纬度',
      mlng: '报警发生的经度',
      siteAddress: '工地名称',
      siteFloor: '工地楼层',
      alertLocation: '警报位置',
      picUrl: '报警抓拍照片',
      videoUrl: '报警视频',
      staffRegID: '员工NFC编号',
      staffEname: '员工英文名',
      staffCname: '员工中文名'
    },
    /** 字段名以**接口为准**（`/api/alarm` 实际返回的字段），不是旧站那套推送字段 */
    fields: {
      sn: '报警编号',
      productName: '产品名称',
      productSN: '产品编号',
      productLocation: '产品位置',
      sensorDevice: '传感器',
      sensorDeviceSN: '传感器编号',
      categoryId: '分类',
      description: '报警详情描述',
      descriptionEn: '报警详情描述(英文)',
      alarmValue: '报警数值',
      constSite: '工地',
      constSiteZone: '工地区域',
      floor: '楼层',
      lon: '经度',
      lat: '纬度',
      location: '报警详细位置',
      level: '报警等级',
      imageUrl: '图片',
      videoUrl: '视频',
      worker: '员工',
      workerEn: '员工英文名',
      workerNFC: '员工NFC',
      customerId: '客户Id',
      customerSN: '客户编码',
      alarmTime: '报警时间',
      falsePositive: '是否误报',
      processStatus: '处理状态',
      userStatus: '用户状态',
      status: '状态',
      remark: '备注',
      createTime: '创建时间',
      updateTime: '更新时间'
    },
    levels: {
      1: '1级（低风险）',
      2: '2级（中风险）',
      3: '3级（高风险）'
    },
    yesNo: {
      yes: '是',
      no: '否'
    },
    processStatus: {
      0: '未处理',
      1: '已处理'
    },
    userStatus: {
      0: '显示',
      1: '隐藏'
    },
    recordStatus: {
      0: '开启',
      1: '关闭'
    },
    editTitle: '修改报警',
    editSuccess: '报警修改成功',
    editFailed: '报警修改失败',
    selectRowsFirst: '请先选择记录',
    filters: {
      alarmId: '报警事件唯一编号',
      deviceId: '设备编号',
      deviceName: '设备名称',
      deviceType: '设备类别代码',
      machineId: '机械系统编号',
      alarmType: '报警类型代码',
      siteAddress: '工地名称',
      siteFloor: '工地楼层',
      staffName: '员工姓名',
      dateRange: '报警时间'
    },
    actions: {
      markHide: '标记隐藏',
      revokeHide: '撤销隐藏',
      open: '开启',
      close: '关闭',
      viewVideo: '查看视频',
      videoPreview: '视频预览',
      delete: '删除'
    },
    detailTitle: '报警详情',
    otherFields: '其他字段（后端额外返回）',
    imageLoadFailed: '图片加载失败',
    clickToZoom: '点击放大',
    messages: {
      pleaseSelectRecords: '请先选择要{action}的记录',
      confirmMarkHide: '确定要{action}选中的 {count} 条记录吗？',
      markHideSuccess: '标记隐藏成功',
      revokeHideSuccess: '撤销隐藏成功',
      markHideFailed: '标记隐藏失败',
      revokeHideFailed: '撤销隐藏失败',
      statusModifiedFailed: '状态修改失败',
      opened: '已开启',
      closed: '已关闭',
      videoUrlEmpty: '视频地址为空',
      imageUrlEmpty: '图片地址为空',
      copySuccess: '复制成功',
      confirmDelete: '确定要删除选中的 {count} 条报警吗？删除后无法恢复。',
      deleteSuccess: '删除成功',
      deleteFailed: '删除失败'
    }
  },

  account: {
    account: '登录账户',
    name: '登录名称',
    role: '角色',
    organization: '组织机构',
    password: '登录密码',
    confirmPassword: '确认密码',
    remark: '备注',
    userImage: '用户图像',
    roleName: '角色名称',
    organizationName: '组织机构',
    createTime: '创建时间',
    mobile: '手机号',
    accountType: '账号级别',
    normalAccount: '普通账号',
    superAdmin: '超级管理员账号',
    addTitle: '新增账户',
    editTitle: '修改账户',
    editHint: '账号创建后，登录账户 / Email / 密码无法修改（后端未提供对应接口）；此处只能改姓名、电话、编号、职位与权限状态。',
    inputAccount: '请输入登录账户',
    inputName: '请输入登录名称',
    selectRole: '请选择角色',
    selectOrganization: '请选择组织机构',
    inputPassword: '请输入登录密码',
    inputConfirmPassword: '请输入确认密码',
    inputRemark: '请输入备注',
    enableConfirm: '确定要启用该账户吗？',
    disableConfirm: '确定要禁用该账户吗？',
    enableSuccess: '启用成功',
    disableSuccess: '禁用成功',
    passwordMismatch: '两次输入的密码不一致',
    passwordNoSpace: '密码不能包含首尾空格'
  },

  photoWall: {
    name: '档案名称',
    nameCn: '档案名称中文',
    nameEn: '档案名称英文',
    sort: '档案排序',
    isOpen: '是否开启',
    status: '状态',
    createTime: '创建时间',
    addTitle: '新增照片墙档案',
    editTitle: '修改照片墙档案',
    inputNameCn: '请输入档案名称中文',
    inputNameEn: '请输入档案名称英文',
    inputSort: '请输入排序值（数值越大越靠前）',
    selectStatus: '请选择状态',
    selectOpenStatus: '请选择是否开启',
    sortMustBeNumber: '排序值必须为数字',
    hint: '这里管理的是照片墙的「档案」（相册/分类），不是报警图片。',
    deleteConfirm: '确定要删除档案「{name}」吗？服务器上的文件夹会一并删除，且无法恢复。'
  },

  photoContent: {
    name: '资源名称',
    type: '资源类型',
    archive: '所属档案',
    remark: '资源备注',
    resourceUrl: '资源 URL',
    image: '图片',
    video: '视频',
    upload: '资源上传',
    editTitle: '修改照片墙资源',
    inputName: '请输入资源名称',
    selectArchive: '请选择所属档案',
    selectType: '请选择资源类型',
    inputRemark: '请输入资源备注',
    uploadImageOrUrl: '请上传图片或输入图片URL',
    uploadVideoOrUrl: '请上传视频或输入视频URL',
    loadArchiveFailed: '获取档案列表失败',
    uploadTitle: '上传资源',
    addTitle: '新增资源',
    typeImage: '图片',
    typeHint: '（上传接口仅支持图片，暂无视频上传接口）',
    selectFile: '点击或拖拽单张图片到此处',
    createNote: '上传接口只接收「文件」和「目标文件夹」；填写的资源名称会在上传成功后自动设置。',
    editNote: '支持替换图片与修改名称；无法把图片移动到其他文件夹。',
    replaceImage: '替换图片',
    chooseFile: '选择文件',
    sameExtRequired: '格式须与原图一致：{ext}',
    extMismatch: '格式不一致 —— 原图是 {want}，你选的是 {got}。后端要求必须相同，请重新选择。',
    createSuccess: '新增成功',
    exceedSingle: '只支持单张上传，请先移除已选文件',
    selectFiles: '点击或拖拽文件到此处',
    uploadHint: '支持 JPG、PNG 等图片格式；单文件建议不超过 10MB。',
    uploadNote:
      '上传接口只接收「文件」与「目标文件夹」，不接收名称 / 类型 / 备注；上传成功后可在列表点「编辑」改名。',
    noFiles: '请先选择文件',
    uploadSuccess: '上传成功',
    uploadFailed: '上传失败',
    uploadButton: '上传'
  },

  /** 客户管理（旧站没有这一项，新增模块） */
  customer: {
    title: '客户管理',
    company: '公司名称',
    sn: '编号',
    manager: '负责人',
    tele: '负责人电话',
    logo: 'Logo',
    remark: '备注',
    createTime: '创建时间',
    addTitle: '新增客户',
    editTitle: '修改客户',
    inputCompany: '请输入公司名称',
    inputSn: '请输入编号',
    inputManager: '请输入负责人',
    inputTele: '请输入负责人电话',
    inputRemark: '请输入备注',
    deleteConfirm: '确定要删除客户「{name}」吗？关联账号会一并删除。',
    relatedAccounts: '关联账号',
    relatedTitle: '「{name}」的关联账号',
    addRelated: '新增关联账号',
    editRelated: '修改关联账号',
    userName: '账号',
    name: '姓名',
    selectAccount: '请选择账号',
    inputName: '请输入姓名',
    relatedEmpty: '该客户暂无关联账号',
    removeRelatedConfirm: '确定要删除选中的关联账号吗？',
    approvalNote:
      '参考图上的「审批信息 / 第几步审批」在接口中并不存在（那是旧系统的审批流概念），故本页不展示。',
    backToList: '返回客户列表'
  },

  pushAddress: {
    label: '标签名称',
    viewDoc: '查看文档',
    loadFailed: '加载推送地址列表失败',
    docLoadFailed: '加载 API 文档失败',
    endpoint: '接口地址',
    method: '方法',
    copy: '复制',
    copied: '已复制',
    kind: {
      alarm: '消息推送专用地址',
      config: '第三方系统配置信息同步',
      stat: '矩形统计数据同步'
    },
    docTitle: '接口文档',
    docPage: {
      common: '通用说明',
      alarm: '通用报警推送'
    },
    openInNewTab: '新窗口打开',
    docHint: '文档由文档站提供并内嵌显示；如无法加载，请点「新窗口打开」。',
    httpOnlyDoc:
      '文档站仅支持 http，https 页面无法内嵌显示（浏览器会拦截混合内容）。请点「新窗口打开」查看。',
    sourceNote: '地址清单暂为静态配置（旧站取清单的接口在本后端不存在，实测 404），后端提供新接口后改为动态拉取。',
    legacyNote:
      '完整版《CMP 开放数据接收 API 接口文档 v1.6.0》（含 6 个告警推送 + 配置同步 + 统计同步）目前只在旧站，需后端提供。'
  }
}
