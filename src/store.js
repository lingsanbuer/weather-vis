import { reactive, computed } from 'vue'

const state = reactive({
  cityStats: [],
  dailyData: [],
  monthlyStats: [],
  parallelData: [],
  meta: { cities: [], provinces: [], total_records: 0, date_range: [] },

  selectedCity: null,
  selectedProvince: '',
  chartMode: 'line',
  selectedPollutant: 'AQI',

  loaded: false,
  loading: true,
  error: null
})

export const PROVINCE_NAME_MAP = {
  '北京市': '北京', '天津市': '天津', '上海市': '上海', '重庆市': '重庆',
  '河北省': '河北', '山西省': '山西', '辽宁省': '辽宁', '吉林省': '吉林',
  '黑龙江省': '黑龙江', '江苏省': '江苏', '浙江省': '浙江', '安徽省': '安徽',
  '福建省': '福建', '江西省': '江西', '山东省': '山东', '河南省': '河南',
  '湖北省': '湖北', '湖南省': '湖南', '广东省': '广东', '海南省': '海南',
  '四川省': '四川', '贵州省': '贵州', '云南省': '云南', '陕西省': '陕西',
  '甘肃省': '甘肃', '青海省': '青海', '台湾省': '台湾',
  '内蒙古自治区': '内蒙古', '广西壮族自治区': '广西',
  '西藏自治区': '西藏', '宁夏回族自治区': '宁夏',
  '新疆维吾尔自治区': '新疆', '香港特别行政区': '香港', '澳门特别行政区': '澳门'
}

export async function loadData() {
  try {
    const [cityStats, dailyData, monthlyStats, parallelData, meta] = await Promise.all([
      fetch('data/city_stats.json').then(r => r.json()),
      fetch('data/daily_data.json').then(r => r.json()),
      fetch('data/monthly_stats.json').then(r => r.json()),
      fetch('data/parallel_data.json').then(r => r.json()),
      fetch('data/meta.json').then(r => r.json()),
    ])
    state.cityStats = cityStats
    state.dailyData = dailyData
    state.monthlyStats = monthlyStats
    state.parallelData = parallelData
    state.meta = meta

    if (meta.cities && meta.cities.length > 0) {
      state.selectedCity = meta.cities[0]
    }
    state.loaded = true
    state.loading = false
  } catch (e) {
    state.error = e.message
    state.loading = false
    console.error('Data load failed:', e)
  }
}

export function useStore() {
  const filteredCities = computed(() => {
    let cities = state.cityStats.map(d => d.city)
    if (state.selectedProvince) {
      const provCities = new Set(
        state.cityStats.filter(d => d.province === state.selectedProvince).map(d => d.city)
      )
      cities = cities.filter(c => provCities.has(c))
    }
    return [...new Set(cities)].sort()
  })

  const selectedCityData = computed(() => {
    if (!state.selectedCity) return []
    return state.dailyData.filter(d => d.city === state.selectedCity)
  })

  const selectedCityMonthlyStats = computed(() => {
    if (!state.selectedCity) return []
    return state.monthlyStats.filter(d => d.city === state.selectedCity)
  })

  const provinceStats = computed(() => {
    const map = {}
    state.cityStats.forEach(d => {
      if (!map[d.province]) {
        map[d.province] = { totalAQI: 0, count: 0, cities: [] }
      }
      map[d.province].totalAQI += d.avg_AQI
      map[d.province].count++
      map[d.province].cities.push(d.city)
    })
    return Object.entries(map).map(([name, v]) => ({
      name,
      value: Math.round(v.totalAQI / v.count * 10) / 10,
      cities: v.cities
    }))
  })

  return { state, filteredCities, selectedCityData, selectedCityMonthlyStats, provinceStats }
}

export default state
