import { useState } from 'react';

interface ModalProps {
  title: string;
  content: string;
  trigger: React.ReactNode;
}

export default function Modal({ title, content, trigger }: ModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <div onClick={openModal}>{trigger}</div>
      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content neo-brutalist" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{title}</h3>
            <div className="modal-body" dangerouslySetInnerHTML={{ __html: content }} />
            <button onClick={closeModal} className="neo-brutalist modal-close">
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}