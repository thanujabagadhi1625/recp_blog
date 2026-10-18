import React, { useEffect } from "react";

function Modal({ children, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <>
      <div className="backdrop" onClick={onClose}></div>
      <dialog open role="dialog" aria-modal="true" className="modal">
        {children}
      </dialog>
    </>
  );
}

export default Modal;
