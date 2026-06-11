<template>
  <div ref="chartRef" class="chart-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import state, { useStore, PROVINCE_NAME_MAP } from '../store.js'

const chartRef = ref(null)
let chart = null
let chinaJson = null  // cached geoJSON
const { provinceStats } = useStore()

function initChart() {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)

  // Click handler for province selection
  chart.on('click', function (params) {
    if (params.componentType !== 'series' || params.seriesType !== 'map') return
    const mapName = params.name
    if (!mapName) return
    const provName = PROVINCE_NAME_MAP[mapName] || mapName
    state.selectedProvince = state.selectedProvince === provName ? '' : provName
  })

  window.addEventListener('resize', handleResize)
}

function renderMap() {
  if (!chart || !chinaJson || !provinceStats.value.length) return

  echarts.registerMap('china', chinaJson)
  const provData = provinceStats.value
  const selectedProv = state.selectedProvince

  // Build inverse map
  const inv = {}
  for (const [geo, data] of Object.entries(PROVINCE_NAME_MAP)) inv[data] = geo

  const mapData = provData.map(d => ({
    name: inv[d.name] || d.name,
    value: d.value,
    itemStyle: d.name === selectedProv
      ? { areaColor: '#bbdefb', borderColor: '#1565c0', borderWidth: 2 }
      : undefined
  }))

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.seriesType !== 'map') return ''
        const p = provData.find(d => (inv[d.name] || d.name) === params.name)
        if (!p) return params.name
        const level = p.value <= 50 ? '优' : p.value <= 100 ? '良' : '污染'
        return `<strong>${p.name}</strong><br/>AQI: ${p.value} (${level})<br/>${p.cities.length} 市`
      }
    },
    visualMap: {
      min: 30, max: 100,
      text: ['高', '低'],
      inRange: { color: ['#00e400', '#ffff00', '#ff7e00', '#ff0000'] },
      calculable: true, left: 10, bottom: 20,
      itemWidth: 12, itemHeight: 80,
      textStyle: { fontSize: 10 }
    },
    geo: {
      map: 'china', roam: true,
      itemStyle: { areaColor: '#f5f5f5', borderColor: '#bbb', borderWidth: 0.5 },
      emphasis: { itemStyle: { areaColor: '#e3f2fd' }, label: { show: true } }
    },
    series: [{
      type: 'map', map: 'china', geoIndex: 0,
      data: mapData,
      itemStyle: { borderColor: '#999', borderWidth: 0.5 },
      emphasis: { label: { show: true, fontSize: 12 } }
    }]
  }, true)
}

function renderFallback() {
  if (!chart || !state.cityStats.length) return

  let data = [...state.cityStats]
  if (state.selectedProvince) {
    data = data.filter(d => d.province === state.selectedProvince)
  }
  data = data.sort((a, b) => b.avg_AQI - a.avg_AQI).slice(0, 40)

  chart.setOption({
    title: {
      text: state.selectedProvince || 'Top 40 城市 AQI (地图加载失败)',
      left: 'center', textStyle: { fontSize: 13 }
    },
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 10, bottom: 80, top: 30 },
    xAxis: { type: 'category', data: data.map(d => d.city), axisLabel: { rotate: 45, fontSize: 9 } },
    yAxis: { type: 'value', name: 'AQI' },
    dataZoom: [{ type: 'slider', bottom: 0, height: 20 }],
    series: [{
      type: 'bar',
      data: data.map(d => Math.round(d.avg_AQI)),
      itemStyle: { color: (p) => p.value <= 50 ? '#00e400' : p.value <= 100 ? '#ffff00' : p.value <= 150 ? '#ff7e00' : '#ff0000' }
    }]
  }, true)

  chart.off('click')
  chart.on('click', (params) => {
    if (params.componentType === 'series') {
      const c = state.cityStats.find(d => d.city === params.name)
      if (c) state.selectedProvince = c.province
      state.selectedCity = params.name
    }
  })
}

function tryRender() {
  if (chinaJson && provinceStats.value.length > 0) {
    renderMap()
  } else if (!chinaJson && state.loaded) {
    renderFallback()
  } else if (chinaJson && !state.loaded) {
    // geoJSON loaded, data not yet -> show empty map
    renderMap()
  }
}

function handleResize() { chart?.resize() }

// Load geoJSON once and cache it
async function loadGeoJSON() {
  try {
    const resp = await fetch('data/china.json')
    chinaJson = await resp.json()
    tryRender()
  } catch {
    if (state.loaded) renderFallback()
  }
}

// Trigger re-render when dependencies change
watch(() => state.loaded, () => { if (state.loaded) nextTick(tryRender) })
watch(() => state.selectedProvince, () => { nextTick(tryRender) })
watch(() => provinceStats.value.length, () => { nextTick(tryRender) })

onMounted(() => {
  initChart()
  loadGeoJSON()
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>
