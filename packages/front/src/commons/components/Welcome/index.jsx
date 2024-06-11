import React, { useEffect, useState } from 'react';

import styles from './welcome.module.scss';

export default function Welcome({ user }) {
  const [show, _show] = useState(true);

  useEffect(() => {
    setTimeout(() => _show(false), 3000);
  }, []);

  if (!show) return null;

  return (
    <div id="welcome-screen" className={styles['welcome-screen']}>
      <div className={styles.message}>
        <div>Olá, {user.name}</div>
      </div>
    </div>
  );
}
