import { useQuery } from 'react-query';
import Chart from 'react-apexcharts';
import Card from '../../../commons/components/Card';
import { HideApexDataLabelsOverflow } from '../../../hooks/HideApexDataLabelsOverflow';

import { horizontalBarChartConfig } from '../../../utils/chartUtils';

import { useMediaQuery } from '@mui/material';
import { layoutTabletMQ } from '../../../utils/configs';

export default function Viz({ lae_id, indic_id, question_id, title, options, filters = '', totalAplica }) {
  const isLayoutTablet = useMediaQuery(layoutTabletMQ);
  const chartId = 'SM';

  const { data } = useQuery(`adm/statistics/indic/sm/${lae_id}/${indic_id}/${question_id}/?${filters}`);

  if (!data) {
    return null;
  }

  return (
    <Card bottom id={chartId} sx={{ button: { color: 'inherit' } }} title={`${title}*`}>
      <div className="vis-chart" id={chartId}>
        {data && <Chart {...normalizeChartData(data, options, isLayoutTablet)} type="bar" />}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.85rem' }}>
          {!!totalAplica && <>* dos <strong>{totalAplica}</strong> que responderam SIM para pergunta base</>}
        </div>
      </div>

      <HideApexDataLabelsOverflow chartData={data} chartWrapperId={chartId} />
    </Card>
  );
}

function normalizeChartData(data, options, isLayoutTablet = false) {
  let seriesData = [];
  let categories = [];

  for (let { name, total } of data) {
    categories.push(options[name]);
    seriesData.push(total);
  }

  const chart = horizontalBarChartConfig({ mobile: isLayoutTablet, showLegend: false });

  return {
    ...{
      ...chart,
      series: [{ name: 'Quantidade', data: seriesData }],
      options: { ...chart.options, xaxis: { ...chart.options.xaxis, categories } },
    },
  };
}
