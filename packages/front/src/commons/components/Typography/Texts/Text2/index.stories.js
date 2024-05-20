import React from 'react';

import Text2 from './index';

export default {
  title: 'Dorothy/Typography/Texts/Text2',
  component: Text2,
};

const Template = (args) => <Text2 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}
