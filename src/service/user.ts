/**
 * 严肃声明：
 * 开源版本请务必保留此注释头信息，若删除我方将保留所有法律责任追究！
 * 本系统已申请软件著作权，受国家版权局知识产权以及国家计算机软件著作权保护！
 * 可正常分享和学习源码，不得用于违法犯罪活动，违者必究！
 * Copyright (c) 2020 陈尼克 all rights reserved.
 * 版权所有，侵权必究！
 */

import request from '@/utils/request'
import type { UserInfo } from './types'

export interface LoginParams {
  loginName: string
  passwordMd5: string
}

export interface RegisterParams {
  loginName: string
  password: string
}

export interface EditUserInfoParams {
  nickName?: string
  introduceSign?: string
  passwordMd5?: string
}

export function getUserInfo() {
  return request.get<UserInfo>('/user/info')
}

/** 修改用户信息（原 EditUserInfo，统一为 camelCase 命名） */
export function editUserInfo(params: EditUserInfoParams) {
  return request.put('/user/info', params)
}

/** 登录成功后 data 为 token 字符串 */
export function login(params: LoginParams) {
  return request.post<string>('/user/login', params)
}

export function logout() {
  return request.post('/user/logout')
}

export function register(params: RegisterParams) {
  return request.post('/user/register', params)
}
