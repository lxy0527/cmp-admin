/**
 * 菜单树：类型 + 归一化工具
 * ============================================================
 * 为什么要这一层（而不是让布局直接用 `config/menu.ts` 的数组）：
 *   后续 Data Receiving / CMP Setting 的左侧菜单大概率是**后端按角色下发**的，
 *   形状可能和前端静态配置不一样（字段名不同、多层嵌套、带排序/隐藏/外链等）。
 *   所以这里把"菜单源"和"菜单渲染"解耦：
 *
 *     菜单源（静态配置 / 后端接口）
 *          ↓ normalizeMenus()  ← 统一成 MenuNode
 *       MenuNode 树
 *          ↓ 权限过滤（store/menu.ts）
 *       渲染（layout/MenuTree.vue）+ 路由（router/index.ts，来自 routePath）
 *
 * 扩展点都设计成"可选字段"：后端哪天开始返回 icon/order/hidden/badge/children，
 * 前端渲染层不需要改代码，直接就能显示。
 */

/** 菜单节点（归一化后的统一形状） */
export interface MenuNode {
  /** 稳定唯一键（默认取 path，后端给 id 就用 id），用于展开状态、key、选中判断 */
  key: string
  /** 显示名 */
  title: string
  /**
   * 路由的真实完整路径，例如 `/data-receiving/permitted-to-work`
   * - 叶子节点：点击后跳这里
   * - 父节点：留空（只作为分组展开/收起）
   * 同时也用于"当前选中项"判断
   */
  routePath?: string
  /**
   * 菜单源里的原始 path 片段/全路径。
   * 兼容两种来源：前端静态配置给的是片段（`permitted-to-work`），
   * 后端通常直接给全路径（`/data-receiving/permitted-to-work`）。
   */
  sourcePath?: string
  /** 权限点：不填 = 登录可见（子节点按需覆盖） */
  permission?: string | string[]
  /**
   * 图标：先放字符串（图标名 / 图片地址 / 后端给的编码），
   * 渲染层再决定怎么画 —— 现在设计图是"彩色小方块"，后端给了就换。
   */
  icon?: string
  /** 排序权重，小的在前；不填按声明顺序 */
  order?: number
  /** 隐藏菜单但保留路由（能跳转、不在菜单里显示） */
  hidden?: boolean
  /** 外链（填了就不走 router，直接开新窗口） */
  externalLink?: string
  /** 置灰不可点（权限之外的业务态，例如"未配置"） */
  disabled?: boolean
  /** 角标，例如待处理数量 */
  badge?: string | number
  /** 子菜单：支持任意层级 */
  children?: MenuNode[]
}

/** 权限过滤需要的上下文（不直接依赖 store，方便单测/复用） */
export type PermissionChecker = (required?: string | string[]) => boolean

/** 排序：order 小的在前，未填的排后面，同权重保持声明顺序（稳定） */
function sortNodes(list: MenuNode[]): MenuNode[] {
  return list
    .map((node, index) => ({ node, index }))
    .sort((a, b) => {
      const oa = a.node.order ?? Number.MAX_SAFE_INTEGER
      const ob = b.node.order ?? Number.MAX_SAFE_INTEGER
      return oa === ob ? a.index - b.index : oa - ob
    })
    .map((it) => it.node)
}

/**
 * 权限过滤（递归）
 * 规则：
 *   - 叶子：有权限就留
 *   - 分组：**子节点里还有可见项就留**，否则整组丢掉
 *     （所以"整组权限都不够"时，父级菜单和它所在的模块 Tab 会自动消失）
 */
export function filterMenuByPermission(
  nodes: MenuNode[],
  hasPermission: PermissionChecker
): MenuNode[] {
  const result: MenuNode[] = []
  for (const node of sortNodes(nodes)) {
    const children = node.children?.length
      ? filterMenuByPermission(node.children, hasPermission)
      : undefined

    // 有子节点时：只要还剩可见子项就保留本组（自身 permission 视为"进组门槛"，
    // 但为了兼容"父级没配权限、子级各自配"的常见写法，这里优先看子项结果）
    if (node.children?.length) {
      if (!children || children.length === 0) continue
      if (node.permission && !hasPermission(node.permission)) continue
      result.push({ ...node, children })
      continue
    }

    if (hasPermission(node.permission)) result.push({ ...node })
  }
  return result
}

/** 展开成扁平数组（找节点、找祖先链、调试时方便） */
export function flattenMenu(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = []
  const walk = (list: MenuNode[]) => {
    for (const node of list) {
      out.push(node)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return out
}

/**
 * 取某个节点到根的祖先 key 链（用于"跳到某个页面时自动展开它所在的组"）
 * 返回从外到内，例如 [外层组 key, 内层组 key]
 */
export function findAncestorKeys(nodes: MenuNode[], targetKey: string): string[] {
  const walk = (list: MenuNode[], chain: string[]): string[] | null => {
    for (const node of list) {
      if (node.key === targetKey) return chain
      if (node.children?.length) {
        const found = walk(node.children, [...chain, node.key])
        if (found) return found
      }
    }
    return null
  }
  return walk(nodes, []) ?? []
}

/** 按 key 找节点 */
export function findMenuNode(nodes: MenuNode[], key: string): MenuNode | undefined {
  return flattenMenu(nodes).find((n) => n.key === key)
}
