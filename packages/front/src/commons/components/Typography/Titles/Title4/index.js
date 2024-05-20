import * as React from "react";
import styles from './styles.module.scss';


export default function Title4({ children }, ...rest) {
  return (
    <div className={`${styles.title4}`}>
      {children}
    </div>
  );
}