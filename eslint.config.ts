import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'
import skipFormatting from 'eslint-config-prettier/flat'

// 分工：oxlint 负责 JS/TS 正确性检查（快），ESLint 负责 Vue 模板和 Vue 专属规则
export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,ts,mts,tsx,vue}'],
  },

  globalIgnores(['**/dist/**', '**/node_modules/**', 'public/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    // 路由页面与个别公共组件（Swiper）沿用原项目的单词文件名，
    // 不会与现有或未来的原生 HTML 元素混淆
    name: 'app/allow-single-word-names',
    files: ['src/views/*.vue', 'src/components/Swiper.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // 根据 .oxlintrc.json 自动关闭与 oxlint 重复的规则，必须放在最后
  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),

  // 关闭与 Prettier 冲突的格式类规则，避免 lint 和格式化互相打架
  skipFormatting,
)
