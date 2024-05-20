import { useEffect, useState } from 'react';

export const HideApexDataLabelsOverflow = ({ chartWrapperId, chartData }) => {
  const [labelsCss, setLabelsCss] = useState('');
  useEffect(() => {
    const dataLabelsGroups = [];
    const tempCategoriesBlocks = document.querySelectorAll(`#${chartWrapperId} .apexcharts-series[data\\:realIndex]`) || [];
    const barsBlocks = Array.prototype.map.call(tempCategoriesBlocks, category => category.querySelectorAll('.apexcharts-bar-area'));

    const tempLabelsBlocks = document.querySelectorAll(`#${chartWrapperId} .apexcharts-datalabels[data\\:realIndex]`) || [];
    const dataLabelsTextBlocks = Array.prototype.map.call(tempLabelsBlocks, labels => labels.querySelectorAll('.apexcharts-data-labels'));

    barsBlocks.forEach((bars, blockIndex) => {
      bars.forEach((bar, index) => {
        const dataLabel = dataLabelsTextBlocks[blockIndex][index];
        const barHeight = parseFloat(bar.getAttribute('barHeight'));
        if (dataLabelsGroups[blockIndex] === undefined) {
          dataLabelsGroups[blockIndex] = [];
        }

        dataLabelsGroups[blockIndex][index] = barHeight >= dataLabel?.getBoundingClientRect().height;
      });
    });

    const chartCss = dataLabelsGroups
      .map((dataLabelsGroup, groupIndex) =>
        dataLabelsGroup
          .map(
            (shouldShow, labelIndex) =>
              `#${chartWrapperId} .apexcharts-datalabels[data\\:realIndex="${groupIndex}"] .apexcharts-data-labels:nth-child(${labelIndex + 1}) {
              display: ${shouldShow ? 'inline' : 'none'}
            }`,
          )
          .join(''),
      )
      .join('');

    setLabelsCss(chartCss);
  }, [chartWrapperId, chartData]);

  return <style id={chartWrapperId + '-css'}>{labelsCss}</style>;
};
