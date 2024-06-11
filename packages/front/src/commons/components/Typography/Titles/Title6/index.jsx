import * as React from "react";
import styles from './styles.module.scss';


export default function Title6({ children }, ...rest) {
  return (
    <div className={`${styles.title6}`}>
      {children}
    </div>
  );
}