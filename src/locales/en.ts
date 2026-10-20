/**
 * English
 * ============================================================
 * 全部沿用舊站（CMP2.0）英文包的既有譯法，**不自己另造詞**（避免同一個詞兩種翻譯）。
 * 原件見 docs/reference/旧站语言包-en.json。
 */
export default {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    reset: 'Reset',
    search: 'Search',
    query: 'Query',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    save: 'Save',
    back: 'Back',
    export: 'Export',
    detail: 'Detail',
    refresh: 'Refresh',
    operation: 'Operation',
    status: 'Status',
    enabled: 'Enabled',
    disabled: 'Disabled',
    open: 'Open',
    close: 'Close',
    pleaseSelect: 'Please Select',
    pleaseInput: 'Please Input',
    loading: 'Loading...',
    success: 'Success',
    failed: 'Failed',
    operationSuccess: 'Operation Successful',
    operationFailed: 'Operation Failed',
    deleteConfirm: 'Are you sure you want to delete?',
    deleteSuccess: 'Delete Successful',
    deleteFailed: 'Delete Failed',
    loadFailed: 'Load Failed',
    saveSuccess: 'Save Successful',
    saveFailed: 'Save Failed',
    formValidationFailed: 'Please check if the form is filled correctly',
    warmTip: 'Reminder',
    unknown: 'Unknown',
    total: '{total} records in total',
    records: 'records',
    selected: 'Selected',
    noData: 'No Data',
    yes: 'Yes',
    no: 'No',
    empty: '--',
    weekdays: {
      0: 'Sunday',
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday'
    }
  },

  status: {
    normal: 'Normal',
    device: {
      normal: 'Normal',
      repairing: 'Under Repair',
      deactivated: 'Deactivated',
      departure: 'Departure'
    },
    certificate: {
      normal: 'Normal',
      expiring: 'Expiring Soon',
      expired: 'Expired',
      unconfigured: 'Certificate Not Configured'
    },
    permit: {
      pendingApproval: 'Pending Approval',
      pendingAcceptance: 'Pending Acceptance',
      accepted: 'Accepted',
      completed: 'Completed',
      permitCompleted: 'Permit Completed',
      overtime: 'Overtime',
      cancellationRequested: 'Cancellation Requested',
      unknown: 'Unknown'
    },
    recordRange: {
      day1: 'Past 1 Day Records',
      day7: 'Past 7 Days Records',
      day30: 'Past 30 Days Records',
      day30to60: 'Past 30-60 Days Records',
      day60to90: 'Past 60-90 Days Records'
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
      role: 'Role Management',
      accountManagement: 'Account Management',
      customerManagement: 'Customer Management',
      photoWall: 'Photo Wall Archive',
      photoContent: 'Photo Wall Resource',
      pushAddress: 'Push Address'
    }
  },

  navigationBar: {
    switchOrganize: 'Switch Organization',
    currentOrganize: 'Current Organization',
    changePassword: 'Reset Password',
    logout: 'Log Out',
    logoutConfirmTitle: 'Confirm Logout',
    logoutConfirmMessage: 'Are you sure you want to log out?'
  },

  /** Demo-mode banner (used when the public deployment cannot reach the internal API) */
  demo: {
    banner:
      'Demo mode: data on this page is built-in sample data, not from the live API. (Why: the API only exists on the company intranet at 192.168.77.15 and no public address has been provided yet. The frontend is ready — it switches to real data as soon as the API is reachable.)'
  },

  /** Register / Forgot password */
  authPage: {
    registerTitle: 'Create Account',
    registerSubtitle: 'Set up a new login account',
    forgotTitle: 'Forgot Password',
    forgotSubtitle: 'Reset your login password',
    account: 'Login Account',
    email: 'Email',
    password: 'Login Password',
    confirmPassword: 'Confirm Password',
    tele: 'Mobile (optional)',
    submitRegister: 'Register',
    submitForgot: 'Submit',
    backToLogin: 'Back to Login',
    noAccount: "Don't have an account?",
    goRegister: 'Register now',
    forgotPassword: 'Forgot password?',
    accountRequired: 'Please enter the login account',
    emailRequired: 'Please enter an email',
    emailInvalid: 'Invalid email format',
    passwordRequired: 'Please enter a password',
    passwordTooShort: 'Password must be at least 6 characters',
    passwordMismatch: 'Passwords do not match',
    accountReserved: 'This account is reserved by the system or already taken',
    registerSuccess: 'Registered successfully. Please log in with the new account.',
    registerFailed: 'Registration failed',
    forgotNoApi:
      'The backend has not provided a "forgot password" API (it is not in the API documentation). This page is UI-only and does not actually send any email.',
    forgotHint: 'To reset the password, please contact an administrator.',
    forgotSubmitted: 'Self-service recovery is unavailable here — please contact an administrator.'
  },

  login: {
    title: 'System Login',
    username: 'Username',
    password: 'Password',
    submit: 'Log In',
    loading: 'Logging in...',
    usernameRequired: 'Please enter username',
    passwordRequired: 'Please enter password',
    failed: 'Login failed',
    demoHint: 'Demo account: admin / 123456'
  },

  /** Top info bar (static for now; values will come from an API later) */
  topbar: {
    projectType: 'Project Type',
    projectNo: 'Project No.',
    environmentMonitoring: 'Micro-network Environment Monitoring',
    gateway: 'Gateway',
    windSpeed: 'Wind Speed',
    productionDate: 'Production Date',
    feelsLike: 'Feels Like',
    humidity: 'Humidity',
    lunar: 'Lunar',
    alarmNotice: 'Alert Notice',
    unprocessedAlarm: 'Unprocessed Alerts',
    maintenance: 'Registered Maintenance'
  },

  /** Role management */
  role: {
    name: 'Role Name',
    description: 'Role Description',
    permission: 'Role Permission',
    createTime: 'Create Time',
    inputName: 'Please enter role name',
    inputDescription: 'Please enter role description',
    addTitle: 'Add Role',
    editTitle: 'Edit Role',
    deleteConfirm: 'Delete role "{name}"?',
    mockNote: 'No API yet for this module (the old site endpoints are undocumented); data is demo only.'
  },

  /** Permit to Work */
  permitWork: {
    title: 'Permit to Work List',
    columns: {
      permitId: 'Permit ID',
      workPermitNo: 'Work Order No.',
      permitType: 'Permit Type',
      status: 'Permit Status',
      modelContent: 'Model Content',
      applicant: 'Applicant',
      applyDate: 'Application Time'
    },
    filters: {
      permitArea: 'Permit Area',
      permitType: 'Permit Type',
      company: 'Permit Approver',
      dateRange: 'Application Date'
    },
    exportPlaceholder: 'Export task submitted (placeholder until the API is ready)',
    mockNote: 'No API for this module yet (confirmed by the backend, issue 2); data is demo only.'
  },

  dashboard: {
    title: 'System Monitoring Overview',
    realtime: 'Real-time Monitoring',
    onlineRate: 'Device Online Rate',
    /** Alarm real-time push (WebSocket) */
    live: {
      title: 'Live Push',
      on: 'Connected',
      simulating: 'Simulated',
      closed: 'Disconnected',
      connecting: 'Connecting',
      disabled: 'Not Configured',
      alarmTitle: 'New Alarm',
      received: '{count} received',
      lastAt: 'Latest: {time}',
      disabledHint: 'No WebSocket URL configured (VITE_WS_URL); live alarms are unavailable.'
    },
    /** Dashboard stat cards (labels from the design; definitions pending confirmation) */
    cards: {
      offline: 'Offline Devices',
      alarm: 'Unprocessed Alerts',
      online: 'Online Personnel',
      site: 'Sites Under Construction'
    },
    /** Legend of the monitoring donut chart */
    monitor: {
      online: 'Online Devices',
      offline: 'Offline Devices',
      alarm: 'Alerting Devices'
    },
    deviceTotal: 'Total Devices',
    repairingDeviceTotal: 'Total Devices Under Repair',
    certificateExpiringIn7DaysDevice: 'Devices with Certificates Expiring in 7 Days',
    expiredCertificateDevice: 'Devices with Expired Certificates',
    todayPermitTotal: "Today's Total Permits",
    todayActivePermitTotal: "Today's Active Permits",
    todayCompletedPermitTotal: "Today's Completed Permits",
    todayExpiredPermitTotal: "Today's Expired Permits",
    todayNormalUnlockTotal: "Today's Normal Unlocks",
    lowPowerDeviceTotal: 'Total Low Power Devices',
    todayAbnormalUnlockDeviceTotal: "Today's Abnormal Unlock Devices",
    currentOnlineTotal: 'Current Online Total',
    currentOfflineTotal: 'Current Offline Total',
    todayActiveDeviceTotal: "Today's Active Device Total",
    todayAlertTotal: "Today's Alert Total",
    todayAlertNotificationTotal: "Today's Alert Zone Notifications",
    staffSosAlert: 'Staff SOS Alert',
    abnormalPhysicalCondition: 'Abnormal Physical Condition',
    processedWarningCount: 'Processed Warning Count',
    dailyAlertTotal: 'Daily Alert Total',
    confinedSpacePersonnelTotal: 'Confined Space Personnel Total',
    confinedSpacePersonnelUnwell: 'Confined Space Personnel Unwell',
    confinedSpaceSafetyLevel: 'Confined Space Safety Level',
    dailyTrainingConducted: 'Daily Training Conducted',
    dailyQualifiedPersonnelTotal: 'Daily Qualified Personnel Total',
    dailyUnqualifiedPersonnelTotal: 'Daily Unqualified Personnel Total',
    has: 'Yes',
    hasNot: 'No',
    safe: 'Safe',
    danger: 'Danger',
    fetchDataFailed: 'Failed to fetch data, please try again later'
  },

  alarm: {
    tabs: {
      receiveList: 'Alert Record Receive List',
      correctionList: 'Alert Record Correction List',
      displaySetting: 'CMP Display Setting'
    },
    columns: {
      alarmId: 'Alarm Event Unique ID',
      deviceId: 'Device No.',
      deviceName: 'Device Name',
      deviceType: 'Device Category Code',
      machineId: 'Machine System No.',
      machineName: 'Machine Name',
      machineType: 'Machine Type',
      machineModel: 'Machine Model',
      machineSN: 'Machine Registration No.',
      category4S: '4S Category',
      alarmTime: 'Alarm Time',
      alarmType: 'Alarm Type Code',
      alarmDescChi: 'Alarm Description (Chinese)',
      alarmDescEng: 'Alarm Description (English)',
      alarmValue: 'Alarm Value',
      mlat: 'Alarm Latitude',
      mlng: 'Alarm Longitude',
      siteAddress: 'Site Name',
      siteFloor: 'Site Floor',
      alertLocation: 'Alert Location',
      picUrl: 'Alarm Photo',
      videoUrl: 'Alarm Video',
      staffRegID: 'Staff NFC No.',
      staffEname: 'Staff English Name',
      staffCname: 'Staff Chinese Name'
    },
    /** Field names follow the API (`/api/alarm`), not the old site's push schema */
    fields: {
      sn: 'Alarm No.',
      productName: 'Product Name',
      productSN: 'Product No.',
      productLocation: 'Product Location',
      sensorDevice: 'Sensor',
      sensorDeviceSN: 'Sensor No.',
      categoryId: 'Category',
      description: 'Alarm Description',
      descriptionEn: 'Alarm Description (English)',
      alarmValue: 'Alarm Value',
      constSite: 'Site',
      constSiteZone: 'Site Zone',
      floor: 'Floor',
      lon: 'Longitude',
      lat: 'Latitude',
      location: 'Alarm Location',
      level: 'Alarm Level',
      imageUrl: 'Image',
      videoUrl: 'Video',
      worker: 'Worker',
      workerEn: 'Worker Name (English)',
      workerNFC: 'Worker NFC',
      customerId: 'Customer ID',
      customerSN: 'Customer SN',
      alarmTime: 'Alarm Time',
      falsePositive: 'False Positive',
      processStatus: 'Process Status',
      userStatus: 'User Status',
      status: 'Status',
      remark: 'Remark',
      createTime: 'Create Time',
      updateTime: 'Update Time'
    },
    levels: {
      1: 'Level 1 (Low)',
      2: 'Level 2 (Medium)',
      3: 'Level 3 (High)'
    },
    yesNo: {
      yes: 'Yes',
      no: 'No'
    },
    processStatus: {
      0: 'Unprocessed',
      1: 'Processed'
    },
    userStatus: {
      0: 'Visible',
      1: 'Hidden'
    },
    recordStatus: {
      0: 'Open',
      1: 'Closed'
    },
    editTitle: 'Edit Alarm',
    editSuccess: 'Alarm updated',
    editFailed: 'Failed to update alarm',
    selectRowsFirst: 'Please select records first',
    filters: {
      alarmId: 'Alarm Event Unique ID',
      deviceId: 'Device No.',
      deviceName: 'Device Name',
      deviceType: 'Device Category Code',
      machineId: 'Machine System No.',
      alarmType: 'Alarm Type Code',
      siteAddress: 'Site Name',
      siteFloor: 'Site Floor',
      staffName: 'Staff Name',
      dateRange: 'Alarm Time'
    },
    actions: {
      markHide: 'Mark Hide',
      revokeHide: 'Revoke Hide',
      open: 'Open',
      close: 'Close',
      viewVideo: 'View Video',
      videoPreview: 'Video Preview',
      delete: 'Delete'
    },
    detailTitle: 'Alarm Detail',
    otherFields: 'Other fields (extra values returned by the API)',
    imageLoadFailed: 'Image failed to load',
    clickToZoom: 'Click to zoom',
    messages: {
      pleaseSelectRecords: 'Please select records to {action} first',
      confirmMarkHide: 'Are you sure you want to {action} {count} selected records?',
      markHideSuccess: 'Mark hide successful',
      revokeHideSuccess: 'Revoke hide successful',
      markHideFailed: 'Mark hide failed',
      revokeHideFailed: 'Revoke hide failed',
      statusModifiedFailed: 'Status modification failed',
      opened: 'Opened',
      closed: 'Closed',
      videoUrlEmpty: 'Video URL is empty',
      imageUrlEmpty: 'Image URL is empty',
      copySuccess: 'Copy successful',
      confirmDelete: 'Delete the selected {count} alarm(s)? This cannot be undone.',
      deleteSuccess: 'Deleted successfully',
      deleteFailed: 'Delete failed'
    }
  },

  account: {
    account: 'Login Account',
    name: 'Login Name',
    role: 'Role',
    organization: 'Organization',
    password: 'Login Password',
    confirmPassword: 'Confirm Password',
    remark: 'Remark',
    userImage: 'User Image',
    roleName: 'Role Name',
    organizationName: 'Organization',
    createTime: 'Create Time',
    mobile: 'Mobile',
    accountType: 'Account Level',
    normalAccount: 'Normal Account',
    superAdmin: 'Super Admin Account',
    addTitle: 'Add Account',
    editTitle: 'Edit Account',
    editHint:
      'Once created, the login account, email and password cannot be changed (no API yet). Only name, mobile, SN, title and permission/status are editable here.',
    inputAccount: 'Please enter login account',
    inputName: 'Please enter login name',
    selectRole: 'Please select role',
    selectOrganization: 'Please select organization',
    inputPassword: 'Please enter login password',
    inputConfirmPassword: 'Please enter confirm password',
    inputRemark: 'Please enter remark',
    enableConfirm: 'Are you sure you want to enable this account?',
    disableConfirm: 'Are you sure you want to disable this account?',
    enableSuccess: 'Enabled Successfully',
    disableSuccess: 'Disabled Successfully',
    passwordMismatch: 'Passwords do not match',
    passwordNoSpace: 'Password cannot contain leading or trailing spaces'
  },

  photoWall: {
    name: 'Archive Name',
    nameCn: 'Archive Name (CN)',
    nameEn: 'Archive Name (EN)',
    sort: 'Archive Sort',
    isOpen: 'Enabled',
    status: 'Status',
    createTime: 'Create Time',
    addTitle: 'Add Photo Wall Archive',
    editTitle: 'Edit Photo Wall Archive',
    inputNameCn: 'Please enter archive name (CN)',
    inputNameEn: 'Please enter archive name (EN)',
    inputSort: 'Please enter sort value (larger value appears first)',
    selectStatus: 'Please select status',
    selectOpenStatus: 'Please select whether to enable',
    sortMustBeNumber: 'Sort value must be a number',
    hint: 'This page manages photo-wall archives (albums), not alarm images.',
    deleteConfirm:
      'Delete archive "{name}"? The folder on the server will be removed as well and cannot be recovered.'
  },

  photoContent: {
    name: 'Resource Name',
    type: 'Resource Type',
    archive: 'Archive',
    remark: 'Resource Remark',
    resourceUrl: 'Resource URL',
    image: 'Image',
    video: 'Video',
    upload: 'Resource Upload',
    editTitle: 'Edit Photo Wall Resource',
    inputName: 'Please enter resource name',
    selectArchive: 'Please select archive',
    selectType: 'Please select resource type',
    inputRemark: 'Please enter resource remark',
    uploadImageOrUrl: 'Please upload image or enter image URL',
    uploadVideoOrUrl: 'Please upload video or enter video URL',
    loadArchiveFailed: 'Failed to load archive list',
    uploadTitle: 'Upload Resource',
    addTitle: 'Add Resource',
    typeImage: 'Image',
    typeHint: '(the upload API only supports images — there is no video upload endpoint)',
    selectFile: 'Click or drag a single image here',
    createNote:
      'The upload API only accepts the file and the target folder; the name you enter is applied automatically after the upload succeeds.',
    editNote: 'You can replace the image and rename it, but cannot move it to another folder.',
    replaceImage: 'Replace Image',
    chooseFile: 'Choose File',
    sameExtRequired: 'Format must match the original: {ext}',
    extMismatch:
      'Format mismatch — original is {want}, you chose {got}. The API requires them to match; please pick another file.',
    createSuccess: 'Added successfully',
    exceedSingle: 'Only one file is allowed — please remove the selected file first',
    selectFiles: 'Click or drag files here',
    uploadHint: 'Supports JPG, PNG and other image formats. Keep the file under 10MB.',
    uploadNote:
      'The upload API only accepts the file and the target folder — not name/type/remark. Rename the item afterwards via "Edit" in the list.',
    noFiles: 'Please select files first',
    uploadSuccess: 'Upload successful',
    uploadFailed: 'Upload failed',
    uploadButton: 'Upload'
  },

  /** Customer management (new module — not in the old site) */
  customer: {
    title: 'Customer Management',
    company: 'Company',
    sn: 'Code',
    manager: 'Manager',
    tele: 'Manager Phone',
    logo: 'Logo',
    remark: 'Remark',
    createTime: 'Create Time',
    addTitle: 'Add Customer',
    editTitle: 'Edit Customer',
    inputCompany: 'Please enter company name',
    inputSn: 'Please enter code',
    inputManager: 'Please enter manager',
    inputTele: 'Please enter manager phone',
    inputRemark: 'Please enter remark',
    deleteConfirm: 'Delete customer "{name}"? Its linked accounts will be removed too.',
    relatedAccounts: 'Linked Accounts',
    relatedTitle: 'Linked accounts of "{name}"',
    addRelated: 'Add Linked Account',
    editRelated: 'Edit Linked Account',
    userName: 'Account',
    name: 'Name',
    selectAccount: 'Please select an account',
    inputName: 'Please enter name',
    relatedEmpty: 'No linked accounts yet',
    removeRelatedConfirm: 'Delete the selected linked accounts?',
    approvalNote:
      '"Approval info / approval step" shown in the reference screenshot does not exist in the API (it is a legacy approval-workflow concept), so it is not displayed here.',
    backToList: 'Back to Customer List'
  },

  pushAddress: {
    label: 'Label Name',
    viewDoc: 'View Docs',
    loadFailed: 'Failed to load push address list',
    docLoadFailed: 'Failed to load API documentation',
    endpoint: 'Endpoint',
    method: 'Method',
    copy: 'Copy',
    copied: 'Copied',
    kind: {
      alarm: 'Message Push Endpoint',
      config: 'Third-party Config Sync',
      stat: 'Rectangle Statistics Sync'
    },
    docTitle: 'API Documentation',
    docPage: {
      common: 'Overview',
      alarm: 'Alert Push'
    },
    openInNewTab: 'Open in New Tab',
    docHint: 'The documentation is embedded from the docs site. If it fails to load, use "Open in New Tab".',
    httpOnlyDoc:
      'The docs site is served over http only, so it cannot be embedded in an https page (mixed content is blocked). Use "Open in New Tab" instead.',
    sourceNote:
      'The endpoint list is currently static config (the old site endpoint returns 404 on this backend). It will be fetched dynamically once the new API is available.',
    legacyNote:
      'The full "CMP Open Data Receiving API v1.6.0" document (6 alert pushes + config sync + statistics sync) currently exists only on the old site and must be provided by the backend.'
  }
}
