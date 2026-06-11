<template>
  <div class="filter-bar">
    <label>📍 城市:</label>
    <select v-model="state.selectedCity" class="fs-select">
      <option v-for="c in filteredCities" :key="c" :value="c">{{ c }}</option>
    </select>
    <span style="font-size:13px;color:#999;white-space:nowrap">{{ filteredCities.length }} 个城市</span>

    <label>🗺️ 省份:</label>
    <select v-model="state.selectedProvince" class="fs-select">
      <option value="">全部省份</option>
      <option v-for="p in state.meta.provinces" :key="p" :value="p">{{ p }}</option>
    </select>

    <label>📈 指标:</label>
    <select v-model="state.selectedPollutant" class="fs-select">
      <option value="AQI">AQI</option>
      <option value="PM25">PM2.5</option>
      <option value="PM10">PM10</option>
      <option value="SO2">SO₂</option>
      <option value="NO2">NO₂</option>
      <option value="CO">CO</option>
      <option value="O3">O₃</option>
    </select>

    <label>📉 模式:</label>
    <div class="mode-toggle">
      <button :class="{ active: state.chartMode === 'line' }" @click="state.chartMode = 'line'">T2 折线图</button>
      <button :class="{ active: state.chartMode === 'boxplot' }" @click="state.chartMode = 'boxplot'">T3 箱线图</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import state, { useStore } from '../store.js'

const { filteredCities } = useStore()
</script>
