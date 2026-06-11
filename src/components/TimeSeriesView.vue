<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import state from '../store.js'

const chartRef = ref(null)
let chart = null

// Get selected city daily data
const dailySeries = computed(() => {
  const city = state.selectedCity
  const data = state.dailyData.filter(d => d.city === city)
  const pollutant = state.selectedPollutant
  return data.map(d => ({
    date: d.date_str,
    value: d[pollutant] ?? 0,
    grade: d.QualityGrade
  }))
})

// Get seasonal statistics for box plot mode
const seasonStats = computed(() => {
  const city = state.selectedCity
  const data = state.dailyData.filter(d => d.city === city)
  const pollutant = state.selectedPollutant
  const seasons = { 'Spring': [], 'Summer': [], 'Autumn': [], 'Winter': [] }

  data.forEach(d => {
    const m = d.month
    let season
    if (m >= 3 && m <= 5) season = 'Spring'
    else if (m >= 6 && m <= 8) season = 'Summer'
    else if (m >= 9 && m <= 11) season = 'Autumn'
    else season = 'Winter'

    seasons[season].push(d[pollutant] ?? 0)
  })

  const seasonOrder = ['Spring', 'Summer', 'Autumn', 'Winter']
  const seasonLabels = { 'Spring': '春 (3-5月)', 'Summer': '夏 (6-8月)', 'Autumn': '秋 (9-11月)', 'Winter': '冬 (12-2月)' }

  return seasonOrder.map(s => {
    const vals = seasons[s].sort((a, b) => a - b)
    if (vals.length === 0) return { season: s, label: seasonLabels[s], min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0 }
    const q1 = vals[Math.floor(vals.length * 0.25)]
    const median = vals[Math.floor(vals.length * 0.5)]
    const q3 = vals[Math.floor(vals.length * 0.75)]
    return {
      season: s,
      label: seasonLabels[s],
      min: vals[0],
      q1,
      median,
      q3,
      max: vals[vals.length - 1],
      mean: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
    }
  })
})

const pollutantLabel = computed(() => {
  const map = { AQI: 'AQI', PM25: 'PM2.5', PM10: 'PM10', SO2: 'SO₂', NO2: 'NO₂', CO: 'CO', O3: 'O₃' }
  return map[state.selectedPollutant] || state.selectedPollutant
})

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  window.addEventListener('resize', handleResize)
  renderChart()
}

function renderChart() {
  if (!chart) return
  if (state.chartMode === 'line') {
    renderLineChart()
  } else {
    renderBoxPlot()
  }
}

function renderLineChart() {
  const data = dailySeries.value
  if (!data.length) {
    chart.clear()
    chart.setOption({
      title: { text: '暂无数据', left: 'center', top: 'center', textStyle: { fontSize: 14, color: '#999' } }
    })
    return
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        if (!p) return ''
        const d = data[p.dataIndex]
        return `<strong>${d.date}</strong><br/>${pollutantLabel.value}: ${d.value}<br/>等级: ${translateGrade(d.grade)}`
      }
    },
    grid: { left: 50, right: 20, bottom: 40, top: 10 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLabel: { interval: 30, fontSize: 10, rotate: 0 },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: pollutantLabel.value,
      nameTextStyle: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      { type: 'slider', start: 0, end: 100, bottom: 0, height: 25, borderColor: '#ddd' }
    ],
    series: [{
      type: 'line',
      data: data.map(d => d.value),
      smooth: true,
      lineStyle: { width: 2, color: '#1976d2' },
      areaStyle: { color: 'rgba(25,118,210,0.08)' },
      symbol: 'none',
      markLine: {
        silent: true,
        data: [
          { yAxis: 50, label: { formatter: '优 50', color: '#4caf50', fontSize: 10 }, lineStyle: { color: '#4caf50', type: 'dashed' } },
          { yAxis: 100, label: { formatter: '良 100', color: '#ff9800', fontSize: 10 }, lineStyle: { color: '#ff9800', type: 'dashed' } },
          { yAxis: 150, label: { formatter: '轻度 150', color: '#f44336', fontSize: 10 }, lineStyle: { color: '#f44336', type: 'dashed' } }
        ]
      }
    }]
  }, true)
}

function renderBoxPlot() {
  const stats = seasonStats.value
  const label = pollutantLabel.value

  // Box plot data format: [min, q1, median, q3, max]
  const boxData = stats.map(s => [s.min, s.q1, s.median, s.q3, s.max])
  const meanValues = stats.map(s => s.mean)
  const categories = stats.map(s => s.label)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        if (!p) return ''
        const s = stats[p.dataIndex]
        return `<strong>${s.label}</strong><br/>
          ${label} 均值: ${s.mean}<br/>
          最小: ${s.min}<br/>
          Q1: ${s.q1}<br/>
          中位: ${s.median}<br/>
          Q3: ${s.q3}<br/>
          最大: ${s.max}`
      }
    },
    grid: { left: 50, right: 30, bottom: 30, top: 10 },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: label,
      nameTextStyle: { fontSize: 11 },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [
      {
        name: '箱线图',
        type: 'boxplot',
        data: boxData,
        tooltip: { show: false },
        itemStyle: {
          color: '#e3f2fd',
          borderColor: '#1976d2',
          borderWidth: 2
        },
        boxWidth: [20, 40]
      },
      {
        name: '均值',
        type: 'scatter',
        data: meanValues.map((v, i) => [i, v]),
        symbol: 'diamond',
        symbolSize: 12,
        itemStyle: { color: '#e53935' },
        label: {
          show: true,
          formatter: (p) => p.value[1],
          fontSize: 11,
          color: '#e53935',
          position: 'right'
        }
      },
      {
        name: '均值趋势',
        type: 'line',
        data: meanValues.map((v, i) => [i, v]),
        symbol: 'none',
        lineStyle: { color: '#e53935', type: 'dashed', width: 1 },
        smooth: true
      }
    ]
  }, true)
}

function handleResize() { chart?.resize() }

function translateGrade(g) {
  const map = { '优': '优', '良': '良', '轻度污染': '轻度', '中度污染': '中度', '重度污染': '重度', '严重污染': '严重' }
  return map[g] || g
}

watch(() => state.selectedCity, () => { nextTick(renderChart) })
watch(() => state.selectedPollutant, () => { nextTick(renderChart) })
watch(() => state.chartMode, () => { nextTick(renderChart) })

onMounted(() => { initChart() })
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>
