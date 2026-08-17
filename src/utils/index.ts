/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

// 由 newbee-mall-vue3-app 的 src/common/js/utils.js 迁移而来。
// 原文件中体积较大的省市区数据（tdist）拆分到了 '@/utils/tdist'。

/** 读取 URL search 中的查询参数，不存在时返回 null */
export function getQueryString(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name)
}

export const getLocal = (name: string): string | null => localStorage.getItem(name)

export const setLocal = (name: string, value: string): void => {
  localStorage.setItem(name, value)
}

// 图片地址前缀处理。原逻辑会给相对路径拼上已停服的后端域名，
// 现在相对路径（本地 Mock 图片）直接同源加载，保留此函数以兼容原页面调用
export const prefix = (url?: string | null): string => url || ''
