import { useEffect, useState } from 'react';

import { useDorothy } from 'dorothy-dna-react';
import { useQuery } from 'react-query';
import axios from 'axios';

/* styles */
import styles from './indicators.module.scss';

import HelpCircle from '../../components/icons/HelpCircle.js';

export default function HelpBoxButton({ keyRef, openHelpbox }) {
    const { server } = useDorothy();
  
    const [showHelpboxButton, _showHelpboxButton] = useState(false);
  
    const [keyRefTxt, _keyRefTxt] = useState(null);
  
    const { data: helpContent } = useQuery(['help_content', { key_ref: keyRefTxt }], {
      queryFn: async () => (await axios.get(`${server}helpbox/${keyRefTxt}`)).data,
      enabled: !!keyRefTxt,
    });
  
    useEffect(() => {
      // console.log('keyRef', keyRef);
      if (!keyRef) return;
  
      _keyRefTxt(keyRef.join('.'));
    }, [keyRef]);
  
    useEffect(() => {
      _showHelpboxButton(!!helpContent);
  
      if (!helpContent) return;
  
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [helpContent]);
  
    //create an useEffect for showHelpboxButton
    /* useEffect(() => {
      console.log('showHelpboxButton', showHelpboxButton);
    }, [showHelpboxButton]); */
  
    return (
      <>
        {showHelpboxButton && (
          <button className={`button-link ${styles.helpbox_button}`} onClick={() => openHelpbox(helpContent.text)}>
            <HelpCircle />
          </button>
        )}
      </>
    );
  }