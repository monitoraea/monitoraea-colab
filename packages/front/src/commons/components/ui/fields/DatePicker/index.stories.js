import React from 'react';

import DatePicker from './index';

export default {
  title: 'Engajados/ui/DatePicker',
  component: DatePicker,
};

const Template = (args) => <DatePicker {...args} />;

export const Default = Template.bind({});
Default.args = {
    inputFormat: "DD/MM/YYYY",
    views: ['year', 'month', 'day'],
}
