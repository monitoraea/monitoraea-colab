import numeral from 'numeral';

export const exportChartAsSvg = chartId => () => {
  const svg = window.Apex._chartInstances.find(chart => chart.id === chartId).chart.w.globals.dom.Paper.svg();
  const svgDocument = new DOMParser().parseFromString(svg, 'image/svg+xml');
  svgDocument.firstElementChild.appendChild(document.querySelector(`#${chartId}-css`).cloneNode(true));
  const styleTagHideXCrossHairs = document.createElement('style');
  styleTagHideXCrossHairs.innerHTML = '.apexcharts-xcrosshairs { display: none }';
  svgDocument.firstElementChild.appendChild(styleTagHideXCrossHairs);

  const preface = `<?xml version="1.0" standalone="no"?>\r\n`;
  const svgBlob = new Blob(
    [
      preface,
      svgDocument.firstElementChild.outerHTML
        .replaceAll(`#${chartId} `, '')
        .replaceAll('data:realIndex', 'data-realIndex')
        .replaceAll('data\\:realIndex', 'data-realIndex'),
    ],
    {
      type: 'image/svg+xml;charset=utf-8',
    },
  );
  const svgUrl = URL.createObjectURL(svgBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = 'gráfico.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

export const map = function (value, in_min, in_max, out_min, out_max) {
  if (out_max === 0) return 0;
  return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
};

export const paleta = [
  '#326AB8', '#4A944C', '#F8801F', '#CD852B', '#A18A36',
  '#95756C', '#77A439', '#A3B426', '#CDAD29', '#F7A52C'
];

export function pieChartConfig(config) {
  // defaults
  config = { money: false, ...config };

  return {
    options: {
      legend: {
        show: false,
        showForSingleSeries: true,
      },
      colors: config.paleta || paleta,

      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: true,
        },
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          colors: undefined,
          width: '100%',
          height: 'auto',
        },
        background: {
          enabled: true,
          opacity: 0.0,
          borderWidth: 0,
        },
        /* formatter: function (val, opts) {
          return opts.w.config.series[opts.seriesIndex]
        }, */
      },
      tooltip: {
        y: {
          formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
            return `${config.money ? 'R$' : ''}${numeral(parseFloat(value)).format('0,0')}`; /* 0,0.00 */
          },
        },
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: '#A3A3A3',
        },
      },
    },
  };
}

export function radialChartConfig(config) {
  // defaults
  config = { money: false, ...config };

  return {
    options: {
      legend: {
        show: false,
        showForSingleSeries: true,
      },
      colors: paleta,

      dataLabels: {
        enabled: true,
        dropShadow: {
          enabled: false,
        },
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          colors: undefined,
          width: '100%',
          height: 'auto',
        },
        background: {
          enabled: true,
          opacity: 0.9,
        },
      },
      tooltip: {
        y: {
          formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
            return `${config.money ? 'R$' : ''}${numeral(parseFloat(value)).format('0,0')}`; /* 0,0.00 */
          },
        },
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: '#A3A3A3',
        },
      },
    },
  };
}

export function barChartConfig(config) {
  // defaults
  config = { money: false, stacked: false, percent: false, ...config };

  let chart = {
    options: {
      legend: {
        fontFamily: 'Poppins',
        fontSize: 16,
        labels: {
          colors: ['#444444'],
        },
        showForSingleSeries: true,
      },
      colors: paleta,
      chart: {
        fontFamily: 'Poppins',
        id: 'VisualizationCommerceVolumeByYearAndAccumulated',
        toolbar: {
          tools: {
            download: false,
          },
        },
      },
      xaxis: {
        labels: {
          style: {
            colors: '#A3A3A3',
          },
        },
      },

      yaxis: {
        labels: {
          formatter: value => {
            return value ? value.toFixed(0) : 0;
          },
        },
      },
      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: !config.mobile,
        /* offsetY: -100, */
        // enabledOnSeries: [0, 1],
        style: {
          fontFamily: 'Poppins',
          fontSize: '12px',
          fontWeight: 'bold',
          colors: ['#fff'],
        },
        formatter: function (value, options) {
          const intValue = parseInt(value);
          if (intValue > 1_000_000) {
            return (intValue / 1_000_000).toFixed(0) + 'MI';
          } else if (value > 1_000) {
            return (intValue / 1_000).toFixed(0) + 'MIL';
          } else {
            return intValue + (config.percent ? '%' : '');
          }
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'center',
          },
        },
      },
      tooltip: {
        x: {
          show: false,
        },
        y: {
          formatter: function (value) {
            return `${config.money ? 'R$' : ''}${numeral(parseFloat(value)).format('0,0')}${config.percent ? '%' : ''
              }`; /* 0,0.00 */
          },
        },
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: '#A3A3A3',
        },
      },
    },
  };

  if (config.stacked) chart.options.chart.stacked = true;

  return chart;
}

export function horizontalBarChartConfig(config) {
  // defaults
  config = { money: false, ...config };

  let chart = {
    options: {
      legend: {
        fontFamily: 'Poppins',
        fontSize: 16,
        labels: {
          colors: ['#444444'],
        },
        showForSingleSeries: true,
        show: config.showLegend !== false
      },
      colors: paleta,
      chart: {
        stacked: true,
        fontFamily: 'Poppins',
        id: 'VisualizationCommerceVolumeByYearAndAccumulated',
        toolbar: {
          tools: {
            download: false,
          },
        },
      },
      yaxis: {
        labels: {
          // rotate: -45,
          show: !config.mobile,
          offsetX: 0,
          maxWidth: '30vh',
          formatter: (value) => { return typeof value === 'string' ? breakText(value) : value },
        },
      },
      xaxis: {
        categories: [2018, 2019, 2020, 2021, 2022],
        labels: {
          rotate: config.mobile ? -90 : 0,
          style: {
            colors: '#A3A3A3',
          },
        },
      },
      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: !config.mobile,
        offsetY: -2,
        position: 'center',
        // enabledOnSeries: [0, 1],
        style: {
          fontFamily: 'Poppins',
          fontSize: '16px',
          fontWeight: 'bold',
          colors: ['#fff'],
          // todo a fonte do gráfico deve ser igual ao XD
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: '#000',
          opacity: 0.45,
        },
        formatter: function (value, options) {
          const intValue = parseInt(value);
          if (intValue > 1_000_000) {
            return (intValue / 1_000_000).toFixed(1) + 'MI';
          } else if (value > 1_000) {
            return (intValue / 1_000).toFixed(1) + 'MIL';
          } else {
            return intValue;
          }
        },
      },
      plotOptions: {
        bar: {
          horizontal: !config.mobile,
          distributed: true,
        },
      },
      tooltip: {
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
              return `${w.config.xaxis.categories[dataPointIndex]}:`;
            },
          },
          formatter: function (value, { series, seriesIndex, dataPointIndex, w }) {
            return `${config.money ? 'R$' : ''}${numeral(parseFloat(value)).format('0,0')}`; /* 0,0.00 */
          },
        },
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: '#A3A3A3',
        },
      },
    },
  };

  return chart;
}

export function twoBarsChartConfig(config) {
  // defaults
  config = { money: false, ...config };

  return {
    options: {
      legend: {
        fontFamily: 'Poppins',
        fontSize: 16,
        labels: {
          colors: ['#444444'],
        },
        showForSingleSeries: true,
      },
      colors: ['#F9C623', '#E46F2A'],
      chart: {
        fontFamily: 'Poppins',
        id: 'VisualizationCommerceMoneyByYearAndAccumulated',
        animations: {
          enabled: false,
        },
        toolbar: {
          tools: {
            download: false,
          },
        },
      },
      xaxis: {
        categories: [2018, 2019, 2020, 2021, 2022],
        labels: {
          style: {
            colors: '#A3A3A3',
          },
        },
      },
      fill: {
        opacity: 1,
      },
      dataLabels: {
        enabled: !config.mobile,
        /* offsetY: -100, */
        // enabledOnSeries: [0, 1],
        style: {
          fontFamily: 'Poppins',
          fontSize: '14px',
          fontWeight: 'bold',
          colors: ['#fff'],
          display: 'flex',
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: '#000',
          opacity: 0.45,
        },
        formatter: function (value) {
          const intValue = parseInt(value);
          if (intValue > 1_000_000) {
            return (intValue / 1_000_000).toFixed(1) + 'MI';
          } else if (value > 1_000) {
            return (intValue / 1_000).toFixed(1) + 'MIL';
          } else {
            return intValue;
          }
        },
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: 'center',
            // hideOverflowingLabels: true,
            orientation: 'vertical',
          },
        },
      },
      tooltip: {
        x: {
          show: false,
        },
        y: {
          formatter: function (value) {
            return `${config.money ? 'R$' : ''}${numeral(parseFloat(value)).format('0,0')}`; /* 0,0.00 */
          },
        },
      },
    },
    xaxis: {
      type: 'numeric',
      labels: {
        style: {
          colors: '#A3A3A3',
        },
      },
    },
  };
}

function breakText(value) {
  const LINE_LENGTH = 40;

  if (value.length < LINE_LENGTH) return value;

  let position = null;

  for (let idx = 0; idx < value.length; idx++) {
    if (value.charAt(idx) === ' ') {
      if (!position) position = idx;
      else if (Math.abs(LINE_LENGTH - idx) < Math.abs(LINE_LENGTH - position)) position = idx;
    }
  }

  return [value.substring(0, position), value.substring(position + 1)]

}