import React from "react";

function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const avatar = isUser ? "U" : "AI";
  const bubbleClassName = `message-row ${isUser ? "user-row" : "bot-row"}`;

  return (
    <div className={bubbleClassName}>
      {!isUser && <div className="avatar bot-avatar">{avatar}</div>}

      <div className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
        {message.type === "image" ? (
          <>
            <p className="message-label">Generated from: {message.prompt}</p>
            <img className="generated-image" src={message.content} alt={message.prompt} />
          </>
        ) : (
          <p className="message-text">{message.content}</p>
        )}
      </div>

      {isUser && <div className="avatar user-avatar">{avatar}</div>}
    </div>
  );
}

export default MessageBubble;
