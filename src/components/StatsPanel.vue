<template>
  <div class="stats-grid">
    <div class="stat-item" :class="aqiLevel">
      <div class="stat-value">{{ stats.avgAQI }}</div>
      <div class="stat-label">年均 AQI</div>
    </div>
    <div class="stat-item good">
      <div class="stat-value">{{ stats.goodDays }}</div>
      <div class="stat-label">优良天数</div>
    </div>
    <div class="stat-item" :class="aqiLevel">
      <div class="stat-value">{{ stats.maxAQI }}</div>
      <div class="stat-label">最高 AQI</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ stats.dominantGrade }}</div>
      <div class="stat-label">主要等级</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">{{ stats.avgPM25 }}</div>
      <div class="stat-label">年均 PM2.5 (μg/m³)</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import state from '../store.js'

const stats = computed(() => {
  const city = state.selectedCity
  const cityData = state.cityStats.find(d => d.city === city)
  if (!cityData) return { avgAQI: '-', goodDays: '-', maxAQI: '-', dominantGrade: '-', avgPM25: '-' }
  return {
    avgAQI: Math.round(cityData.avg_AQI),
    goodDays: cityData.good_days,
    maxAQI: cityData.max_AQI,
    dominantGrade: translateGrade(cityData.dominant_grade || ''),
    avgPM25: cityData.avg_PM25?.toFixed(1) || '-'
  }
})

const aqiLevel = computed(() => {
  const aqi = stats.value.avgAQI
  if (aqi === '-' || aqi === 0) return ''
  if (aqi <= 50) return 'good'
  if (aqi <= 100) return ''
  return 'bad'
})

function translateGrade(g) {
  const map = { '优': '优', '良': '良', '轻度污染': '轻度', '中度污染': '中度', '重度污染': '重度', '严重污染': '严重' }
  return map[g] || g
}
</script>
