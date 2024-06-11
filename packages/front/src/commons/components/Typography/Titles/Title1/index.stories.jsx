import React from 'react';

import Title1 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title1',
  component: Title1,
};

const Template = (args) => <Title1 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum",
}
