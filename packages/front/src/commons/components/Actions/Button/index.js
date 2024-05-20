import * as React from "react";
import Text1 from "../../Typography/Texts/Text1";
import styles from './styles.module.scss';

export default function Button({ icon, children, variant, ...rest }) {
  return (
    <button className={`${styles.button} ${styles[variant]}`} {...rest}>
      <div className={`${styles.icon}`}>{icon}</div>
      <Text1>{children}</Text1>
    </button>
  );
}
