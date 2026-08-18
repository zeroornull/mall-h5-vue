// tdist 省市区数据到 vant Area 组件格式的适配层，仅地址编辑页使用。
import type { AreaList } from 'vant'
import { tdist } from './tdist'

/**
 * tdist -> vant AreaList。
 * 编码规则：省 XX0000 / 市 XXYY00 / 区县 XXYYZZ，
 * 因此先判 '0000' 结尾（省），再判 '00' 结尾（市），其余为区县。
 */
export function buildAreaList(): AreaList {
  const province_list: Record<string, string> = {}
  const city_list: Record<string, string> = {}
  const county_list: Record<string, string> = {}

  for (const [code, [name]] of Object.entries(tdist)) {
    if (code.endsWith('0000')) {
      province_list[code] = name
    } else if (code.endsWith('00')) {
      city_list[code] = name
    } else {
      county_list[code] = name
    }
  }

  return { province_list, city_list, county_list }
}

/**
 * 按省/市/区县名称反查区县编码（编辑模式回显选择器用），查不到返回 ''。
 * 通过 parentCode 逐级匹配，避免不同省份同名区县互相干扰。
 */
export function findAreaCode(
  provinceName: string,
  cityName: string,
  regionName: string,
): string {
  const entries = Object.entries(tdist)

  const province = entries.find(
    ([code, [name]]) => code.endsWith('0000') && name === provinceName,
  )
  if (!province) return ''

  const city = entries.find(
    ([, [name, parent]]) => parent === province[0] && name === cityName,
  )
  if (!city) return ''

  const county = entries.find(
    ([, [name, parent]]) => parent === city[0] && name === regionName,
  )
  return county?.[0] ?? ''
}
