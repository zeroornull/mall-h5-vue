<template>
  <div class="img-verify">
    <canvas ref="verify" :width="width" :height="height" @click="handleDraw" />
  </div>
</template>

<script setup lang="ts">
// 由 newbee-mall-vue3-app 的 src/components/VueImageVerify.vue 迁移而来：
// 纯前端 canvas 图形验证码，随机 4 位字符 + 干扰线 + 噪点，点击重新绘制。
import { onMounted, ref } from 'vue'

/** 字符池：去掉了 0/O、1/I/L 等易混淆字符 */
const pool = 'ABCDEFGHJKMNPQRSTWXYZ23456789'
const width = 120
const height = 40

const verify = ref<HTMLCanvasElement | null>(null)

/** 当前验证码内容，父组件通过模板 ref 读取后与用户输入比对 */
const imgCode = ref('')

/** [min, max) 区间内的随机整数 */
const randomNum = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min) + min)

/** 三个色值均落在 [min, max) 的随机颜色：区间偏高则浅（背景/干扰用），偏低则深（文字用） */
const randomColor = (min: number, max: number) =>
  `rgb(${randomNum(min, max)},${randomNum(min, max)},${randomNum(min, max)})`

const draw = (): string => {
  const ctx = verify.value?.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = randomColor(180, 230)
  ctx.fillRect(0, 0, width, height)

  // 随机 4 位字符，逐个平移到各自区域并随机旋转，增加机器识别难度
  let code = ''
  for (let i = 0; i < 4; i++) {
    const text = pool[randomNum(0, pool.length)]
    code += text
    const fontSize = randomNum(18, 40)
    const deg = randomNum(-30, 30)
    ctx.font = `${fontSize}px SimHei, sans-serif`
    ctx.textBaseline = 'top'
    ctx.fillStyle = randomColor(80, 150)
    ctx.save()
    ctx.translate(30 * i + 15, 15)
    ctx.rotate((deg * Math.PI) / 180)
    ctx.fillText(text, -10, -15)
    ctx.restore()
  }

  // 5 条浅色干扰线
  for (let i = 0; i < 5; i++) {
    ctx.beginPath()
    ctx.moveTo(randomNum(0, width), randomNum(0, height))
    ctx.lineTo(randomNum(0, width), randomNum(0, height))
    ctx.strokeStyle = randomColor(180, 230)
    ctx.closePath()
    ctx.stroke()
  }

  // 40 个噪点
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    ctx.arc(randomNum(0, width), randomNum(0, height), 1, 0, 2 * Math.PI)
    ctx.fillStyle = randomColor(150, 200)
    ctx.fill()
  }

  return code
}

/** 点击画布刷新验证码 */
const handleDraw = () => {
  imgCode.value = draw()
}

onMounted(() => {
  imgCode.value = draw()
})

defineExpose({ imgCode })
</script>

<style lang="scss" scoped>
.img-verify {
  canvas {
    cursor: pointer;
  }
}
</style>
