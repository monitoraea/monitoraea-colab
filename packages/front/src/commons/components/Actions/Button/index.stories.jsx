import React from 'react';
import Button from './index';
import Plus from '../../../icons/Plus';

export default {
  title: 'Dorothy/Actions/Button',
  component: Button,
  argTypes:{
    variant: {
      options: ['primary','outline','link'],
      control: { type: 'radio' }
    },
  }
};

const Template = (args) => <Button {...args}/>;

export const Default = Template.bind({});
Default.args = {
    children: "Lorem ipsum",
    variant: "primary",
    icon: [<Plus/>],
}
