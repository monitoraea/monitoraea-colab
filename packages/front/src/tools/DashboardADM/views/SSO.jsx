import { useQuery } from 'react-query';
import Chart from 'react-apexcharts';
import Card from '../../../commons/components/Card';
import { HideApexDataLabelsOverflow } from '../../../hooks/HideApexDataLabelsOverflow';
import { pieChartConfig } from '../../../utils/chartUtils';

import TreeLegend from '../../../components/TreeLegend';

import { useMediaQuery } from '@mui/material';
import { layoutMobileL } from '../../../utils/configs';
import { useEffect, useState } from 'react';

export default function Viz({ lae_id, indic_id, question_id, title, options, filters = '', totalAplica }) {
  const chartId = 'SSO';

  const isLayoutMobile = useMediaQuery(layoutMobileL);

  const { data } = useQuery(`adm/statistics/indic/sso/${lae_id}/${indic_id}/${question_id}/?${filters}`);

  const [renderChart, _renderChart] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      _renderChart(true);
    }, 100);
  }, []);

  return (
    <Card middle title={`${title}*`}>
      {data && (
        <div className={`chart ${isLayoutMobile && 'vertical'}`} id={chartId}>
          {renderChart && (
            <div className="chart-render">
              <Chart {...normalizeChartData(data, options)} type="donut" />
            </div>
          )}
          <TreeLegend data={data} options={options} />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '0.85rem' }}>
          {!!totalAplica && <>* dos <strong>{totalAplica}</strong> que responderam SIM para pergunta base</>}
        </div>
      </div>

      <HideApexDataLabelsOverflow chartData={data} chartWrapperId={chartId} />
    </Card>
  );
}

function normalizeChartData(data, options) {
  // console.log(data);

  let series = [];
  let labels = [];

  for (let { name, total } of data) {
    series.push(total);
    labels.push(options[name]);
  }

  /* Territorios devem ter cores fixas? */

  return { options: { ...pieChartConfig().options, labels }, series };
}
