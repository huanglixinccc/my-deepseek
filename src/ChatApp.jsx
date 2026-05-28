import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import MessageContent from './components/MessageContent';
import { generateImageWithExplanation, getApiConfig } from './services/chatApi';
import { useChatScroll } from './hooks/useChatScroll';
import {
  createMessageId,
  parseContentToBlocks,
} from './utils/contentParser';

const ApiHint = styled.p`
  margin: 0 0 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #fff7ed;
  color: #c2410c;
  font-size: 13px;
  border: 1px solid #fed7aa;
`;

const ChatPanel = styled.section`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 180px);
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
  overflow: hidden;
`;

const ChatContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  color: #64748b;
  padding: 24px 8px;

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    color: #0f172a;
  }

  p {
    margin: 0;
    max-width: 520px;
    line-height: 1.7;
    font-size: 15px;
  }
`;

const MessageRow = styled.div`
  display: flex;
  width: 100%;
  justify-content: ${(props) => (props.$isUser ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.div`
  max-width: min(85%, 640px);
  padding: 14px 16px;
  border-radius: 16px;
  line-height: 1.65;
  word-wrap: break-word;
  text-align: left;
  direction: ltr;

  ${(props) =>
    props.$isUser
      ? `
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
    color: #fff;
    border-bottom-right-radius: 6px;
  `
      : `
    background: #f8fafc;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 6px;
  `}
`;

const blink = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

const Thinking = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 14px;

  span.dots {
    display: inline-flex;
    gap: 4px;

    i {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6366f1;
      animation: ${blink} 1.2s infinite;

      &:nth-child(2) { animation-delay: 0.2s; }
      &:nth-child(3) { animation-delay: 0.4s; }
    }
  }
`;

const InputBar = styled.div`
  flex-shrink: 0;
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  background: #fafbfc;
`;

const Input = styled.textarea`
  flex: 1;
  min-height: 52px;
  max-height: 120px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
  background: #fff;
  font-size: 15px;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }

  &:disabled {
    background: #f1f5f9;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  align-self: flex-end;
  min-width: 88px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

function createUserMessage(text) {
  return {
    id: createMessageId(),
    isUser: true,
    blocks: parseContentToBlocks(text),
  };
}

function createAssistantMessage(blocks = []) {
  return {
    id: createMessageId(),
    isUser: false,
    blocks,
  };
}

function hasImageBlock(blocks) {
  return blocks.some((block) => block.type === 'image');
}

function hasTextBlock(blocks) {
  return blocks.some((block) => block.type === 'text' && block.content);
}

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState(null);
  const apiConfig = getApiConfig();

  const { containerRef, endRef } = useChatScroll([messages, isLoading], isLoading);

  const updateAssistantBlocks = (messageId, blocks) => {
    setMessages((prev) =>
      prev.map((message) =>
        message.id === messageId ? { ...message, blocks } : message,
      ),
    );
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) {
      return;
    }

    const prompt = input.trim();
    setMessages((prev) => [...prev, createUserMessage(prompt)]);
    setInput('');
    setIsLoading(true);

    const assistantMessage = createAssistantMessage([]);
    const assistantId = assistantMessage.id;
    setStreamingMessageId(assistantId);
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      await generateImageWithExplanation(prompt, (blocks) => {
        updateAssistantBlocks(assistantId, blocks);
      });
    } catch (error) {
      console.error('Error calling image API:', error);

      let errorText = '抱歉，发生了错误，请稍后再试。';

      if (error.message === 'MISSING_API_KEY') {
        errorText = '请先在 .env 中配置 VITE_CHAT_API_KEY（千问 API Key）。';
      } else if (error.response?.data?.message === 'Insufficient Balance') {
        errorText = '抱歉，API 账户余额不足，请充值后再试。';
      } else if (error.message) {
        errorText = `生成失败：${error.message}`;
      }

      updateAssistantBlocks(assistantId, parseContentToBlocks(errorText));
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {!apiConfig.hasApiKey && (
        <ApiHint>请在 .env 中设置 VITE_CHAT_API_KEY 后重启开发服务器</ApiHint>
      )}

      <ChatPanel>
        <ChatContainer ref={containerRef}>
          {messages.length === 0 ? (
            <EmptyState>
              <h2>开始创作</h2>
              <p>
                输入描述，wan2.6-image 将图文混排输出。例如：生成一张小狗图片，并说明你为什么选择这个犬种。
              </p>
            </EmptyState>
          ) : (
            messages.map((message) => {
              const isStreaming = isLoading && message.id === streamingMessageId;
              const showImageLoading =
                isStreaming &&
                !message.isUser &&
                hasTextBlock(message.blocks) &&
                !hasImageBlock(message.blocks);

              return (
                <MessageRow key={message.id} $isUser={message.isUser}>
                  <MessageBubble $isUser={message.isUser}>
                    {message.isUser ? (
                      message.blocks.map((block) =>
                        block.type === 'text' ? (
                          <span key={block.id}>{block.content}</span>
                        ) : null,
                      )
                    ) : message.blocks.length === 0 && isStreaming ? (
                      <Thinking>
                        正在思考
                        <span className="dots">
                          <i />
                          <i />
                          <i />
                        </span>
                      </Thinking>
                    ) : (
                      <MessageContent
                        blocks={message.blocks}
                        showImageLoading={showImageLoading}
                      />
                    )}
                  </MessageBubble>
                </MessageRow>
              );
            })
          )}
          <div ref={endRef} />
        </ChatContainer>

        <InputBar>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想生成的图片..."
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            发送
          </Button>
        </InputBar>
      </ChatPanel>
    </>
  );
}

export default ChatApp;
