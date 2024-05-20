import React, { useState, useEffect, useRef } from "react";

import Lightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";
import "./styles.scss";

import deleteIcon from "./delete.png";
import uploadIcon from "./upload.png";
import documentIcon from "./document.png";
import magnifierIcon from "./magnifier.png";

export default function UploaderField({
  onChange,
  url,
  preview = true,
  viewer = true,
  minimal = false,
  alt = 'photo',
}) {
  const fileInput = useRef();

  const [previewUrl, _previewUrl] = useState(null);
  const [view, _view] = useState(false);

  useEffect(()=>{
    _previewUrl(url);
  },[url])

  const handleFile = (file) => {
    const url = URL.createObjectURL(file);

    onChange({
      url,
      file
    });

    _previewUrl(url);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleOnDrop = (event) => {
    //prevent the browser from opening the image
    event.preventDefault();
    event.stopPropagation();

    //let's grab the image file
    let imageFile = event.dataTransfer.files[0];
    handleFile(imageFile);
  };

  const handleRemove = () => {
    _previewUrl("");
    onChange(null);
    fileInput.current.value = null;
  };

  return (
    <>
      <div className={`uploader-wrapper ${minimal ? "minimal" : ""}`}>
        <div
          className={`drop_zone ${!previewUrl ? "no-image" : ""}`}
          style={{
            backgroundImage: !previewUrl ? `url(${uploadIcon})` : "unset"
          }}
          onDragOver={handleDragOver}
          onDrop={handleOnDrop}
          onClick={() => fileInput.current.click()}
        >
          {previewUrl && (
            <>
              {preview && !minimal && (
                <img className="preview" src={previewUrl} alt={alt} />
              )}
              {(!preview || minimal) && (
                <>
                  {!minimal && (
                    <img
                      className="preview"
                      src={documentIcon}
                      alt="no preview"
                    />
                  )}
                </>
              )}
            </>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInput}
            hidden
            onChange={(e) => {
              if (e.target.files.length) handleFile(e.target.files[0]);
            }}
          />
        </div>
        {previewUrl && (
          <>
            <button className="remove" onClick={handleRemove}>
              <img src={deleteIcon} alt="delete" />
            </button>
            {viewer && (
              <button className="viewer" onClick={() => _view(true)}>
                <img src={magnifierIcon} alt="view" />
              </button>
            )}
          </>
        )}
      </div>

      {view && (
        <Lightbox mainSrc={previewUrl} onCloseRequest={() => _view(false)} reactModalStyle={{ overlay: { zIndex: '2000' } }} />
      )}
    </>
  );
};
