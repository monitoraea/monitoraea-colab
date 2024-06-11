import React from 'react';

import Text1 from './index';

export default {
  title: 'Dorothy/Typography/Texts/Text1',
  component: Text1,
};

const Template = (args) => <Text1 {...args} />;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
}
