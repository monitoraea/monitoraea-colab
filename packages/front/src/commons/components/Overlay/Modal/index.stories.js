import React, { useState } from 'react';
import Modal from './index';
import Text1 from '../../Typography/Texts/Text1';
import Button from '../../Actions/Button';


export default {
  title: 'Dorothy/Overlay/Modal',
  component: Modal,
  argTypes:{
    size: {
      options: ['medium','small'],
      control: { type: 'radio' }
    },
    contentpadding: {
      options: ['medium','small','none'],
      control: { type: 'radio' }
    },
  }
};

const Template = (args) => {
  const [showModal, setModalState] = useState('hide');

  const handleOpenModal = () => {
    setModalState('show');
  };

  const onModalChange = (state) => {
    setModalState(state);
  };

  return (
    <>
      <Button variant="primary" onClick={handleOpenModal}>Abrir Modal</Button>
      <Modal
        {...args}
        modalState={showModal}
        onModalChange={onModalChange}
        sidebar={<><Text1>Lorem ipsum dolor sit</Text1><Text1>Lorem ipsum dolor sit</Text1><Text1>Lorem ipsum dolor sit</Text1><Text1>Lorem ipsum dolor sit</Text1><Text1>Lorem ipsum dolor sit</Text1><Text1>Lorem ipsum dolor sit</Text1></>}
      >
        <Text1>Lorem ipsum dolor sit</Text1>
      </Modal>
    </>
  );
};

export const Default = Template.bind({});
Default.args = {
  size: "medium",
  title: "Título da modal",
  actionlabel: "Salvar",
  bodypadding: "medium",
};
