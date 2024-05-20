import React from 'react';

import Title4 from './index';

export default {
  title: 'Dorothy/Typography/Titles/Title4',
  component: Title4,
};

const Template = (args) => <Title4 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum",
}
