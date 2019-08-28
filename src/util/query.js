/* @flow */

import { warn } from './warn'

const encodeReserveRE = /[!'()*]/g
const encodeReserveReplacer = c => '%' + c.charCodeAt(0).toString(16)
const commaRE = /%2C/g


// fixed encodeURIComponent which is more conformant to RFC3986:
//  补充修复encodeURICompoent方法，让结果更符合RFC3986规范：
// - escapes [!'()*]
// - preserve commas
/*
 * 把url字符串转换成带%的encodedURI形式
 */
const encode = str => encodeURIComponent(str)  // 记住这个方法
  .replace(encodeReserveRE, encodeReserveReplacer)  //这几个[!'()*] 按照上面encodeReserveReplacer方法转换
  .replace(commaRE, ',')  //替换%2C为逗号

const decode = decodeURIComponent

export function resolveQuery (
  query: ?string,
  extraQuery: Dictionary<string> = {},
  _parseQuery: ?Function
): Dictionary<string>
{
  const parse = _parseQuery || parseQuery
  let parsedQuery
  try {
    parsedQuery = parse(query || '')
  } catch (e) {
    process.env.NODE_ENV !== 'production' && warn(false, e.message)
    parsedQuery = {}
  }
  for (const key in extraQuery) {
    parsedQuery[key] = extraQuery[key]
  }
  return parsedQuery
}

/*
 * query 参数的 key=val & key2=val2 形式 转换为 kv
 */
function parseQuery (query: string): Dictionary<string> {
  const res = {}

  query = query.trim().replace(/^(\?|#|&)/, '')

  if (!query) {
    return res
  }

  query.split('&').forEach(param => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = decode(parts.shift())
    const val = parts.length > 0
      ? decode(parts.join('='))
      : null

    if (res[key] === undefined) {
      res[key] = val
    } else if (Array.isArray(res[key])) {
      res[key].push(val)
    } else {
      res[key] = [res[key], val]
    }
  })

  return res
}

/*
 * query 参数的 kv 转换为 key=val & key2=val2
 */
export function stringifyQuery (obj: Dictionary<string>): string
{
  // undefined ：‘’
  // null：encode(key)
  // Array：null：undefined
  //        undefined:
  //        other：key = val2
  const res = obj ? Object.keys(obj).map(key => {
    const val = obj[key]

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return encode(key)
    }

    if (Array.isArray(val)) {
      const result = []
      val.forEach(val2 => {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(encode(key))
        } else {
          result.push(encode(key) + '=' + encode(val2))
        }
      })
      return result.join('&')
    }
    return encode(key) + '=' + encode(val)
  })
    .filter(x => x.length > 0).join('&') : null
  return res ? `?${res}` : ''
}
