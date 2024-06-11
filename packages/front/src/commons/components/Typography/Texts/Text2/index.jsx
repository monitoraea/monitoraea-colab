import * as React from "react";
import styles from './styles.module.scss';


export default function Text2({ children }, ...rest) {
  return (
    <div className={`${styles.text2}`}>
      {children}
    </div>
  );
}