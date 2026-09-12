<template>
  <div class="brand" :class="{ 'is-lg': size === 'large' }">
    <!-- 用 CSS 图形拼一个近似截图里的"猫头鹰"标识，后续换成设计给的 svg/png 即可 -->
    <div class="owl">
      <span class="ear ear-l" />
      <span class="ear ear-r" />
      <span class="head">
        <span class="eye eye-l" />
        <span class="eye eye-r" />
        <span class="beak" />
      </span>
      <span class="wing wing-l" />
      <span class="wing wing-r" />
      <span class="body" />
    </div>
    <span v-if="showText" class="brand-text">CMP 3.0</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'default' | 'large'
    showText?: boolean
  }>(),
  { size: 'default', showText: false }
)
</script>

<style scoped lang="scss">
.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  user-select: none;
}

.brand-text {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: $primary;
}

.owl {
  position: relative;
  width: 30px;
  height: 30px;
  flex: none;
}

.is-lg .owl {
  width: 52px;
  height: 52px;
}

.ear {
  position: absolute;
  top: 0;
  width: 25%;
  height: 22%;
  background: #8a5a2b;
  border-radius: 2px;
}

.ear-l {
  left: 8%;
  transform: rotate(-18deg);
}

.ear-r {
  right: 8%;
  transform: rotate(18deg);
}

.head {
  position: absolute;
  top: 8%;
  left: 4%;
  width: 92%;
  height: 62%;
  background: #a9713a;
  border-radius: 50% 50% 42% 42%;
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.08);
}

.eye {
  position: absolute;
  top: 26%;
  width: 34%;
  height: 44%;
  background: #fff;
  border-radius: 50%;

  &::after {
    content: '';
    position: absolute;
    inset: 30% 30% 22% 30%;
    background: #2b2b2b;
    border-radius: 50%;
  }
}

.eye-l {
  left: 12%;
}

.eye-r {
  right: 12%;
}

.beak {
  position: absolute;
  left: 50%;
  top: 56%;
  width: 14%;
  height: 22%;
  background: #f0a52a;
  border-radius: 40% 40% 60% 60%;
  transform: translateX(-50%);
}

.wing {
  position: absolute;
  bottom: 4%;
  width: 22%;
  height: 34%;
  background: #8a5a2b;
  border-radius: 45%;
}

.wing-l {
  left: 2%;
  transform: rotate(12deg);
}

.wing-r {
  right: 2%;
  transform: rotate(-12deg);
}

.body {
  position: absolute;
  left: 24%;
  bottom: 4%;
  width: 52%;
  height: 42%;
  background: #c98a48;
  border-radius: 45% 45% 50% 50%;
}
</style>
