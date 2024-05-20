import React from 'react';

import Text3 from './index';

export default {
  title: 'Dorothy/Typography/Texts/Text3',
  component: Text3,
};

const Template = (args) => <Text3 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}
