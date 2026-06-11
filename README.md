# 全国城市空气质量可视化分析系统

## 项目简介

基于 2023 年全国 276 城市全年空气质量数据（97,297 条记录），构建多视图联动的可视化分析系统，支持：

- **T1**: 全国空气质量地理分布（地图视图）
- **T2**: 空气质量时间演化趋势（折线图）
- **T3**: 各污染物季节特征（箱线图）
- **T4**: 多污染物关联分析（平行坐标）

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 可视化 | ECharts 5 |
| 构建 | Vite 5 |
| 数据处理 | Python pandas |
| 部署 | GitHub Pages / Vercel |

## 环境要求

- Node.js >= 18
- npm >= 8

## 快速启动

```bash
# 1. 进入项目目录
cd weather-vis

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器访问 http://localhost:3000
```

## 构建部署

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接部署到 GitHub Pages 或 Vercel。

## 项目结构

```
weather-vis/
├── public/
│   └── data/            # 预处理后的 JSON 数据文件
├── src/
│   ├── main.js          # 入口文件
│   ├── App.vue          # 主组件，页面布局与联动
│   ├── store.js         # 全局状态管理
│   ├── style.css        # 全局样式
│   └── components/
│       ├── FilterBar.vue        # 筛选器栏
│       ├── MapView.vue          # 地图视图 (T1)
│       ├── TimeSeriesView.vue   # 折线图/箱线图 (T2/T3)
│       ├── ParallelCoordView.vue# 平行坐标 (T4)
│       └── StatsPanel.vue       # 统计面板
├── index.html
├── package.json
└── vite.config.js
```

## 数据处理

原始数据位于 `../weather_datas_202407261219.xlsx`，通过以下命令处理：

```bash
python ../process_data.py
```

处理内容包括：
- 移除 AQI=0 的异常记录
- 添加季节、城市群等衍生字段
- 按城市、月份聚合统计
- 导出为 JSON 供前端加载

## 联动交互

| 操作 | 联动效果 |
|------|----------|
| 选择城市 | 时间序列图、箱线图、统计面板同步更新 |
| 选择省份 | 地图高亮该省份城市 |
| 切换污染物 | 折线图/箱线图/平行坐标同步切换 |
| T2/T3 模式切换 | 同一区域切换折线图/箱线图 |
| 平行坐标 brush | 筛选数据范围（高亮对应城市） |

## 数据来源

中国环境监测总站全国城市空气质量实时发布平台公开数据（2023 年）。
