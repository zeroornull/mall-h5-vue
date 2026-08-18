<template>
  <div class="address-edit">
    <SimpleHeader :name="isEdit ? '编辑地址' : '新增地址'" />

    <van-address-edit
      :area-list="areaList"
      :address-info="addressInfo"
      :show-delete="isEdit"
      show-set-default
      save-button-text="保存"
      delete-button-text="删除"
      @save="onSave"
      @delete="onDelete"
    />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/AddressEdit.vue 迁移而来。
// 模式由 query 区分：带 addressId 为编辑（回显 + 可删除），否则为新增。
// 省市区数据来自 @/utils/tdist（原 common/js/utils.js 拆出），
// 经 @/utils/area 适配成 vant AreaList；编辑回显时按名称反查 areaCode 定位选择器。
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast, showSuccessToast } from 'vant'
import 'vant/es/toast/style'
import type { AddressEditInfo } from 'vant'
import {
  addAddress,
  deleteAddress,
  editAddress,
  getAddressDetail,
} from '@/service/address'
import { buildAreaList, findAreaCode } from '@/utils/area'

const route = useRoute()
const router = useRouter()

const addressId = route.query.addressId as string | undefined
const isEdit = !!addressId

const areaList = buildAreaList()
const addressInfo = ref<Partial<AddressEditInfo>>({})

onMounted(async () => {
  if (!isEdit) return
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getAddressDetail(addressId)
    addressInfo.value = {
      name: data.userName,
      tel: data.userPhone,
      province: data.provinceName,
      city: data.cityName,
      county: data.regionName,
      addressDetail: data.detailAddress,
      areaCode: findAreaCode(data.provinceName, data.cityName, data.regionName),
      isDefault: data.defaultFlag === 1,
    }
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    closeToast()
  }
})

// van-address-edit 已完成必填与手机号校验，这里直接组装提交
const onSave = async (content: AddressEditInfo) => {
  const defaultFlag: 0 | 1 = content.isDefault ? 1 : 0
  const params = {
    userName: content.name,
    userPhone: content.tel,
    provinceName: content.province,
    cityName: content.city,
    regionName: content.county,
    detailAddress: content.addressDetail,
    defaultFlag,
  }
  try {
    if (isEdit) {
      await editAddress({ ...params, addressId: Number(addressId) })
    } else {
      await addAddress(params)
    }
    showSuccessToast('保存成功')
    router.go(-1)
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}

const onDelete = async () => {
  try {
    await deleteAddress(addressId!)
    showSuccessToast('删除成功')
    router.go(-1)
  } catch {
    // 错误提示由请求拦截器统一弹出
  }
}
</script>

<style lang="scss" scoped>
.address-edit {
  // 保存按钮（danger 主题）与"设为默认"开关统一为主题绿
  --van-button-danger-background: #1baeae;
  --van-button-danger-border-color: #1baeae;
  --van-switch-on-background: #1baeae;
}
</style>
