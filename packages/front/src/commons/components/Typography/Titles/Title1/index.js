import * as React from "react";
import styles from './styles.module.scss';


export default function Title1({ children }, ...rest) {
  return (
    <div className={`${styles.title1}`}>
      {children}
    </div>
  );
}