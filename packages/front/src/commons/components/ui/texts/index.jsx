import styles from './texts.module.scss';

export const Text1 = ({ children }) => {
  return <span className={styles.text1}>{children}</span>;
};

export const Text2 = ({ children }) => {
  return <span className={styles.text2}>{children}</span>;
};

export const Text3 = ({ children }) => {
  return <span className={styles.text3}>{children}</span>;
};
