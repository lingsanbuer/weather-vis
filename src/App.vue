<template>
  <div v-if="loading" class="loading-screen">
    <div class="spinner"></div>
    <span>正在加载空气质量数据 (97,297条记录)...</span>
  </div>
  <div v-else-if="error" class="error-screen">
    <div>数据加载失败: {{ error }}</div>
    <button @click="loadData">重试</button>
  </div>
  <div v-else>
    <header class="app-header">
      <div>
        <h1>全国城市空气质量可视化分析系统</h1>
        <div class="subtitle">2023年 · 覆盖31省份276城市 · 多视图联动探索</div>
      </div>
      <div class="data-badge">{{ state.meta.total_records.toLocaleString() }} 条记录</div>
    </header>

    <div class="dashboard">
      <FilterBar />
      <StatsPanel />

      <div class="card full-width">
        <div class="card-header">
          <span>🗺️ T1: 全国空气质量地理分布</span>
          <span class="badge">{{ state.selectedProvince || '全国' }}</span>
        </div>
        <div class="card-body"><MapView /></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span v-if="state.chartMode === 'line'">📈 T2: 空气质量时间演化趋势</span>
          <span v-else>📊 T3: 各污染物季节特征</span>
          <span class="badge">{{ state.selectedCity || '-' }}</span>
        </div>
        <div class="card-body"><TimeSeriesView /></div>
      </div>

      <div class="card">
        <div class="card-header">
          <span>🔀 T4: 多污染物关联分析 — 各省年均污染物平行坐标</span>
          <span class="badge">{{ state.selectedProvince || '31 省' }}</span>
        </div>
        <div class="card-body"><ParallelCoordView /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { loadData, useStore } from './store.js'
import FilterBar from './components/FilterBar.vue'
import StatsPanel from './components/StatsPanel.vue'
import MapView from './components/MapView.vue'
import TimeSeriesView from './components/TimeSeriesView.vue'
import ParallelCoordView from './components/ParallelCoordView.vue'

const { state, filteredCities } = useStore()

// When province changes, pick first city in that province
watch([() => state.selectedProvince, () => state.loaded], () => {
  if (!state.loaded) return
  const cities = filteredCities.value
  if (cities.length > 0) {
    if (!state.selectedCity || !cities.includes(state.selectedCity)) {
      state.selectedCity = cities[0]
    }
  }
})

onMounted(async () => {
  await loadData()
})
</script>
