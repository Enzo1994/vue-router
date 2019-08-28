/* @flow */

import type VueRouter from '../index'
import { stringifyQuery } from './query'

// 清除末尾斜杠
const trailingSlashRE = /\/?$/


/*
 * 创建路由函数
 *
 */
export function createRoute (
  record: ?RouteRecord,  // 记录
  location: Location,  // 位置
  redirectedFrom?: ?Location,  //从哪里重定向
  router?: VueRouter  // vue路由
): Route
{
  const stringifyQuery = router && router.options.stringifyQuery  // 如果用户传入stringifyQuery，则覆盖默认操作

  let query: any = location.query || {}
  try {
    query = clone(query)  // 把query深拷贝
  } catch (e) {}

  const route: Route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery),
    matched: record ? formatMatch(record) : []
  }
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery)
  }
  return Object.freeze(route)
}

/*
 * 克隆函数（深拷贝）
 */
function clone (value) {
  // 如果是数组：
  if (Array.isArray(value)) {
    // 用map直接复制，返回
    return value.map(clone)
  }
  // 如果是对象：
  else if (value && typeof value === 'object') {
    // 把对象每个kv赋值给新对象
    const res = {}
    for (const key in value) {
      // 递归复制
      res[key] = clone(value[key])
    }
    return res
  } else {
    return value
  }
}

// the starting route that represents the initial state
export const START = createRoute(null, {
  path: '/'
})

function formatMatch (record: ?RouteRecord): Array<RouteRecord> {
  const res = []
  while (record) {
    res.unshift(record)
    record = record.parent
  }
  return res
}

/*
 * 获取完整路径
 */
function getFullPath (
  { path, query = {}, hash = '' },
  _stringifyQuery
): string {
  // 参数path一定是一个路由url，
  // 如果传入stringifyQuery，则使用，把query的参数按照此函数转换为字符串
  const stringify = _stringifyQuery || stringifyQuery
  // 返回
  return (path || '/') + stringify(query) + hash
}

export function isSameRoute (a: Route, b: ?Route): boolean {
  if (b === START) {
    return a === b
  } else if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  } else {
    return false
  }
}

function isObjectEqual (a = {}, b = {}): boolean {
  // handle null value #1566
  if (!a || !b) return a === b
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

export function isIncludedRoute (current: Route, target: Route): boolean {
  return (
    current.path.replace(trailingSlashRE, '/').indexOf(
      target.path.replace(trailingSlashRE, '/')
    ) === 0 &&
    (!target.hash || current.hash === target.hash) &&
    queryIncludes(current.query, target.query)
  )
}

function queryIncludes (current: Dictionary<string>, target: Dictionary<string>): boolean {
  for (const key in target) {
    if (!(key in current)) {
      return false
    }
  }
  return true
}
