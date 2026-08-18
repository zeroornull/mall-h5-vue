<template>
  <div class="about">
    <SimpleHeader name="关于我们" />

    <div class="card">
      <van-icon class="logo" name="shop-o" />
      <div class="title">新蜂商城</div>
      <div class="desc">
        本项目是 newbee-mall-vue3-app 的学习性迁移版本： 使用 Vue
        3、TypeScript、Vite 与 Vant 4 重写，
        原线上后端已停止服务，开发环境由本地 Mock 提供全部接口。
      </div>
      <div class="list">
        <div class="row">
          技术栈：Vue 3 + TypeScript + Vite + Pinia + Vant 4
        </div>
        <div class="row">工程化：oxlint + ESLint + Prettier</div>
        <div class="row">原项目版权归 陈尼克 所有，仅作学习交流使用</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 静态介绍页，无逻辑
</script>

<style lang="scss" scoped>
.about {
  min-height: 100vh;
  background: #f7f8fa;
}

.card {
  margin: 15px;
  padding: 30px 20px;
  text-align: center;
  background: #fff;
  border-radius: 8px;

  .logo {
    color: #1baeae;
    font-size: 60px;
  }

  .title {
    margin-top: 10px;
    color: #222333;
    font-size: 20px;
    font-weight: bold;
  }

  .desc {
    margin-top: 15px;
    color: #666;
    font-size: 14px;
    line-height: 1.8;
    text-align: left;
  }

  .list {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    text-align: left;

    .row {
      margin-top: 6px;
      color: #999;
      font-size: 13px;
    }
  }
}
</style>
