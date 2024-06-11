import styles from './titles.module.scss';

export const Title1 = ({ children }) => {
  return <h1 className={styles.title1}>{children}</h1>;
};

export const Title2 = ({ children }) => {
  return <h2 className={styles.title2}>{children}</h2>;
};

export const Title3 = ({ children }) => {
  return <h3 className={styles.title3}>{children}</h3>;
};

export const Title4 = ({ children }) => {
  return <h4 className={styles.title4}>{children}</h4>;
};

export const Title5 = ({ children }) => {
  return <h5 className={styles.title5}>{children}</h5>;
};

export const Title6 = ({ children }) => {
  return <h6 className={styles.title6}>{children}</h6>;
};
