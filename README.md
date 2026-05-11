# Jobanalysis
A data visualization platform for analyzing internship job market trends in China. Features interactive charts, city heatmaps, and job recommendation systems.
## 核心功能

### 📊 数据概览仪表盘
- 实时展示岗位总数、企业数量、覆盖城市及技能分类等核心指标

### 🗺️ 全国招聘热力图
- 基于 OpenLayers 构建的交互式地图
- 支持多种底图切换（高德地图、卫星图、OpenStreetMap）
- 蜂窝状热力图效果，展示各城市招聘热度分布
- TOP 10 热门城市实时排名

### 📈 多维数据分析
- **城市排名分析**：柱状图展示各城市岗位分布
- **企业招聘分析**：横向条形图呈现热门招聘企业
- **技能需求分析**：可视化展示市场紧缺技能
- **平台来源分析**：饼图展示岗位来源分布
- **行业分布分析**：跨行业岗位对比

### 🔔 智能岗位推荐
- 基于发布时间的智能推荐算法
- 自动滚动展示机制
- 卡片式设计，包含完整岗位信息

## 技术架构

### 前端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | 渐进式 JavaScript 框架 |
| Vite | 6.x | 下一代前端构建工具 |
| ECharts | 5.x | 企业级数据可视化方案 |
| OpenLayers | 7.x | 高性能地图渲染引擎 |
| Element Plus | 2.x | Vue 3 组件库 |

### 后端技术栈
| 技术 | 版本 | 说明 |
|------|------|------|
| Flask | 2.x | 轻量级 Python Web 框架 |
| SQLAlchemy | 2.x | ORM 数据库工具 |
| PostgreSQL | 13+ | 企业级关系型数据库 |
| pandas | 2.x | 数据分析处理库 |

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+
- PostgreSQL 13+

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/overview` | GET | 获取数据概览 |
| `/api/city-jobs` | GET | 城市岗位分布 |
| `/api/company-jobs` | GET | 企业岗位分布 |
| `/api/skill-jobs` | GET | 技能需求分布 |
| `/api/platform-jobs` | GET | 平台来源分布 |
| `/api/industry-jobs` | GET | 行业分布 |
| `/api/city-coordinates` | GET | 城市坐标数据 |
| `/api/recommended-jobs` | GET | 推荐岗位列表 |

