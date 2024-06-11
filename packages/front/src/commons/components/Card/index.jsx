import { forwardRef } from 'react';
import styles from './card.module.scss';
import './styles.temp.scss';

const Card = forwardRef(function Card(
  {
    sx,
    middle,
    bottom,
    headerless,
    elevation = 0,
    title = 'Área de atuação',
    icon = null,
    headerActions = null,
    children,
    ...rest
  },
  ref,
) {
  return (
    <div
      className={`${styles.card} ${middle ? styles.align_middle : ''} ${bottom ? styles.align_bottom : ''} ${
        headerless ? styles.headerless : ''
      }`}
      {...rest}
      ref={ref}
    >
      <div className={`${styles.card_header}`}>
        <div className={`${styles.card_title}`}>
          {icon}
          {title}
        </div>
        <div className={`${styles.card_actions}`}>{headerActions}</div>
      </div>
      <div className={`${styles.card_body}`}>{children}</div>
    </div>
  );
});

export default Card;
