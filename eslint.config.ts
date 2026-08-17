import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginOxlint from 'eslint-plugin-oxlint'

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
    // 路由页面沿用原项目的单词文件名（Home.vue、Cart.vue 等），
    // 它们只经路由挂载、不会当作标签使用，不存在与原生元素混淆的问题
    name: 'app/views-allow-single-word-names',
    files: ['src/views/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // 根据 .oxlintrc.json 自动关闭与 oxlint 重复的规则，必须放在最后
  ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
