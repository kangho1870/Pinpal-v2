import React from 'react';
import styles from '../../css/components/modal/CommonModal.module.css';

const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    buttons = [], 
    size = 'medium',
    className = '' 
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'small':
                return styles.smallModal;
            case 'large':
                return styles.largeModal;
            default:
                return '';
        }
    };

    return (
        <div className={styles.modalContainer} onClick={handleBackdropClick}>
            <div className={`${styles.modalBox} ${getSizeClass()} ${className}`}>
                {title && (
                    <div className={styles.modalTitle}>
                        <h3>{title}</h3>
                    </div>
                )}
                
                <div className={styles.modalContents}>
                    {children}
                </div>

                {buttons.length > 0 && (
                    <div className={styles.modalBtnBox}>
                        {buttons.map((button, index) => (
                            <button
                                key={index}
                                className={`${styles.btn} ${button.className || ''}`}
                                onClick={button.onClick}
                                disabled={button.disabled}
                            >
                                {button.icon && <span className={styles.btnIcon}>{button.icon}</span>}
                                {button.text}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
