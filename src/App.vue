<template>
  <!--
    Element Plus 的组件内置文案（分页器 / 日期选择器 / 表格"暂无数据" / 确认框按钮…）
    靠这里跟随语言切换。漏了这层就会出现"界面中文、分页器英文"的半截现象。
  -->
  <el-config-provider :locale="elementLocale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ELEMENT_LOCALES, type LocaleKey } from '@/locales'

const { locale } = useI18n()

const elementLocale = computed(() => ELEMENT_LOCALES[locale.value as LocaleKey])
</script>
