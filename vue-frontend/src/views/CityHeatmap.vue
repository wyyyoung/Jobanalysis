<template>
  <div class="heatmap-container">
    <div class="header">
      <h1><i class="el-icon-map-location"></i> 全国招聘城市热力图</h1>
      <p>基于地理位置的实习岗位分布可视化</p>
    </div>

    <div class="controls">
      <el-button @click="goBack" type="primary" :icon="Back">返回首页</el-button>
      <el-button @click="refreshData" :icon="Refresh" :loading="loading">刷新数据</el-button>
      <el-select v-model="mapType" class="map-select" placeholder="选择地图">
        <el-option label="高德地图" value="gaode"></el-option>
        <el-option label="高德卫星" value="gaode-satellite"></el-option>
        <el-option label="OpenStreetMap" value="osm"></el-option>
      </el-select>
    </div>

    <div class="main-content">
      <div class="map-wrapper">
        <div ref="mapContainer" class="map-container"></div>
        <div class="map-legend">
          <h4>招聘热度图例</h4>
          <div class="legend-gradient"></div>
          <div class="legend-labels">
            <span>低</span>
            <span>中</span>
            <span>高</span>
          </div>
        </div>
        <div class="tooltip" v-if="tooltip.visible" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
          <div class="tooltip-header">{{ tooltip.city }}</div>
          <div class="tooltip-content">职位数: {{ formatNumber(tooltip.count) }}</div>
        </div>
      </div>

      <div class="sidebar">
        <div class="stats-panel">
          <h3><i class="el-icon-data-line"></i> 统计概览</h3>
          <div class="stat-item">
            <span class="label">总城市数:</span>
            <span class="value">{{ cityStats.total_cities }}</span>
          </div>
          <div class="stat-item">
            <span class="label">有招聘城市:</span>
            <span class="value">{{ cityStats.active_cities }}</span>
          </div>
          <div class="stat-item">
            <span class="label">总岗位数:</span>
            <span class="value">{{ formatNumber(cityStats.total_jobs) }}</span>
          </div>
        </div>

        <div class="top-cities">
          <h3><i class="el-icon-top"></i> TOP 10 热门城市</h3>
          <div class="city-list">
            <div
              v-for="(city, index) in topCities"
              :key="city.name"
              class="city-item"
              @click="highlightCity(city.name)"
            >
              <span class="rank">{{ index + 1 }}</span>
              <span class="name">{{ city.name }}</span>
              <span class="count">{{ formatNumber(city.count) }}</span>
            </div>
          </div>
        </div>

        <div class="selected-info" v-if="selectedCity">
          <h3><i class="el-icon-location-information"></i> 选中城市详情</h3>
          <div class="info-content">
            <div class="info-item">
              <span class="label">城市:</span>
              <span class="value">{{ selectedCity.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">岗位数:</span>
              <span class="value highlight">{{ formatNumber(selectedCity.count) }}</span>
            </div>
            <div class="info-item">
              <span class="label">占比:</span>
              <span class="value">{{ selectedCity.percentage }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Map, View, Feature } from 'ol'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { OSM, XYZ } from 'ol/source'
import VectorSource from 'ol/source/Vector.js'
import { Point } from 'ol/geom'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'
import Text from 'ol/style/Text.js'
import { transform } from 'ol/proj'
import { api } from '../services/api'
import { morandiColors } from '../constants/chartConfig'
import { Back, Refresh } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const mapContainer = ref(null)
const heatmapData = ref([])
const topCities = ref([])
const mapType = ref('gaode')

let map = null
let vectorLayer = null
let selectedFeature = null

const cityStats = ref({
  total_cities: 0,
  active_cities: 0,
  total_jobs: 0
})

const selectedCity = ref(null)

const tooltip = ref({
  visible: false,
  city: '',
  count: 0,
  x: 0,
  y: 0
})

const formatNumber = (num) => {
  return num ? num.toLocaleString() : '0'
}

const goBack = () => {
  router.push('/')
}

const refreshData = async () => {
  loading.value = true
  try {
    await loadHeatmapData()
    nextTick(() => {
      if (map) {
        updateMapData()
      }
    })
  } catch (error) {
    console.error('刷新数据失败:', error)
  } finally {
    loading.value = false
  }
}

const getCityCoordinates = (cityName) => {
  const coordinates = {
    '北京': [116.46, 39.92],
    '上海': [121.48, 31.22],
    '广州': [113.23, 23.16],
    '深圳': [114.07, 22.62],
    '杭州': [120.19, 30.26],
    '成都': [104.06, 30.67],
    '南京': [118.78, 32.04],
    '苏州': [120.62, 31.30],
    '武汉': [114.31, 30.52],
    '西安': [108.95, 34.27],
    '重庆': [106.54, 29.59],
    '天津': [117.20, 39.13],
    '长沙': [112.94, 28.23],
    '郑州': [113.65, 34.76],
    '福州': [119.30, 26.08],
    '厦门': [118.10, 24.46],
    '宁波': [121.55, 29.87],
    '青岛': [120.38, 36.07],
    '济南': [116.99, 36.67],
    '大连': [121.62, 38.91],
    '沈阳': [123.43, 41.80],
    '哈尔滨': [126.53, 45.80],
    '合肥': [117.27, 31.86],
    '昆明': [102.71, 25.04],
    '南宁': [108.33, 22.84],
    '海口': [110.35, 20.02],
    '贵阳': [106.71, 26.57],
    '太原': [112.55, 37.87],
    '石家庄': [114.48, 38.03],
    '南昌': [115.89, 28.68],
    '长春': [125.32, 43.88],
    '乌鲁木齐': [87.62, 43.82],
    '兰州': [103.82, 36.06],
    '呼和浩特': [111.75, 40.84],
    '银川': [106.27, 38.47],
    '西宁': [101.74, 36.56],
    '拉萨': [91.11, 29.97],
    '东莞': [113.75, 23.04],
    '佛山': [113.12, 23.02],
    '无锡': [120.29, 31.57],
    '温州': [120.67, 28.01],
    '金华': [119.65, 29.08],
    '绍兴': [120.58, 30.01],
    '嘉兴': [120.45, 30.74],
    '常州': [119.95, 31.79],
    '徐州': [117.2, 34.26],
    '南通': [120.86, 32.01],
    '扬州': [119.42, 32.39],
    '镇江': [119.44, 32.2],
    '盐城': [120.13, 33.38],
    '淮安': [119.02, 33.5],
    '连云港': [119.16, 34.59],
    '芜湖': [118.38, 31.33],
    '蚌埠': [117.34, 32.93],
    '马鞍山': [118.5, 31.65],
    '汕头': [116.69, 23.39],
    '珠海': [113.55, 22.2],
    '中山': [113.38, 22.52],
    '惠州': [114.42, 23.12],
    '台州': [121.42, 28.65],
    '湖州': [120.1, 30.86],
    '衢州': [118.88, 28.97],
    '丽水': [119.92, 28.45],
    '舟山': [122.2, 30.03]
  }
  return coordinates[cityName] || [0, 0]
}

const getMapLayer = (type) => {
  switch (type) {
    case 'gaode':
      return new TileLayer({
        source: new XYZ({
          url: 'https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
          crossOrigin: 'anonymous'
        })
      })
    case 'gaode-satellite':
      return new TileLayer({
        source: new XYZ({
          url: 'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
          crossOrigin: 'anonymous'
        })
      })
    case 'osm':
    default:
      return new TileLayer({
        source: new OSM()
      })
  }
}

const createHeatmapStyle = (value, maxValue, isSelected = false) => {
  const ratio = value / maxValue
  let baseColor = [255, 180, 120]
  let alpha = 0.3 + ratio * 0.5
  
  if (ratio > 0.8) {
    baseColor = [139, 69, 19]
    alpha = 0.75
  } else if (ratio > 0.6) {
    baseColor = [205, 133, 63]
    alpha = 0.65
  } else if (ratio > 0.4) {
    baseColor = [210, 105, 30]
    alpha = 0.55
  } else if (ratio > 0.2) {
    baseColor = [244, 164, 96]
    alpha = 0.45
  } else {
    baseColor = [222, 184, 135]
    alpha = 0.35
  }
  
  const size = Math.max(10, ratio * 35)

  const styles = []
  
  const outerRadius = isSelected ? size * 1.5 : size * 1.2
  const midRadius = isSelected ? size * 1.1 : size * 0.9
  const innerRadius = isSelected ? size * 0.7 : size * 0.6

  styles.push(new Style({
    image: new CircleStyle({
      radius: outerRadius,
      fill: new Fill({
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.2})`
      }),
      stroke: new Stroke({
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.3})`,
        width: 1
      })
    })
  }))

  styles.push(new Style({
    image: new CircleStyle({
      radius: midRadius,
      fill: new Fill({
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.5})`
      }),
      stroke: new Stroke({
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha * 0.6})`,
        width: 1.5
      })
    })
  }))

  styles.push(new Style({
    image: new CircleStyle({
      radius: innerRadius,
      fill: new Fill({
        color: `rgba(${baseColor[0]}, ${baseColor[1]}, ${baseColor[2]}, ${alpha})`
      }),
      stroke: new Stroke({
        color: `rgba(255, 255, 255, ${alpha * 0.8})`,
        width: isSelected ? 3 : 2
      })
    })
  }))

  return styles
}

const initMap = () => {
  if (!mapContainer.value) return
  
  const baseLayer = getMapLayer(mapType.value)
  
  vectorLayer = new VectorLayer({
    source: new VectorSource({ features: [] }),
    style: (feature) => {
      const value = feature.get('value')
      const maxValue = feature.get('maxValue') || 1
      const isSelected = selectedFeature === feature
      return createHeatmapStyle(value, maxValue, isSelected)
    }
  })

  const centerCoords = transform([104.06, 30.67], 'EPSG:4326', 'EPSG:3857')

  map = new Map({
    target: mapContainer.value,
    layers: [baseLayer, vectorLayer],
    view: new View({
      center: centerCoords,
      zoom: 4,
      projection: 'EPSG:3857'
    })
  })

  map.on('click', (event) => {
    map.forEachFeatureAtPixel(event.pixel, (feature) => {
      const cityName = feature.get('name')
      const city = heatmapData.value.find(item => item.name === cityName)
      if (city) {
        if (selectedFeature === feature) {
          selectedFeature = null
          selectedCity.value = null
        } else {
          selectedFeature = feature
          selectedCity.value = {
            name: city.name,
            count: city.count,
            percentage: ((city.value / cityStats.value.total_jobs) * 100).toFixed(2)
          }
        }
        vectorLayer.changed()
      }
    })
  })

  map.on('pointermove', (event) => {
    let found = false
    map.forEachFeatureAtPixel(event.pixel, (feature) => {
      const cityName = feature.get('name')
      const city = heatmapData.value.find(item => item.name === cityName)
      if (city) {
        found = true
        const pixel = event.pixel
        tooltip.value = {
          visible: true,
          city: city.name,
          count: city.count,
          x: pixel[0] + 15,
          y: pixel[1] + 15
        }
      }
    }, {
      hitTolerance: 15
    })

    if (!found) {
      tooltip.value.visible = false
    }
  })

  updateMapData()
}

const updateMapData = () => {
  if (!vectorLayer || !map || heatmapData.value.length === 0) return

  const maxValue = Math.max(...heatmapData.value.map(d => d.value), 1)

  const features = heatmapData.value.map(item => {
    const coords = getCityCoordinates(item.name)
    if (coords[0] !== 0 && coords[1] !== 0) {
      const transformedCoords = transform(coords, 'EPSG:4326', 'EPSG:3857')
      const feature = new Feature({
        geometry: new Point(transformedCoords),
        name: item.name,
        value: item.value,
        maxValue: maxValue
      })
      return feature
    }
    return null
  }).filter(Boolean)

  const source = vectorLayer.getSource()
  source.clear()
  source.addFeatures(features)
  vectorLayer.changed()
}

const highlightCity = (cityName) => {
  const city = heatmapData.value.find(item => item.name === cityName)
  if (city) {
    selectedCity.value = {
      name: city.name,
      count: city.count,
      percentage: ((city.value / cityStats.value.total_jobs) * 100).toFixed(2)
    }

    const coords = getCityCoordinates(cityName)
    if (coords[0] !== 0 && coords[1] !== 0 && map) {
      const transformedCoords = transform(coords, 'EPSG:4326', 'EPSG:3857')
      map.getView().animate({
        center: transformedCoords,
        zoom: 8,
        duration: 1000
      })
    }

    if (vectorLayer) {
      vectorLayer.getSource().forEachFeature((feature) => {
        if (feature.get('name') === cityName) {
          selectedFeature = feature
        } else {
          if (feature === selectedFeature) {
            selectedFeature = null
          }
        }
      })
      vectorLayer.changed()
    }
  }
}

const loadHeatmapData = async () => {
  try {
    const response = await api.getCityHeatmapData()
    heatmapData.value = response.data.data.map(item => ({
      name: item.city,
      value: item.count,
      count: item.count
    }))

    topCities.value = [...heatmapData.value].sort((a, b) => b.value - a.value).slice(0, 10)

    cityStats.value = {
      total_cities: response.data.total_cities,
      active_cities: heatmapData.value.length,
      total_jobs: response.data.total_jobs
    }
  } catch (error) {
    console.error('加载热力图数据失败:', error)
    heatmapData.value = generateMockData().map(item => ({
      ...item,
      count: item.value
    }))
    topCities.value = [...heatmapData.value].sort((a, b) => b.value - a.value).slice(0, 10)
    cityStats.value = {
      total_cities: heatmapData.value.length,
      active_cities: heatmapData.value.length,
      total_jobs: heatmapData.value.reduce((sum, item) => sum + item.value, 0)
    }
  }
}

const generateMockData = () => {
  return [
    { name: '北京', value: 12543 },
    { name: '上海', value: 11234 },
    { name: '广州', value: 8921 },
    { name: '深圳', value: 8543 },
    { name: '杭州', value: 6782 },
    { name: '成都', value: 5432 },
    { name: '南京', value: 4321 },
    { name: '武汉', value: 3987 },
    { name: '西安', value: 3564 },
    { name: '苏州', value: 3245 },
    { name: '重庆', value: 2987 },
    { name: '天津', value: 2543 },
    { name: '长沙', value: 2234 },
    { name: '郑州', value: 1987 },
    { name: '青岛', value: 1765 },
    { name: '合肥', value: 1654 },
    { name: '济南', value: 1543 },
    { name: '大连', value: 1432 },
    { name: '沈阳', value: 1321 },
    { name: '厦门', value: 1210 },
    { name: '宁波', value: 1100 },
    { name: '佛山', value: 980 },
    { name: '东莞', value: 870 },
    { name: '无锡', value: 760 },
    { name: '昆明', value: 650 },
    { name: '南宁', value: 540 },
    { name: '福州', value: 430 },
    { name: '石家庄', value: 320 },
    { name: '哈尔滨', value: 210 }
  ]
}

watch(mapType, (newType) => {
  if (map) {
    const baseLayer = getMapLayer(newType)
    map.getLayers().setAt(0, baseLayer)
  }
})

onMounted(async () => {
  await loadHeatmapData()
  nextTick(() => {
    initMap()
  })
})

onUnmounted(() => {
  if (map) {
    map.dispose()
    map = null
  }
})
</script>

<style scoped>
.heatmap-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: v-bind('morandiColors.background');
  min-height: 100vh;
}

.header {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  text-align: center;
  border: 1px solid v-bind('morandiColors.border');
}

.header h1 {
  color: v-bind('morandiColors.text.primary');
  font-size: 1.6rem;
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: 0.5px;
}

.header p {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.85rem;
  margin: 0;
}

.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.map-select {
  width: 160px;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 12px;
}

.map-wrapper {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid v-bind('morandiColors.border');
  position: relative;
}

.map-container {
  height: 600px;
  width: 100%;
  border-radius: 4px;
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(250, 247, 242, 0.95);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid v-bind('morandiColors.border');
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-legend h4 {
  margin: 0 0 8px 0;
  color: v-bind('morandiColors.text.primary');
  font-size: 0.9rem;
}

.legend-gradient {
  width: 150px;
  height: 15px;
  background: linear-gradient(to right, 
    rgba(222, 184, 135, 0.35), 
    rgba(244, 164, 96, 0.45), 
    rgba(210, 105, 30, 0.55), 
    rgba(205, 133, 63, 0.65), 
    rgba(139, 69, 19, 0.75));
  border-radius: 3px;
  margin-bottom: 4px;
  border: 1px solid rgba(139, 69, 19, 0.3);
}

.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: v-bind('morandiColors.text.secondary');
}

.tooltip {
  position: absolute;
  background: rgba(250, 247, 242, 0.98);
  border: 1px solid v-bind('morandiColors.border');
  border-radius: 6px;
  padding: 8px 12px;
  pointer-events: none;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tooltip-header {
  font-weight: 600;
  color: v-bind('morandiColors.text.primary');
  font-size: 0.9rem;
  margin-bottom: 4px;
}

.tooltip-content {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.85rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-panel,
.top-cities,
.selected-info {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid v-bind('morandiColors.border');
}

.stats-panel h3,
.top-cities h3,
.selected-info h3 {
  color: v-bind('morandiColors.text.primary');
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid v-bind('morandiColors.border');
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid v-bind('morandiColors.border');
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item .label {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.85rem;
}

.stat-item .value {
  color: v-bind('morandiColors.text.primary');
  font-weight: 600;
  font-size: 0.95rem;
}

.city-list {
  max-height: 300px;
  overflow-y: auto;
}

.city-item {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  gap: 8px;
  padding: 8px;
  margin-bottom: 4px;
  background: v-bind('morandiColors.background');
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
}

.city-item:hover {
  background: v-bind('morandiColors.accent3');
  transform: translateX(3px);
}

.city-item .rank {
  font-weight: 600;
  color: v-bind('morandiColors.primary');
  font-size: 0.9rem;
}

.city-item .name {
  color: v-bind('morandiColors.text.primary');
  font-size: 0.85rem;
}

.city-item .count {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.85rem;
  font-weight: 500;
}

.info-content {
  padding: 8px 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
}

.info-item .label {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.85rem;
}

.info-item .value {
  color: v-bind('morandiColors.text.primary');
  font-weight: 600;
  font-size: 0.9rem;
}

.info-item .value.highlight {
  color: v-bind('morandiColors.primary');
  font-size: 1rem;
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
  }

  .map-container {
    height: 500px;
  }
}

@media (max-width: 768px) {
  .map-container {
    height: 400px;
  }

  .controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .map-select {
    width: 100%;
  }
}
</style>