import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import './App.css';
import AddressParser from './AddressParser';
import ChatApp from './ChatApp';

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
`;

const TopBar = styled.header`
  flex-shrink: 0;
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
`;

const Brand = styled.div`
  h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
  }
`;

const Navigation = styled.nav`
  ul {
    display: flex;
    list-style: none;
    padding: 0;
    margin: 0;
    gap: 8px;
  }

  a {
    display: inline-block;
    padding: 8px 14px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    transition: all 0.2s ease;

    &:hover {
      background: #f1f5f9;
      color: #334155;
    }

    &.active {
      background: #6366f1;
      color: #fff;
    }
  }
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 20px 24px 24px;
  min-height: 0;
`;

function AppLayout({ title, subtitle, children }) {
  return (
    <Page>
      <TopBar>
        <Brand>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </Brand>
        <Navigation>
          <ul>
            <li>
              <NavLink to="/" end>
                聊天
              </NavLink>
            </li>
            <li>
              <NavLink to="/address">地址识别</NavLink>
            </li>
          </ul>
        </Navigation>
      </TopBar>
      <Main>{children}</Main>
    </Page>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout title="AI 图文混排" subtitle="wan2.6-image · 文字与图片流式输出">
              <ChatApp />
            </AppLayout>
          }
        />
        <Route
          path="/address"
          element={
            <AppLayout title="地址识别" subtitle="DeepSeek 智能解析">
              <AddressParser />
            </AppLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
