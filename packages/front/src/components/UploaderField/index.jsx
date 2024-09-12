import React, { useState, useEffect, useRef } from 'react';

import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';
import './styles.temp.scss';

import deleteIcon from './delete.png';
import uploadIcon from './upload.png';
import uploadIconDisabled from './upload-disabled.png';
import documentIcon from './document.png';
import magnifierIcon from './magnifier.png';

export default function UploaderField({
  onChange,
  url,
  preview = true,
  viewer = true,
  type = 'preview',
  alt = 'photo',
  filename = '',
  accept = 'image/*, application/pdf',
  contentType,
  className,
  title,
  disabled,
}) {
  const fileInput = useRef();

  const [previewUrl, _previewUrl] = useState(null);
  const [tmpIsPDF, _tmpIsPDF] = useState(false);
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
    _tmpIsPDF(file?.name?.includes('.pdf') ? file.name : false);
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
      <div className={`uploader-wrapper ${type}`}>
        {!!title && <div className="uploader-title">{title}</div>}
        <div
          className={`drop_zone ${!!className ? `uploader-${className}` : ''} ${!previewUrl ? (type !== 'file' ? 'no-image' : 'file-no-image') : ''}`}
          style={{
            backgroundImage: !previewUrl && type !== 'file' ? `url(${!disabled ? uploadIcon : uploadIconDisabled})` : 'unset',
          }}
          onDragOver={handleDragOver}
          onDrop={handleOnDrop}
          onClick={() => fileInput.current.click()}
        >
          {previewUrl && (
            <>
              {preview && type === 'preview' && <img className="preview" src={previewUrl} alt={alt} />}
              {type === 'file' && <>{filename}</>}
              {(!preview || type === 'minimal') && (
                <>
                  {!['minimal', 'file'].includes(type) && (
                    <img className="preview" src={documentIcon} alt="no preview" />
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
            disabled={disabled}
          />
        </div>
        {previewUrl && (
          <>
            <button className="remove" onClick={handleRemove}>
              <img src={deleteIcon} alt="delete" />
            </button>
            {viewer && <>
              {!tmpIsPDF && (
                <button
                  className="viewer"
                  onClick={() => {
                    // console.log({ contentType, tmpIsPDF })
                    type !== 'file' && contentType !== 'application/pdf' ? _view(true) : window.open(url, 'file_preview');
                  }}
                >
                  <img src={magnifierIcon} alt="view" />
                </button>
              )}
              {tmpIsPDF && (
                <button
                  className="viewer"
                  alt="o arquivo só pode ser visualizado após o envio"
                  disabled
                  style={{ opacity: '0.3' }}
                >
                  <img src={magnifierIcon} alt="view" />
                </button>
              )}
            </>}
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
