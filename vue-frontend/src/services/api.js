import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const api = {
  getOverview() {
    return apiClient.get('/overview')
  },
  getCityRanking() {
    return apiClient.get('/city-ranking')
  },
  getCompanyRanking() {
    return apiClient.get('/company-ranking')
  },
  getSkillRanking() {
    return apiClient.get('/skill-ranking')
  },
  getPlatformDistribution() {
    return apiClient.get('/platform-distribution')
  },
  getSkillCategory() {
    return apiClient.get('/skill-category')
  },
  getIndustryAnalysis() {
    return apiClient.get('/industry-analysis')
  },
  getCityHeatmapData() {
    return apiClient.get('/city-heatmap')
  },
  getRecommendedJobs() {
    return apiClient.get('/recommended-jobs')
  }
}

export default api