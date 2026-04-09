import React from "react";

function InputBox({
  value,
  onChange,
  onSend,
  onGenerateImage,
  disabled,
}) {
  const handleKeyDown = async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await onSend();
    }
  };

  return (
    <div className="input-shell">
      <textarea
        className="chat-input"
        placeholder="Type a message or an image prompt..."
        rows="2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      <div className="button-row">
        <button className="action-button secondary-button" onClick={onGenerateImage} disabled={disabled}>
          Generate Image
        </button>
        <button className="action-button primary-button" onClick={onSend} disabled={disabled}>
          Send
        </button>
      </div>
    </div>
  );
}

export default InputBox;
