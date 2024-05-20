import { useClassnames } from 'dorothy-dna-react';
import styles from './big_square_test_component.module.scss';

export default function BigSquareTestComponent({ parentClassNames = {} }) {
  const center = useClassnames(styles, 'center', parentClassNames);
  const big_square = useClassnames(styles, 'big_square', parentClassNames);
  const half_color_1 = useClassnames(styles, 'half_color_1', parentClassNames);
  const half_color_2 = useClassnames(styles, 'half_color_2', parentClassNames);

  return (
    <>
      <div className={center}>
        <div className={big_square}>
          <div className={half_color_1}></div>
          <div className={half_color_2}></div>
        </div>
      </div>
    </>
  );
}
