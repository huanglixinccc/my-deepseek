import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';
import './App.css';
import AddressParser from './AddressParser';

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 20px;
`;

const Navigation = styled.nav`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  
  ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      margin: 0 10px;
      
      a {
        text-decoration: none;
        color: #0b93f6;
        font-weight: bold;
        padding: 5px 10px;
        border-radius: 5px;
        
        &:hover {
          background-color: #f0f0f0;
        }
        
        &.active {
          background-color: #0b93f6;
          color: white;
        }
      }
    }
  }
`;

const ChatContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  height: 500px;
  overflow-y: auto;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #f9f9f9;
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 18px;
  margin-bottom: 10px;
  line-height: 1.4;
  word-wrap: break-word;
  
  ${props => props.isUser ? `
    background-color: #0b93f6;
    color: white;
    margin-left: auto;
    border-bottom-right-radius: 5px;
  ` : `
    background-color: #e5e5ea;
    color: black;
    margin-right: auto;
    border-bottom-left-radius: 5px;
  `}
`;

const InputContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const Input = styled.textarea`
  flex-grow: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-family: inherit;
  resize: none;
  height: 60px;
`;

const Button = styled.button`
  padding: 10px 20px;
  background-color: #0b93f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background-color: #0a84e0;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const LoadingDots = styled.div`
  display: inline-block;
  
  &:after {
    content: '.';
    animation: dots 1.5s steps(5, end) infinite;
  }
  
  @keyframes dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60% { content: '...'; }
    80%, 100% { content: ''; }
  }
`;

function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  
  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 添加用户消息
    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // 调用 DeepSeek API
      const response = await callDeepSeekAPI(input);
      
      // 添加 AI 回复
      const aiMessage = { text: response, isUser: false };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      
      // 检查是否是余额不足错误
      const errorData = error.response?.data;
      let errorMessage;
      
      if (errorData?.message === "Insufficient Balance") {
        errorMessage = { 
          text: '抱歉，DeepSeek API 账户余额不足，请充值后再试。', 
          isUser: false 
        };
      } else {
        errorMessage = { 
          text: '抱歉，发生了错误，请稍后再试。', 
          isUser: false 
        };
      }
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // 调用 DeepSeek API 的函数
  const callDeepSeekAPI = async (prompt) => {
    // 使用环境变量获取 API 密钥
    const API_KEY = 'sk-be8ed567ad944b5cae552cd880eb66f8'; // 直接使用您的 API 密钥
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    try {
      console.log('正在发送请求到 DeepSeek API...');
      const response = await axios.post(
        API_URL,
        {
          model: "deepseek-chat",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500 // 减少 token 数量以降低成本
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      
      console.log('API 响应:', response.data);
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('API 错误详情:', error.response ? error.response.data : error.message);
      throw error;
    }
  };
  
  return (
    <Container>
      <Header>
        <h1>简易 DeepSeek 聊天</h1>
      </Header>
      
      <ChatContainer>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '200px' }}>
            发送消息开始聊天吧！
          </div>
        )}
        
        {messages.map((message, index) => (
          <MessageBubble key={index} isUser={message.isUser}>
            {message.isUser ? (
              message.text
            ) : (
              <ReactMarkdown>{message.text}</ReactMarkdown>
            )}
          </MessageBubble>
        ))}
        
        {isLoading && (
          <MessageBubble isUser={false}>
            思考中<LoadingDots />
          </MessageBubble>
        )}
        
        <div ref={chatEndRef} />
      </ChatContainer>
      
      <InputContainer>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入您的问题..."
          disabled={isLoading}
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
          发送
        </Button>
      </InputContainer>
    </Container>
  );
}

function App() {
  return (
    <Router>
      <div>
        <Navigation>
          <ul>
            <li>
              <Link to="/">聊天</Link>
            </li>
            <li>
              <Link to="/address">地址识别</Link>
            </li>
          </ul>
        </Navigation>
        
        <Routes>
          <Route path="/" element={<ChatApp />} />
          <Route path="/address" element={<AddressParser />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
