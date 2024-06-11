import React from "react";
import styles from './styles.module.scss';

function Modal({ open, onClose, title = 'Modal Title', onSend, children }) {
  return (<>
    {!!open && <div className={styles.modalBackground}>
      <div className={styles.modalContainer}>

        <div className={styles.header}>
          <div className={styles.title}>{title}</div>

          <div className={styles.titleCloseBtn}>
            <button
              onClick={() => {
                onClose();
              }}
            >
              X
            </button>
          </div>
        </div>


        <div className={styles.body}>
          {children}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancel}
            onClick={() => {
              onClose();
            }}
            id="cancelBtn"
          >
            Cancelar
          </button>
          <button onClick={onSend}>Enviar</button>
        </div>
      </div>
    </div>}
  </>);
}

export default Modal;
