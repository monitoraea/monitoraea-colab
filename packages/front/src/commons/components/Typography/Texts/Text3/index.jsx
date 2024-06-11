import * as React from "react";
import styles from './styles.module.scss';


export default function Text3({ children }, ...rest) {
  return (
    <div className={`${styles.text3}`}>
      {children}
    </div>
  );
}