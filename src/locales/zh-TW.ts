/**
 * 繁體中文（預設語言）
 * ============================================================
 * 術語來源：舊站（CMP2.0）語言包，逐條對齊，不要自己另造譯法。
 * 舊站語言包原件見 docs/reference/旧站语言包-zh-TW.json（含全部 9 個模組）。
 *
 * 注意：本檔只放**介面文案**。公司名、人名、備註等業務資料永遠不翻譯。
 */
export default {
  common: {
    confirm: '確定',
    cancel: '取消',
    reset: '重設',
    search: '搜尋',
    query: '查詢',
    submit: '提交',
    delete: '刪除',
    edit: '編輯',
    add: '新增',
    save: '保存',
    back: '返回',
    export: '導出',
    detail: '詳情',
    refresh: '刷新',
    operation: '操作',
    status: '狀態',
    enabled: '啟用',
    disabled: '禁用',
    open: '開啟',
    close: '關閉',
    pleaseSelect: '請選擇',
    pleaseInput: '請輸入',
    loading: '加載中...',
    success: '成功',
    failed: '失敗',
    operationSuccess: '操作成功',
    operationFailed: '操作失敗',
    deleteConfirm: '確定要刪除嗎？',
    deleteSuccess: '刪除成功',
    deleteFailed: '刪除失敗',
    loadFailed: '加載失敗',
    saveSuccess: '保存成功',
    saveFailed: '保存失敗',
    formValidationFailed: '請檢查表單填寫是否正確',
    warmTip: '溫馨提示',
    unknown: '未知',
    total: '共 {total} 條記錄',
    records: '條',
    selected: '已選中',
    noData: '暫無數據',
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

  /** 狀態枚舉（來源：舊站 status 模組） */
  status: {
    normal: '正常',
    device: {
      normal: '正常',
      repairing: '維修中',
      deactivated: '停用',
      departure: '離場'
    },
    certificate: {
      normal: '正常',
      expiring: '即將過期',
      expired: '已經過期',
      unconfigured: '未設置證書'
    },
    /** 許可證／通知類型（權威枚舉，前端 mock 曾用「申请待批/许可待批…」是錯的） */
    permit: {
      pendingApproval: '等待審批',
      pendingAcceptance: '等待接受',
      accepted: '接受許可',
      completed: '完成工作',
      permitCompleted: '許可證完結',
      overtime: '工序超時',
      cancellationRequested: '申請註銷',
      unknown: '未知'
    },
    recordRange: {
      day1: '過往1天記錄',
      day7: '過往7天記錄',
      day30: '過往30天記錄',
      day30to60: '過往30-60天記錄',
      day60to90: '過往60-90天記錄'
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
      accountManagement: '帳號管理',
      customerManagement: '客戶管理',
      photoWall: '照片牆檔案管理',
      photoContent: '照片牆資源管理',
      pushAddress: '推送地址'
    }
  },

  navigationBar: {
    switchOrganize: '切換組織結構',
    currentOrganize: '當前機構',
    changePassword: '重設密碼',
    logout: '退出登錄',
    logoutConfirmTitle: '確認退出',
    logoutConfirmMessage: '確定要退出登錄嗎？'
  },

  /** 演示模式橫幅（公網部署連接不到內網接口時使用） */
  demo: {
    banner:
      '演示模式：本頁數據為內置示例數據，未連接真實接口。（原因：後端接口僅在公司內網 192.168.77.15，尚未提供公網地址；前端已就緒，接口一到位即可切換為真實數據）'
  },

  /** 註冊 / 找回密碼 */
  authPage: {
    registerTitle: '註冊帳號',
    registerSubtitle: '建立一個新的登錄帳號',
    forgotTitle: '找回密碼',
    forgotSubtitle: '重設你的登錄密碼',
    account: '登錄帳戶',
    email: 'Email',
    password: '登錄密碼',
    confirmPassword: '確認密碼',
    tele: '手機號（選填）',
    submitRegister: '註冊',
    submitForgot: '提交',
    backToLogin: '返回登錄',
    noAccount: '還沒有帳號？',
    goRegister: '立即註冊',
    forgotPassword: '忘記密碼？',
    accountRequired: '請輸入登錄帳戶',
    emailRequired: '請輸入 Email',
    emailInvalid: 'Email 格式不正確',
    passwordRequired: '請輸入密碼',
    passwordTooShort: '密碼至少 6 位',
    passwordMismatch: '兩次輸入的密碼不一致',
    accountReserved: '該帳戶為系統保留或已被佔用，請換一個',
    registerSuccess: '註冊成功，請使用新帳號登錄',
    registerFailed: '註冊失敗',
    forgotNoApi:
      '後端尚未提供「找回密碼」接口（接口文檔中沒有此項），本頁僅為界面預留，不會真的發送郵件。',
    forgotHint: '如需重設密碼，請聯繫管理員在後台處理。',
    forgotSubmitted: '當前環境無法自助找回，請聯繫管理員。'
  },

  login: {
    title: '系統登錄',
    username: '用戶名',
    password: '密碼',
    submit: '登錄',
    loading: '登錄中...',
    usernameRequired: '請輸入用戶名',
    passwordRequired: '請輸入密碼',
    failed: '登錄失敗',
    demoHint: '演示帳號：admin / 123456'
  },

  /** 頂欄資訊條（目前是靜態展示，接接口後值再換） */
  topbar: {
    projectType: '項目類型',
    projectNo: '工程編號',
    environmentMonitoring: '微網環境監測',
    gateway: '網關',
    windSpeed: '風速',
    productionDate: '生產日期',
    feelsLike: '體感温度',
    humidity: '濕度',
    lunar: '農曆',
    alarmNotice: '報警通知',
    unprocessedAlarm: '未處理報警',
    maintenance: '註冊總保養'
  },

  /** 角色管理 */
  role: {
    name: '角色名稱',
    description: '角色描述',
    permission: '角色權限',
    createTime: '創建時間',
    inputName: '請輸入角色名稱',
    inputDescription: '請輸入角色描述',
    addTitle: '新增角色',
    editTitle: '修改角色',
    deleteConfirm: '確定要刪除角色「{name}」嗎？',
    mockNote: '此模塊後端尚未提供接口（舊站接口無文檔），目前為演示數據。'
  },

  /** 許可作業（Permit to Work） */
  permitWork: {
    title: '許可作業列表',
    columns: {
      permitId: '許可ID',
      workPermitNo: '工作單編號',
      permitType: '許可證類型',
      status: '許可狀態',
      modelContent: '模型內容',
      applicant: '許可申請人',
      applyDate: '申請時間'
    },
    filters: {
      permitArea: '許可作業區域',
      permitType: '許可證類型',
      company: '許可批准申請',
      dateRange: '申請日期'
    },
    exportPlaceholder: '導出任務已提交（佔位，等接口就緒後接真實導出）',
    mockNote: '此模塊後端尚未提供接口（後端文檔問題 2 已確認），目前為演示數據。'
  },

  /** 首頁看板：4 個統計卡（按分類切換，每個分類 4 個卡） */
  dashboard: {
    title: '系統監控概覽',
    realtime: '實時監控',
    onlineRate: '設備在線率',
    /** 警報即時推送（WebSocket） */
    live: {
      title: '即時推送',
      on: '已連接',
      simulating: '模擬推送',
      closed: '已斷開',
      connecting: '連接中',
      disabled: '未配置',
      alarmTitle: '新警報',
      received: '本次已收到 {count} 條',
      lastAt: '最近：{time}',
      disabledHint: '未配置 WebSocket 地址（VITE_WS_URL），無法接收即時警報。'
    },
    /** 首頁 4 個統計卡（按舊站設計稿的指標名，口徑待需求方確認） */
    cards: {
      offline: '離線設備',
      alarm: '未處理報警',
      online: '在線人員',
      site: '在建工地'
    },
    /** 系統監控概覽環形圖的圖例 */
    monitor: {
      online: '在線設備',
      offline: '離線設備',
      alarm: '告警設備'
    },
    deviceTotal: '設備總數',
    repairingDeviceTotal: '維修中設備總數',
    certificateExpiringIn7DaysDevice: '7天內證書到期設備',
    expiredCertificateDevice: '已過期證書設備',
    todayPermitTotal: '今日許可證總數',
    todayActivePermitTotal: '今日進行中許可證總數',
    todayCompletedPermitTotal: '今日已完成許可證總數',
    todayExpiredPermitTotal: '今日過期許可證總數',
    todayNormalUnlockTotal: '今日正常開鎖總數',
    lowPowerDeviceTotal: '低電量設備總數',
    todayAbnormalUnlockDeviceTotal: '今日異常解鎖設備總數',
    currentOnlineTotal: '現時在線總數',
    currentOfflineTotal: '現時離線總數',
    todayActiveDeviceTotal: '今日活躍設備總數',
    todayAlertTotal: '今日警報總數',
    todayAlertNotificationTotal: '今日警報區通知總數',
    staffSosAlert: '員工求救警報',
    abnormalPhysicalCondition: '異常身體狀況',
    processedWarningCount: '已處理警告數量',
    dailyAlertTotal: '當天警報總數',
    confinedSpacePersonnelTotal: '密閉空間人員總數',
    confinedSpacePersonnelUnwell: '密閉空間人員不適',
    confinedSpaceSafetyLevel: '密閉空間安全水平',
    dailyTrainingConducted: '當天有否進行訓練',
    dailyQualifiedPersonnelTotal: '當天合格人員總數',
    dailyUnqualifiedPersonnelTotal: '當天不合格人員總數',
    has: '有',
    hasNot: '無',
    safe: '安全',
    danger: '危險',
    fetchDataFailed: '獲取數據失敗，請稍後重試'
  },

  /**
   * 警報列表 —— 7 個分類（智能鎖／移動機械／起重機／一線作業／AI／密閉空間／虛擬培訓）
   * **共用同一套欄位與篩選**，只是分類不同，所以前端只寫一個頁面元件。
   * 欄位名逐條對齊舊站 language pack 的 dataReceiving.otherDataReceiving。
   */
  alarm: {
    tabs: {
      receiveList: '警報記錄接收清單',
      correctionList: '警報記錄修正清單',
      displaySetting: 'CMP顯示設定'
    },
    columns: {
      alarmId: '報警事件唯一編號',
      deviceId: '設備編號',
      deviceName: '設備名稱',
      deviceType: '設備類別代碼',
      machineId: '機械系統編號',
      machineName: '機械名稱',
      machineType: '機械類型',
      machineModel: '機械型號',
      machineSN: '機械註冊編號',
      category4S: '4S類別',
      alarmTime: '報警時間',
      alarmType: '報警類型代碼',
      alarmDescChi: '報警描述(中文)',
      alarmDescEng: '報警描述(英文)',
      alarmValue: '報警數值',
      mlat: '報警發生的緯度',
      mlng: '報警發生的經度',
      siteAddress: '地盤名稱',
      siteFloor: '地盤樓層',
      alertLocation: '警報位置',
      picUrl: '報警抓拍照片',
      videoUrl: '報警視頻',
      staffRegID: '員工NFC編號',
      staffEname: '員工英文名',
      staffCname: '員工中文名'
    },
    /**
     * 字段名以**接口為準**（`/api/alarm` 實際返回的欄位），不是舊站那套推送欄位。
     * 上面 columns 保留舊站欄位名當參考，兩者是同一份數據的兩種表示。
     */
    fields: {
      sn: '警報編號',
      productName: '產品名稱',
      productSN: '產品編號',
      productLocation: '產品位置',
      sensorDevice: '傳感器',
      sensorDeviceSN: '傳感器編號',
      categoryId: '分類',
      description: '警報詳情描述',
      descriptionEn: '警報詳情描述(英文)',
      alarmValue: '警報數值',
      constSite: '工地',
      constSiteZone: '工地區域',
      floor: '樓層',
      lon: '經度',
      lat: '緯度',
      location: '警報詳細位置',
      level: '警報等級',
      imageUrl: '圖片',
      videoUrl: '視頻',
      worker: '員工',
      workerEn: '員工英文名',
      workerNFC: '員工NFC',
      customerId: '客戶Id',
      customerSN: '客戶編碼',
      alarmTime: '警報時間',
      falsePositive: '是否誤報',
      processStatus: '處理狀態',
      userStatus: '用戶狀態',
      status: '狀態',
      remark: '備註',
      createTime: '創建時間',
      updateTime: '更新時間'
    },
    levels: {
      1: '1級（低風險）',
      2: '2級（中風險）',
      3: '3級（高風險）'
    },
    yesNo: {
      yes: '是',
      no: '否'
    },
    processStatus: {
      0: '未處理',
      1: '已處理'
    },
    userStatus: {
      0: '顯示',
      1: '隱藏'
    },
    recordStatus: {
      0: '開啟',
      1: '關閉'
    },
    editTitle: '修改警報',
    editSuccess: '警報修改成功',
    editFailed: '警報修改失敗',
    selectRowsFirst: '請先選擇記錄',
    filters: {
      alarmId: '報警事件唯一編號',
      deviceId: '設備編號',
      deviceName: '設備名稱',
      deviceType: '設備類別代碼',
      machineId: '機械系統編號',
      alarmType: '報警類型代碼',
      siteAddress: '地盤名稱',
      siteFloor: '地盤樓層',
      staffName: '員工姓名',
      dateRange: '報警時間'
    },
    actions: {
      markHide: '標記隱藏',
      revokeHide: '撤銷隱藏',
      open: '開啟',
      close: '關閉',
      viewVideo: '查看視頻',
      videoPreview: '視頻預覽',
      delete: '刪除'
    },
    detailTitle: '警報詳情',
    otherFields: '其他欄位（後端額外返回）',
    imageLoadFailed: '圖片載入失敗',
    clickToZoom: '點擊放大',
    messages: {
      pleaseSelectRecords: '請先選擇要{action}的記錄',
      confirmMarkHide: '確定要{action}選中的 {count} 條記錄嗎？',
      markHideSuccess: '標記隱藏成功',
      revokeHideSuccess: '撤銷隱藏成功',
      markHideFailed: '標記隱藏失敗',
      revokeHideFailed: '撤銷隱藏失敗',
      statusModifiedFailed: '狀態修改失敗',
      opened: '已開啟',
      closed: '已關閉',
      videoUrlEmpty: '視頻地址為空',
      imageUrlEmpty: '圖片地址為空',
      copySuccess: '複製成功',
      confirmDelete: '確定要刪除選中的 {count} 條警報嗎？刪除後無法復原。',
      deleteSuccess: '刪除成功',
      deleteFailed: '刪除失敗'
    }
  },

  /** 帳號管理（欄位名對齊舊站 cmpSetting.account） */
  account: {
    account: '登錄帳戶',
    name: '登錄名稱',
    role: '角色',
    organization: '組織機構',
    password: '登錄密碼',
    confirmPassword: '確認密碼',
    remark: '備註',
    userImage: '用戶圖像',
    roleName: '角色名稱',
    organizationName: '組織機構',
    createTime: '創建時間',
    mobile: '手機號',
    accountType: '帳號級別',
    normalAccount: '普通帳號',
    superAdmin: '超級管理員帳號',
    addTitle: '新增帳戶',
    editTitle: '修改帳戶',
    editHint: '帳號建立後，登錄帳戶 / Email / 密碼無法修改（後端未提供對應接口）；此處只能改姓名、電話、編號、職位與權限狀態。',
    inputAccount: '請輸入登錄帳戶',
    inputName: '請輸入登錄名稱',
    selectRole: '請選擇角色',
    selectOrganization: '請選擇組織機構',
    inputPassword: '請輸入登錄密碼',
    inputConfirmPassword: '請輸入確認密碼',
    inputRemark: '請輸入備註',
    enableConfirm: '確定要啟用該帳戶嗎？',
    disableConfirm: '確定要禁用該帳戶嗎？',
    enableSuccess: '啟用成功',
    disableSuccess: '禁用成功',
    passwordMismatch: '兩次輸入的密碼不一致',
    passwordNoSpace: '密碼不能包含首尾空格'
  },

  /** 照片牆檔案管理（＝相冊／分類，不是「報警信息」） */
  photoWall: {
    name: '檔案名稱',
    nameCn: '檔案名稱中文',
    nameEn: '檔案名稱英文',
    sort: '檔案排序',
    isOpen: '是否開啟',
    status: '狀態',
    createTime: '創建時間',
    addTitle: '新增照片牆檔案',
    editTitle: '修改照片牆檔案',
    inputNameCn: '請輸入檔案名稱中文',
    inputNameEn: '請輸入檔案名稱英文',
    inputSort: '請輸入排序值（數值越大越靠前）',
    selectStatus: '請選擇狀態',
    selectOpenStatus: '請選擇是否開啟',
    sortMustBeNumber: '排序值必須為數字',
    hint: '這裡管理的是照片牆的「檔案」（相冊/分類），不是報警圖片。',
    deleteConfirm: '確定要刪除檔案「{name}」嗎？伺服器上的資料夾會一併刪除，且無法復原。'
  },

  /** 照片牆資源管理（＝圖片／視頻，不是「圖片報警」） */
  photoContent: {
    name: '資源名稱',
    type: '資源類型',
    archive: '所屬檔案',
    remark: '資源備註',
    resourceUrl: '資源 URL',
    image: '圖片',
    video: '視頻',
    upload: '資源上傳',
    editTitle: '修改照片牆資源',
    inputName: '請輸入資源名稱',
    selectArchive: '請選擇所屬檔案',
    selectType: '請選擇資源類型',
    inputRemark: '請輸入資源備註',
    uploadImageOrUrl: '請上傳圖片或輸入圖片URL',
    uploadVideoOrUrl: '請上傳視頻或輸入視頻URL',
    loadArchiveFailed: '獲取檔案列表失敗',
    uploadTitle: '上傳資源',
    addTitle: '新增資源',
    typeImage: '圖片',
    typeHint: '（上傳接口僅支持圖片，暫無視頻上傳接口）',
    selectFile: '點擊或拖拽單張圖片到此處',
    createNote:
      '上傳接口只接收「檔案」和「目標檔案夾」；填寫的資源名稱會在上傳成功後自動設定。',
    editNote: '修改接口（/albumImageEdit）只接受「Id + 名稱」，無法替換圖片、也無法移動檔案夾。',
    createSuccess: '新增成功',
    exceedSingle: '只支援單張上傳，請先移除已選檔案',
    selectFiles: '點擊或拖拽檔案到此處',
    uploadHint: '支持 JPG、PNG 等圖片格式；單檔建議不超過 10MB。',
    uploadNote:
      '上傳接口只接收「檔案」與「目標檔案夾」，不接收名稱 / 類型 / 備註；上傳成功後可在列表點「編輯」改名。',
    noFiles: '請先選擇檔案',
    uploadSuccess: '上傳成功',
    uploadFailed: '上傳失敗',
    uploadButton: '上傳'
  },

  /** 推送地址（文檔頁） */
  /** 客戶管理（舊站沒有這一項，新增模塊） */
  customer: {
    title: '客戶管理',
    company: '公司名稱',
    sn: '編號',
    manager: '負責人',
    tele: '負責人電話',
    logo: 'Logo',
    remark: '備註',
    createTime: '創建時間',
    addTitle: '新增客戶',
    editTitle: '修改客戶',
    inputCompany: '請輸入公司名稱',
    inputSn: '請輸入編號',
    inputManager: '請輸入負責人',
    inputTele: '請輸入負責人電話',
    inputRemark: '請輸入備註',
    deleteConfirm: '確定要刪除客戶「{name}」嗎？關聯帳號會一併刪除。',
    relatedAccounts: '關聯帳號',
    relatedTitle: '「{name}」的關聯帳號',
    addRelated: '新增關聯帳號',
    editRelated: '修改關聯帳號',
    userName: '帳號',
    name: '姓名',
    selectAccount: '請選擇賬號',
    inputName: '請輸入姓名',
    relatedEmpty: '該客戶暫無關聯帳號',
    removeRelatedConfirm: '確定要刪除選中的關聯帳號嗎？',
    approvalNote:
      '參考圖上的「審批信息 / 第幾步審批」在接口中並不存在（那是舊系統的審批流概念），故本頁不展示。',
    backToList: '返回客戶列表'
  },

  /** 推送地址（文檔頁） */
  pushAddress: {
    label: '標籤名稱',
    viewDoc: '查看文檔',
    loadFailed: '加載推送地址列表失敗',
    docLoadFailed: '加載 API 文檔失敗',
    endpoint: '接口地址',
    method: '方法',
    copy: '複製',
    copied: '已複製',
    kind: {
      alarm: '訊息推送專用地址',
      config: '三方系統配置信息同步',
      stat: '矩形統計數據同步'
    },
    docTitle: '接口文檔',
    docPage: {
      common: '通用說明',
      alarm: '通用警報推送'
    },
    openInNewTab: '新視窗打開',
    docHint: '文檔由文檔站提供並內嵌顯示；如無法加載，請點「新視窗打開」。',
    httpOnlyDoc:
      '文檔站僅支援 http，https 頁面無法內嵌顯示（瀏覽器會攔截混合內容）。請點「新視窗打開」查看。',
    sourceNote:
      '地址清單暫為靜態配置（舊站取清單的接口在本後端不存在，實測 404），後端提供新接口後改為動態拉取。',
    legacyNote:
      '完整版《CMP 開放數據接收 API 接口文檔 v1.6.0》（含 6 個告警推送 + 配置同步 + 統計同步）目前只在舊站，需後端提供。'
  }
}
