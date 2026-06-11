<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as echarts from 'echarts'
import state from '../store.js'

const chartRef = ref(null)
let chart = null

// Simple axis labels: just chemical formulas
const AXIS_CONFIG = [
  { dim: 0, name: 'AQI', range: [20, 120] },
  { dim: 1, name: 'PM2.5', range: [10, 80] },
  { dim: 2, name: 'PM10', range: [20, 150] },
  { dim: 3, name: 'SO₂', range: [2, 30] },
  { dim: 4, name: 'NO₂', range: [5, 50] },
  { dim: 5, name: 'CO', range: [0.2, 1.5] },
  { dim: 6, name: 'O₃', range: [30, 120] }
]

// Aggregate to 31 provinces
const provinceLines = computed(() => {
  const provMap = {}
  state.parallelData.forEach(d => {
    if (!provMap[d.province]) {
      provMap[d.province] = { province: d.province, sumAQI: 0, sumPM25: 0, sumPM10: 0, sumSO2: 0, sumNO2: 0, sumCO: 0, sumO3: 0, count: 0 }
    }
    provMap[d.province].sumAQI += d.AQI || 0
    provMap[d.province].sumPM25 += d.PM25 || 0
    provMap[d.province].sumPM10 += d.PM10 || 0
    provMap[d.province].sumSO2 += d.So2 || 0
    provMap[d.province].sumNO2 += d.No2 || 0
    provMap[d.province].sumCO += d.Co || 0
    provMap[d.province].sumO3 += d.O3 || 0
    provMap[d.province].count++
  })
  return Object.values(provMap).map(d => ({
    province: d.province,
    values: [
      +(d.sumAQI / d.count).toFixed(1),
      +(d.sumPM25 / d.count).toFixed(1),
      +(d.sumPM10 / d.count).toFixed(1),
      +(d.sumSO2 / d.count).toFixed(1),
      +(d.sumNO2 / d.count).toFixed(1),
      +(d.sumCO / d.count).toFixed(2),
      +(d.sumO3 / d.count).toFixed(1)
    ]
  }))
})

const COLORS = [
  '#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa',
  '#00acc1', '#f4511e', '#3949ab', '#c0ca33', '#00897b',
  '#d81b60', '#7cb342', '#039be5', '#c43e31', '#5e35b1',
  '#fdd835', '#6d4c41', '#26c6da', '#8bc34a', '#ff7043',
  '#ab47bc', '#26a69a', '#ec407a', '#66bb6a', '#42a5f5',
  '#ffa726', '#78909c', '#7e57c2', '#ef5350', '#26c6da', '#bdbdbd'
]

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  window.addEventListener('resize', handleResize)
  renderChart()
}

function renderChart() {
  if (!chart) return
  const data = provinceLines.value
  if (!data.length) {
    chart.clear()
    chart.setOption({
      title: { text: !state.loaded ? '数据加载中...' : '暂无数据', left: 'center', top: 'center', textStyle: { fontSize: 14, color: '#999' } }
    })
    return
  }

  const selectedProv = state.selectedProvince
  const hasSelected = !!selectedProv

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (!params || !params.data) return ''
        const d = params.data
        const v = d.values
        const aqi = v[0]
        let grade = aqi <= 50 ? '优' : aqi <= 100 ? '良' : aqi <= 150 ? '轻度污染' : '中度污染'
        return `<strong style="font-size:14px">${d.province}</strong><br/>
          AQI: ${v[0]} (${grade})<br/>
          PM2.5: ${v[1]} μg/m³<br/>
          PM10: ${v[2]} μg/m³<br/>
          SO₂: ${v[3]} μg/m³<br/>
          NO₂: ${v[4]} μg/m³<br/>
          CO: ${v[5]} mg/m³<br/>
          O₃: ${v[6]} μg/m³`
      }
    },
    parallelAxis: AXIS_CONFIG.map(p => ({
      dim: p.dim,
      name: p.name,
      range: p.range,
      nameLocation: 'end',
      nameGap: 8,
      nameTextStyle: { fontSize: 14, fontWeight: 'bold', color: '#1976d2' },
      axisLabel: { fontSize: 11, color: '#666' }
    })),
    parallel: {
      left: '2%', right: '5%', bottom: '6%', top: '12%',
      parallelAxisDefault: {
        type: 'value',
        axisLine: { lineStyle: { color: '#bbb' } },
        splitLine: { show: true, lineStyle: { color: '#eee', type: 'dashed' } }
      }
    },
    series: [{
      type: 'parallel',
      smooth: true,
      lineStyle: { width: 2 },
      emphasis: {
        lineStyle: { width: 5, shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.15)' },
        label: { show: true, formatter: (p) => p.data.province, fontSize: 12, fontWeight: 'bold', color: '#333' }
      },
      data: data.map((d, i) => ({
        value: d.values,
        province: d.province,
        lineStyle: {
          color: COLORS[i % COLORS.length],
          width: hasSelected && d.province === selectedProv ? 5 : 2,
          opacity: hasSelected && d.province !== selectedProv ? 0.15 : 0.7
        }
      }))
    }]
  }, true)
}

function handleResize() { chart?.resize() }

watch(() => state.loaded, (v) => { if (v) nextTick(renderChart) })
watch(() => state.selectedProvince, () => { nextTick(renderChart) })

onMounted(() => { initChart() })
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>
