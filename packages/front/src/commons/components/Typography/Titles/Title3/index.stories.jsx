import React from 'react';

import Title3 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title3',
  component: Title3,
};

const Template = (args) => <Title3 {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Lorem ipsum",
}
