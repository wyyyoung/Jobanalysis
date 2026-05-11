<template>
  <div class="home-container">
    <div class="header">
      <h1><i class="el-icon-data-analysis"></i> 实习岗位数据分析平台</h1>
      <p>基于大数据的实习市场洞察与趋势分析</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <i class="el-icon-suitcase"></i>
        <h3>{{ formatNumber(overview.total_jobs) }}</h3>
        <p>实习岗位总数</p>
      </div>
      <div class="stat-card">
        <i class="el-icon-office"></i>
        <h3>{{ formatNumber(overview.total_companies) }}</h3>
        <p>合作企业数量</p>
      </div>
      <div class="stat-card">
        <i class="el-icon-location"></i>
        <h3>{{ formatNumber(overview.total_cities) }}</h3>
        <p>覆盖城市数量</p>
      </div>
      <div class="stat-card">
        <i class="el-icon-collection-tag"></i>
        <h3>{{ formatNumber(overview.total_tags) }}</h3>
        <p>技能标签数量</p>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card">
        <div class="chart-header">
          <h3><i class="el-icon-location-information"></i> 热门城市排名</h3>
          <button class="heatmap-btn" @click="goToHeatmap" title="查看热力图">
            <i class="el-icon-map-location"></i>
            <span>热力图</span>
          </button>
        </div>
        <div class="chart-container">
          <v-chart :option="cityChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card">
        <h3><i class="el-icon-office"></i> 招聘热门公司</h3>
        <div class="chart-container">
          <v-chart :option="companyChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card">
        <h3><i class="el-icon-tools"></i> 热门技能需求</h3>
        <div class="chart-container">
          <v-chart :option="skillChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card">
        <h3><i class="el-icon-pie-chart"></i> 数据来源平台</h3>
        <div class="chart-container">
          <v-chart :option="platformChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card">
        <h3><i class="el-icon-connection"></i> 技能分类统计</h3>
        <div class="chart-container">
          <v-chart :option="skillCategoryChartOption" autoresize />
        </div>
      </div>

      <div class="chart-card job-recommend-card">
        <h3><i class="el-icon-suitcase"></i> 推荐岗位</h3>
        <div 
          class="job-scroll-container" 
          ref="jobCardsWrapper"
          @mouseenter="stopAutoScroll"
          @mouseleave="startAutoScroll"
        >
          <div
            v-for="job in recommendedJobs"
            :key="job.id"
            class="job-card"
          >
            <div class="job-header">
              <h4 class="job-title">{{ job.title }}</h4>
              <span class="job-type">{{ job.job_type }}</span>
            </div>
            <div class="job-company">{{ job.company_name }}</div>
            <div class="job-info">
              <span class="info-item salary">{{ job.salary }}</span>
              <span class="info-item location">{{ job.cities }}</span>
            </div>
            <div class="job-requirements">
              <span class="req-tag">{{ job.experience }}</span>
              <span class="req-tag">{{ job.education }}</span>
            </div>
            <div class="job-time">{{ formatDate(job.publish_time) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p><i class="el-icon-info"></i> 数据实时更新 | 基于真实招聘数据分析</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { api } from '../services/api'
import { morandiColors, chartOptions, horizontalChartOptions, pieChartOptions } from '../constants/chartConfig'

use([CanvasRenderer, BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent])

const router = useRouter()

const overview = ref({
  total_jobs: 0,
  total_companies: 0,
  total_cities: 0,
  total_tags: 0
})

const cityChartOption = ref({})
const companyChartOption = ref({})
const skillChartOption = ref({})
const platformChartOption = ref({})
const skillCategoryChartOption = ref({})
const industryChartOption = ref({})

const recommendedJobs = ref([])
const jobCardsWrapper = ref(null)

const formatNumber = (num) => {
  return num ? num.toLocaleString() : '0'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '今日发布'
  if (days === 1) return '昨日发布'
  if (days < 7) return `${days}天前发布`
  return date.toLocaleDateString('zh-CN')
}

const goToHeatmap = () => {
  router.push('/city-heatmap')
}

let scrollInterval = null

const startAutoScroll = () => {
  if (scrollInterval) return
  scrollInterval = setInterval(() => {
    if (!jobCardsWrapper.value) return
    const container = jobCardsWrapper.value
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    const currentScroll = container.scrollTop
    
    if (currentScroll >= scrollHeight - clientHeight - 10) {
      container.scrollTop = 0
    } else {
      container.scrollTop += 1
    }
  }, 50)
}

const stopAutoScroll = () => {
  if (scrollInterval) {
    clearInterval(scrollInterval)
    scrollInterval = null
  }
}

const loadOverview = async () => {
  try {
    const response = await api.getOverview()
    overview.value = response.data
  } catch (error) {
    console.error('加载数据概览失败:', error)
  }
}

const createCityChart = (data) => {
  cityChartOption.value = {
    ...chartOptions,
    xAxis: {
      ...chartOptions.xAxis,
      data: data.cities
    },
    series: [{
      name: '职位数量',
      type: 'bar',
      data: data.counts,
      itemStyle: {
        color: morandiColors.primary,
        borderColor: morandiColors.primary,
        borderWidth: 1
      }
    }]
  }
}

const createCompanyChart = (data) => {
  companyChartOption.value = {
    ...horizontalChartOptions,
    yAxis: {
      ...horizontalChartOptions.yAxis,
      data: data.companies
    },
    series: [{
      name: '职位数量',
      type: 'bar',
      data: data.counts,
      itemStyle: {
        color: morandiColors.secondary,
        borderColor: morandiColors.secondary,
        borderWidth: 1
      }
    }]
  }
}

const createSkillChart = (data) => {
  skillChartOption.value = {
    ...horizontalChartOptions,
    yAxis: {
      ...horizontalChartOptions.yAxis,
      data: data.skills
    },
    series: [{
      name: '职位数量',
      type: 'bar',
      data: data.counts,
      itemStyle: {
        color: morandiColors.accent1,
        borderColor: morandiColors.accent1,
        borderWidth: 1
      }
    }]
  }
}

const createPlatformChart = (data) => {
  platformChartOption.value = {
    ...pieChartOptions,
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: data.platforms.map((platform, index) => ({
        value: data.counts[index],
        name: platform
      })),
      itemStyle: {
        borderColor: morandiColors.card,
        borderWidth: 2
      },
      label: {
        show: false
      }
    }],
    color: morandiColors.palette
  }
}

const createSkillCategoryChart = (data) => {
  skillCategoryChartOption.value = {
    ...pieChartOptions,
    series: [{
      type: 'pie',
      radius: '65%',
      data: data.categories.map((category, index) => ({
        value: data.counts[index],
        name: category
      })),
      itemStyle: {
        borderColor: morandiColors.card,
        borderWidth: 2
      },
      label: {
        show: false
      }
    }],
    color: morandiColors.palette
  }
}

const createIndustryChart = (data) => {
  industryChartOption.value = {
    ...chartOptions,
    xAxis: {
      ...chartOptions.xAxis,
      data: data.industries
    },
    series: [{
      name: '职位数量',
      type: 'bar',
      data: data.counts,
      itemStyle: {
        color: morandiColors.accent2,
        borderColor: morandiColors.accent2,
        borderWidth: 1
      }
    }]
  }
}

const loadAllCharts = async () => {
  try {
    const [cityRes, companyRes, skillRes, platformRes, skillCategoryRes, industryRes] = await Promise.all([
      api.getCityRanking(),
      api.getCompanyRanking(),
      api.getSkillRanking(),
      api.getPlatformDistribution(),
      api.getSkillCategory(),
      api.getIndustryAnalysis()
    ])

    createCityChart(cityRes.data)
    createCompanyChart(companyRes.data)
    createSkillChart(skillRes.data)
    createPlatformChart(platformRes.data)
    createSkillCategoryChart(skillCategoryRes.data)
    createIndustryChart(industryRes.data)
  } catch (error) {
    console.error('加载图表数据失败:', error)
  }
}

const loadRecommendedJobs = async () => {
  try {
    const response = await api.getRecommendedJobs()
    recommendedJobs.value = response.data.jobs
  } catch (error) {
    console.error('加载推荐岗位失败:', error)
    recommendedJobs.value = generateMockJobs()
  }
}

const generateMockJobs = () => {
  return [
    {
      id: 1,
      title: '前端开发实习生',
      company_name: '字节跳动',
      salary: '150-200/天',
      experience: '不限',
      education: '本科',
      job_type: '实习',
      publish_time: new Date().toISOString(),
      cities: '北京'
    },
    {
      id: 2,
      title: 'Python开发工程师',
      company_name: '阿里巴巴',
      salary: '200-300/天',
      experience: '3个月',
      education: '本科',
      job_type: '实习',
      publish_time: new Date(Date.now() - 86400000).toISOString(),
      cities: '杭州'
    },
    {
      id: 3,
      title: '产品经理助理',
      company_name: '腾讯',
      salary: '180-250/天',
      experience: '不限',
      education: '本科',
      job_type: '实习',
      publish_time: new Date(Date.now() - 172800000).toISOString(),
      cities: '深圳'
    },
    {
      id: 4,
      title: '数据分析实习生',
      company_name: '美团',
      salary: '160-220/天',
      experience: '不限',
      education: '本科',
      job_type: '实习',
      publish_time: new Date(Date.now() - 259200000).toISOString(),
      cities: '北京'
    },
    {
      id: 5,
      title: 'UI设计师',
      company_name: '网易',
      salary: '150-200/天',
      experience: '不限',
      education: '本科',
      job_type: '实习',
      publish_time: new Date(Date.now() - 345600000).toISOString(),
      cities: '杭州'
    },
    {
      id: 6,
      title: 'Java开发实习生',
      company_name: '华为',
      salary: '180-280/天',
      experience: '3个月',
      education: '本科',
      job_type: '实习',
      publish_time: new Date(Date.now() - 432000000).toISOString(),
      cities: '深圳, 东莞'
    }
  ]
}

onMounted(() => {
  loadOverview()
  loadAllCharts()
  loadRecommendedJobs()
  setTimeout(() => {
    startAutoScroll()
  }, 500)
})
</script>

<style scoped>
.home-container {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}

.stat-card {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid v-bind('morandiColors.border');
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card i {
  font-size: 1.8rem;
  margin-bottom: 6px;
  color: v-bind('morandiColors.primary');
}

.stat-card h3 {
  font-size: 1.6rem;
  color: v-bind('morandiColors.text.primary');
  font-weight: 600;
  margin-bottom: 2px;
}

.stat-card p {
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.8rem;
  margin: 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.chart-card {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid v-bind('morandiColors.border');
}

.chart-card h3 {
  color: v-bind('morandiColors.text.primary');
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 8px;
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 1px solid v-bind('morandiColors.border');
  letter-spacing: 0.5px;
}

.chart-card h3.clickable-title {
  cursor: pointer;
  transition: all 0.2s ease;
}

.chart-card h3.clickable-title:hover {
  color: v-bind('morandiColors.primary');
  transform: translateX(5px);
}

.chart-card h3 i {
  margin: 0 4px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 1px solid v-bind('morandiColors.border');
  letter-spacing: 0.5px;
}

.heatmap-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: v-bind('morandiColors.accent1');
  color: v-bind('morandiColors.text.primary');
  border: none;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.heatmap-btn:hover {
  background: v-bind('morandiColors.primary');
  color: white;
  transform: scale(1.05);
}

.heatmap-btn i {
  font-size: 10px;
}

.chart-container {
  position: relative;
  height: 260px;
}

.job-recommend-card {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.job-scroll-container {
  overflow-y: auto;
  width: 100%;
  height: 220px;
  padding-right: 4px;
  box-sizing: border-box;
}

.job-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.job-scroll-container::-webkit-scrollbar-track {
  background: v-bind('morandiColors.background');
  border-radius: 3px;
}

.job-scroll-container::-webkit-scrollbar-thumb {
  background: v-bind('morandiColors.border');
  border-radius: 3px;
}

.job-scroll-container::-webkit-scrollbar-thumb:hover {
  background: v-bind('morandiColors.primary');
}

.job-card {
  background: v-bind('morandiColors.background');
  border-radius: 8px;
  padding: 10px;
  border: 1px solid v-bind('morandiColors.border');
  transition: all 0.2s ease;
  cursor: pointer;
  margin-bottom: 10px;
}

.job-card:last-child {
  margin-bottom: 0;
}

.job-card:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: v-bind('morandiColors.primary');
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 5px;
}

.job-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: v-bind('morandiColors.text.primary');
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.job-type {
  font-size: 0.65rem;
  padding: 1px 5px;
  background: v-bind('morandiColors.accent1');
  color: white;
  border-radius: 3px;
  margin-left: 5px;
  flex-shrink: 0;
}

.job-company {
  font-size: 0.75rem;
  color: v-bind('morandiColors.text.secondary');
  margin-bottom: 6px;
}

.job-info {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.info-item {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
}

.info-item.salary {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
  font-weight: 500;
}

.info-item.location {
  background: rgba(33, 150, 243, 0.1);
  color: #2196F3;
}

.job-requirements {
  display: flex;
  gap: 5px;
  margin-bottom: 5px;
}

.req-tag {
  font-size: 0.65rem;
  padding: 1px 5px;
  background: v-bind('morandiColors.accent3');
  color: v-bind('morandiColors.text.secondary');
  border-radius: 3px;
}

.job-time {
  font-size: 0.65rem;
  color: v-bind('morandiColors.text.secondary');
  text-align: right;
}

.footer {
  background: v-bind('morandiColors.card');
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  color: v-bind('morandiColors.text.secondary');
  font-size: 0.8rem;
  border: 1px solid v-bind('morandiColors.border');
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.3rem;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .chart-container {
    height: 240px;
  }
}
</style>