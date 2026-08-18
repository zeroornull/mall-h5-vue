<template>
  <div class="address">
    <SimpleHeader name="地址管理" :back="backPath" />

    <div class="address-body">
      <van-empty v-if="!loading && !list.length" description="暂无收货地址" />
      <van-address-list
        v-model="chosenId"
        :list="formatted"
        default-tag-text="默认"
        @add="onAdd"
        @edit="onEdit"
        @select="onSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/views/Address.vue 迁移而来。
// 两个入口：设置页（默认，返回走历史栈）与确认订单页（?from=create-order，
// 返回固定回下单页，选中某地址后也携带 addressId 跳回下单页）。
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { closeToast, showLoadingToast } from 'vant'
import 'vant/es/toast/style'
import type { AddressListAddress } from 'vant'
import { getAddressList } from '@/service/address'
import type { Address } from '@/service/types'

const route = useRoute()
const router = useRouter()

const from = (route.query.from as string) ?? ''
/** 下单页入口固定返回下单页，其余入口按历史栈返回 */
const backPath = from === 'create-order' ? '/create-order' : ''

const list = ref<Address[]>([])
const loading = ref(true)
const chosenId = ref<number | string>()

onMounted(async () => {
  showLoadingToast({ message: '加载中...', forbidClick: true })
  try {
    const { data } = await getAddressList()
    list.value = data
    chosenId.value = data.find((item) => item.defaultFlag === 1)?.addressId
  } catch {
    // 错误提示由请求拦截器统一弹出
  } finally {
    loading.value = false
    closeToast()
  }
})

/** Address -> van-address-list 条目 */
const formatted = computed<AddressListAddress[]>(() =>
  list.value.map((item) => ({
    id: item.addressId,
    name: item.userName,
    tel: item.userPhone,
    address: `${item.provinceName}${item.cityName}${item.regionName}${item.detailAddress}`,
    isDefault: item.defaultFlag === 1,
  })),
)

const onAdd = () => {
  router.push({ path: '/address-edit', query: from ? { from } : {} })
}

const onEdit = (item: AddressListAddress) => {
  router.push({
    path: '/address-edit',
    query: { addressId: item.id, ...(from ? { from } : {}) },
  })
}

// 从下单页进来时，点选地址即回填给下单页
const onSelect = (item: AddressListAddress) => {
  if (from === 'create-order') {
    router.push({ path: '/create-order', query: { addressId: item.id } })
  }
}
</script>

<style lang="scss" scoped>
.address {
  // van-address-list 底部"新增地址"按钮为 danger 主题，统一改为主题绿
  --van-button-danger-background: #1baeae;
  --van-button-danger-border-color: #1baeae;

  .address-body {
    // 底部固定按钮高约 90px（含安全区 padding）
    padding-bottom: 100px;
  }
}
</style>
