import * as React from "react";
import styles from './styles.module.scss';


export default function Title3({ children }, ...rest) {
  return (
    <div className={`${styles.title3}`}>
      {children}
    </div>
  );
}