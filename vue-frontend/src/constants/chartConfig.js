export const morandiColors = {
  primary: '#A89F91',
  secondary: '#8B7E70',
  accent1: '#C4B8A8',
  accent2: '#D4CCC4',
  accent3: '#E8E0D8',
  accent4: '#5C5347',
  palette: ['#A89F91', '#8B7E70', '#C4B8A8', '#D4CCC4', '#E8E0D8', '#5C5347', '#9D9488', '#7A6E62'],
  background: '#F5F0EB',
  card: '#FAF7F2',
  border: '#E8E0D8',
  text: {
    primary: '#5C5347',
    secondary: '#8B7E70'
  }
}

export const chartOptions = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderColor: morandiColors.border,
    borderWidth: 1,
    textStyle: {
      color: morandiColors.text.secondary
    },
    formatter: function(params) {
      const data = params[0]
      return `<strong style="color: ${morandiColors.text.primary};">${data.name}</strong><br/>职位数: ${data.value.toLocaleString()}`
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    axisLabel: {
      color: morandiColors.text.secondary,
      fontSize: 10,
      rotate: 45
    },
    axisLine: {
      lineStyle: {
        color: morandiColors.border
      }
    },
    axisTick: {
      show: false
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: morandiColors.text.secondary,
      fontSize: 10,
      formatter: function(value) {
        return value.toLocaleString()
      }
    },
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    splitLine: {
      lineStyle: {
        color: morandiColors.border,
        type: 'dashed'
      }
    }
  }
}

export const horizontalChartOptions = {
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderColor: morandiColors.border,
    borderWidth: 1,
    textStyle: {
      color: morandiColors.text.secondary
    },
    formatter: function(params) {
      const data = params[0]
      return `<strong style="color: ${morandiColors.text.primary};">${data.name}</strong><br/>职位数: ${data.value.toLocaleString()}`
    }
  },
  grid: {
    left: '10%',
    right: '8%',
    bottom: '3%',
    top: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'value',
    axisLabel: {
      color: morandiColors.text.secondary,
      fontSize: 10,
      formatter: function(value) {
        return value.toLocaleString()
      }
    },
    axisLine: {
      show: false
    },
    axisTick: {
      show: false
    },
    splitLine: {
      lineStyle: {
        color: morandiColors.border,
        type: 'dashed'
      }
    }
  },
  yAxis: {
    type: 'category',
    axisLabel: {
      color: morandiColors.text.secondary,
      fontSize: 9
    },
    axisLine: {
      lineStyle: {
        color: morandiColors.border
      }
    },
    axisTick: {
      show: false
    }
  }
}

export const pieChartOptions = {
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(250, 247, 242, 0.95)',
    borderColor: morandiColors.border,
    borderWidth: 1,
    textStyle: {
      color: morandiColors.text.secondary
    },
    formatter: function(params) {
      return `<strong style="color: ${morandiColors.text.primary};">${params.name}</strong><br/>数量: ${params.value.toLocaleString()} (${params.percent}%)`
    }
  },
  legend: {
    orient: 'vertical',
    right: '5%',
    top: 'center',
    textStyle: {
      color: morandiColors.text.secondary,
      fontSize: 9
    },
    itemWidth: 12,
    itemHeight: 12,
    itemGap: 8
  }
}