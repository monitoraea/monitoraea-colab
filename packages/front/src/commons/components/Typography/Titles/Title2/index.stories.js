import React from 'react';

import Title2 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title2',
  component: Title2,
};

const Template = (args) => <Title2 {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: "Lorem ipsum",
}
