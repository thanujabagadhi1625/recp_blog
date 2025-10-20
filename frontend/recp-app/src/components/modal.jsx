import React from "react";

function Modal({ children, onClose }) {
  return (
    <>
      <div className="backdrop" onClick={onClose}></div>
      <dialog open className="modal">
        {children}
      </dialog>
    </>
  );
}

export default Modal;
