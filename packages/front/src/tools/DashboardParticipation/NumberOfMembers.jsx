import { useQuery } from 'react-query';
import Chart from 'react-apexcharts';
import Card from '../../commons/components/Card';
import { HideApexDataLabelsOverflow } from '../../hooks/HideApexDataLabelsOverflow';
import { pieChartConfig } from '../../utils/chartUtils';

import TreeLegend from '../../components/TreeLegend';

import { useMediaQuery } from '@mui/material';
import { layoutMobileL } from '../../utils/configs';
import { useEffect, useState } from 'react';

export default function Viz() {
  const chartId = 'NumberOfMembers';

  const isLayoutMobile = useMediaQuery(layoutMobileL);

  const { data } = useQuery(`adm/statistics/participation/number_of_members`);

  const [renderChart, _renderChart] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      _renderChart(true);
    }, 100);
  }, []);

  return (
    <Card middle title="Quantidade de membros">
      {data && (
        <div className={`chart ${isLayoutMobile && 'vertical'}`} id={chartId}>
          {renderChart && (
            <div className="chart-render">
              <Chart {...normalizeChartData(data)} type="donut" />
            </div>
          )}
          <TreeLegend data={data} />
        </div>
      )}
      
      <HideApexDataLabelsOverflow chartData={data} chartWrapperId={chartId} />
    </Card>
  );
}

function normalizeChartData(data) {
  // console.log(data);

  let series = [];
  let labels = [];

  for (let { name, total } of data) {
    series.push(total);
    labels.push(name);
  }

  /* Territorios devem ter cores fixas? */

  return { options: { ...pieChartConfig().options, labels }, series };
}
