import React from 'react';

import Title5 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title5',
  component: Title5,
};

const Template = (args) => <Title5 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum",
}
