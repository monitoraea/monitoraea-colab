import React, { useState, useEffect, useRef } from 'react';

import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

import deleteIcon from './images/delete.png';
import uploadIcon from './images/upload.png';
import documentIcon from './images/document.png';
import magnifierIcon from './images/magnifier.png';

import styles from './file_uploader.module.scss';

export default function FileUploader({
  onChange,
  url,
  preview = true,
  viewer = true,
  type = 'preview',
  alt = 'photo',
  filename = '',
  accept = 'image/*',
}) {
  const fileInput = useRef();

  const [previewUrl, _previewUrl] = useState(null);
  const [view, _view] = useState(false);

  useEffect(() => {
    _previewUrl(url);
  }, [url]);

  const handleFile = file => {
    const url = URL.createObjectURL(file);

    onChange({
      url,
      file,
    });

    _previewUrl(url);
  };

  const handleDragOver = event => {
    event.preventDefault();
  };

  const handleOnDrop = event => {
    //prevent the browser from opening the image
    event.preventDefault();
    event.stopPropagation();

    //let's grab the image file
    let imageFile = event.dataTransfer.files[0];
    handleFile(imageFile);
  };

  const handleRemove = () => {
    _previewUrl('');
    onChange(null);
    fileInput.current.value = null;
  };

  return (
    <>
      <div className={`${styles['uploader-wrapper']} ${styles[type]}`}>
        <div
          className={`${styles.drop_zone} ${
            !previewUrl ? (type !== 'file' ? styles['no-image'] : styles['file-no-image']) : ''
          }`}
          style={{
            backgroundImage: !previewUrl && type !== 'file' ? `url(${uploadIcon})` : 'unset',
          }}
          onDragOver={handleDragOver}
          onDrop={handleOnDrop}
          onClick={() => fileInput.current.click()}
        >
          {previewUrl && (
            <>
              {preview && type === 'preview' && <img className={`${styles.preview}`} src={previewUrl} alt={alt} />}
              {type === 'file' && <>{filename}</>}
              {(!preview || type === 'minimal') && (
                <>
                  {!['minimal', 'file'].includes(type) && (
                    <img className={`${styles.preview}`} src={documentIcon} alt="no preview" />
                  )}
                </>
              )}
            </>
          )}

          {type === 'file' && !previewUrl && <>Clique aqui para inserir um arquivo...</>}

          <input
            type="file"
            accept={accept}
            ref={fileInput}
            hidden
            onChange={e => {
              if (e.target.files.length) handleFile(e.target.files[0]);
            }}
          />
        </div>
        {previewUrl && (
          <>
            <button className={`${styles.remove}`} onClick={handleRemove}>
              <img src={deleteIcon} alt="delete" />
            </button>
            {viewer && (
              <button
                className={`${styles.viewer}`}
                onClick={() => {
                  type !== 'file' ? _view(true) : window.open(url, 'file_preview');
                }}
              >
                <img src={magnifierIcon} alt="view" />
              </button>
            )}
          </>
        )}
      </div>

      {view && (
        <Lightbox
          mainSrc={previewUrl}
          onCloseRequest={() => _view(false)}
          reactModalStyle={{ overlay: { zIndex: '2000' } }}
        />
      )}
    </>
  );
}
