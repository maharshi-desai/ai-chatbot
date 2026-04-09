import React, { useEffect, useMemo, useRef, useState } from "react";
import InputBox from "./InputBox";
import MessageBubble from "./MessageBubble";

const CHAT_ENDPOINT = "/api/chat";
const IMAGE_ENDPOINT = "/api/image";

const CHAT_MODEL = "Qwen/Qwen2.5-7B-Instruct-Turbo";
const IMAGE_MODEL = "stabilityai/stable-diffusion-xl-base-1.0";

function createId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createStarterMessages() {
  return [
    {
      id: createId(),
      role: "bot",
      type: "text",
      content: "Welcome to AI Chatbot Playground. Ask anything or turn your prompt into an image.",
    },
  ];
}

function buildPrompt(messages, latestPrompt) {
  // Convert chat history into OpenAI-compatible messages array.
  const history = messages
    .filter((msg) => msg.type === "text")
    .map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

  return [...history, { role: "user", content: latestPrompt }];
}

async function queryHF(messages) {
  // Route through the local Vite proxy.
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to get a response from the AI.");
  }

  return await response.json();
}

async function generateImage(prompt) {
  const response = await fetch(IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt: prompt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to generate an image right now.");
  }

  // Some providers return a blob directly, others return JSON (with URL or Base64).
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await response.json();
    // Handle OpenAI-style Base64 response
    if (data.data?.[0]?.b64_json) {
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }
    return data.data?.[0]?.url || data.url;
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

function extractBotReply(data) {
  if (data?.choices?.[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  if (data?.error) {
    throw new Error(typeof data.error === "string" ? data.error : data.error.message);
  }

  return "I received a response, but I could not parse it cleanly.";
}

function Chat() {
  const [messages, setMessages] = useState(() => createStarterMessages());
  const [input, setInput] = useState("");
  const [loadingText, setLoadingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBodyRef = useRef(null);
  const objectUrlsRef = useRef([]);

  const hasToken = useMemo(() => {
    const token = import.meta.env.VITE_HF_TOKEN?.trim();
    return Boolean(token && token !== "YOUR_HUGGING_FACE_TOKEN");
  }, []);

  useEffect(() => {
    const chatBody = chatBodyRef.current;
    if (chatBody) {
      // Keep the newest message visible after replies or loading-state changes.
      chatBody.scrollTo({
        top: chatBody.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loadingText]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const appendMessage = (message) => {
    setMessages((currentMessages) => [...currentMessages, message]);
  };

  const createErrorMessage = (error) => {
    const rawMessage = error instanceof Error ? error.message : "Something went wrong.";
    const friendlyMessage = rawMessage.toLowerCase().includes("loading")
      ? "The model is waking up on Hugging Face. Please wait a moment and try again."
      : rawMessage;

    appendMessage({
      id: createId(),
      role: "bot",
      type: "text",
      content: `Error: ${friendlyMessage}`,
    });
  };

  const guardMissingToken = () => {
    if (hasToken) {
      return false;
    }

    appendMessage({
      id: createId(),
      role: "bot",
      type: "text",
      content: "Missing VITE_HF_TOKEN. Add your Hugging Face token to the root .env file and restart Vite.",
    });

    return true;
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) {
      return;
    }

    if (guardMissingToken()) {
      return;
    }

    const nextUserMessage = {
      id: createId(),
      role: "user",
      type: "text",
      content: trimmedInput,
    };

    // Build the prompt from the existing thread so the model has lightweight context.
    const prompt = buildPrompt(messages, trimmedInput);
    setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
    setInput("");
    setLoadingText("Thinking...");
    setIsLoading(true);

    try {
      const data = await queryHF(prompt);
      const reply = extractBotReply(data, prompt);

      appendMessage({
        id: createId(),
        role: "bot",
        type: "text",
        content: reply,
      });
    } catch (error) {
      createErrorMessage(error);
    } finally {
      setLoadingText("");
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) {
      return;
    }

    if (guardMissingToken()) {
      return;
    }

    const nextUserMessage = {
      id: createId(),
      role: "user",
      type: "text",
      content: trimmedInput,
    };

    setMessages((currentMessages) => [...currentMessages, nextUserMessage]);
    setInput("");
    setLoadingText("Generating image...");
    setIsLoading(true);

    try {
      const imageUrl = await generateImage(trimmedInput);
      objectUrlsRef.current.push(imageUrl);

      // Store image replies in the same message stream so chat and media stay together.
      appendMessage({
        id: createId(),
        role: "bot",
        type: "image",
        content: imageUrl,
        prompt: trimmedInput,
      });
    } catch (error) {
      createErrorMessage(error);
    } finally {
      setLoadingText("");
      setIsLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="chat-card">
        <div className="hero-panel">
          <div>
            <p className="eyebrow">Hugging Face Playground</p>
            <h1>AI Chatbot Playground</h1>
          </div>
          <p className="hero-copy">
            Chat with Qwen and generate images with Stable Diffusion XL in one responsive interface.
          </p>
        </div>

        <div className="chat-body" ref={chatBodyRef}>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {loadingText ? (
            <div className="message-row bot-row">
              <div className="avatar bot-avatar">AI</div>
              <div className="message-bubble bot-bubble typing-bubble">
                <div className="typing-dots" aria-label={loadingText} title={loadingText}>
                  <span />
                  <span />
                  <span />
                </div>
                <p className="typing-text">{loadingText}</p>
              </div>
            </div>
          ) : null}
        </div>

        <InputBox
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onGenerateImage={handleGenerateImage}
          disabled={isLoading}
        />
      </section>
    </main>
  );
}

export default Chat;
