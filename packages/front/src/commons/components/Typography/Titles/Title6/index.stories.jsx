import React from 'react';

import Title6 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title6',
  component: Title6,
};

const Template = (args) => <Title6 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum",
}
