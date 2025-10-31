import { useEffect, useState } from 'react';

import { useDorothy, useUser, useRouter } from 'dorothy-dna-react';
import { useQuery } from 'react-query';
import axios from 'axios';

/* styles */
import styles from './styles.module.scss';

import HelpCircle from '../icons/HelpCircle.jsx';

import { CMS_COMMUNITY } from '../../utils/configs.jsx';

export default function HelpBoxButton({ type, keyRef, prefix='', openHelpbox }) {
    const { server } = useDorothy();
    const { user } = useUser();
    const { currentCommunity } = useRouter();

    const [showHelpboxButton, _showHelpboxButton] = useState(false);

    const [keyRefTxt, _keyRefTxt] = useState(null);

    const { data: helpContent } = useQuery(['help_content', { key_ref: keyRefTxt }], {
      queryFn: async () => (await axios.get(`${server}helpbox/${keyRefTxt}`)).data,
      enabled: !!keyRefTxt,
    });

    useEffect(() => {
      if (!keyRef) return;

      _keyRefTxt(`${prefix}${keyRef.join(',')}`);
    }, [keyRef]);

    useEffect(() => {
      _showHelpboxButton(!!helpContent || user.membership.find(m => m.id === CMS_COMMUNITY));

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
          <button className={`button-link ${styles.helpbox_button}`} onClick={() => openHelpbox(helpContent || { type: type || 'indic', key_ref: keyRef, community: currentCommunity })}>
            <HelpCircle />
          </button>
        )}
      </>
    );
  }