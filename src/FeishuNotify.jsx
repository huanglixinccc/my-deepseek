import { useMemo, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {
  buildRecipientPayload,
  DEFAULT_OPEN_ID,
  DEFAULT_RECIPIENT_NAME,
  RECRUIT_API_BASE,
} from './config/recruitApi';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const Hero = styled.section`
  padding: 24px 28px;
  border-radius: 20px;
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #818cf8 100%);
  color: #fff;
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.22);
`;

const HeroTitle = styled.h2`
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
`;

const HeroText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
`;

const Panel = styled.section`
  padding: 22px 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
`;

const PanelTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 16px;
  color: #0f172a;
`;

const PanelHint = styled.p`
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
`;

const Field = styled.label`
  display: block;
  margin-bottom: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
`;

const FieldHint = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 400;
  color: #94a3b8;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  font: inherit;
  color: #0f172a;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

const TextArea = styled.textarea`
  display: block;
  width: 100%;
  min-height: 132px;
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px solid #dbe3ee;
  border-radius: 12px;
  font: inherit;
  color: #0f172a;
  background: #fff;
  resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
  }
`;

const DefaultBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 600;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
`;

const ActionCard = styled.section`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 20px;
  background: #fff;
  border: 1px solid #e8edf5;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
`;

const ActionIcon = styled.div`
  width: 42px;
  height: 42px;
  margin-bottom: 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: ${(props) => props.$bg || '#eef2ff'};
`;

const ActionTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  color: #0f172a;
`;

const ActionDescription = styled.p`
  flex: 1;
  margin: 0 0 18px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: ${(props) => (props.$secondary ? '#f8fafc' : 'linear-gradient(135deg, #4f46e5, #6366f1)')};
  color: ${(props) => (props.$secondary ? '#334155' : '#fff')};
  border: ${(props) => (props.$secondary ? '1px solid #dbe3ee' : 'none')};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const ResultPanel = styled.section`
  padding: 18px 20px;
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
`;

const ResultTitle = styled.div`
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const ResultBox = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.7;
  color: #cbd5e1;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
`;

const ErrorMessage = styled.div`
  padding: 12px 14px;
  border-radius: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 14px;
`;

async function callRecruitApi(path, payload) {
  const response = await axios.post(`${RECRUIT_API_BASE}${path}`, payload ?? {}, {
    headers: { 'Content-Type': 'application/json' },
  });
  return { status: response.status, ...response.data };
}

function FeishuNotify() {
  const [openId, setOpenId] = useState('');
  const [positionName, setPositionName] = useState('HRBP');
  const [customTitle, setCustomTitle] = useState('【HRBP】自定义通知');
  const [customContent, setCustomContent] = useState('在这里输入要发送给飞书的正文内容。');
  const [result, setResult] = useState('等待调用…');
  const [error, setError] = useState('');
  const [loadingKey, setLoadingKey] = useState('');

  const recipientPayload = useMemo(() => buildRecipientPayload(openId), [openId]);
  const effectiveRecipientLabel = openId.trim()
    ? openId.trim()
    : `${DEFAULT_RECIPIENT_NAME}（${DEFAULT_OPEN_ID}）`;

  const runAction = async (key, path, payload) => {
    setLoadingKey(key);
    setError('');
    setResult('请求中…');

    try {
      const data = await callRecruitApi(path, { ...recipientPayload, ...payload });
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        '请求失败';
      setError(message);
      setResult(
        err.response
          ? JSON.stringify({ status: err.response.status, ...err.response.data }, null, 2)
          : '请求失败',
      );
    } finally {
      setLoadingKey('');
    }
  };

  return (
    <Page>
      <Hero>
        <HeroTitle>飞书通知控制台</HeroTitle>
        <HeroText>
          一键发送澄清卡片、过筛率预警、同步职位提醒或自定义消息。默认发送给 {DEFAULT_RECIPIENT_NAME}，也支持临时指定其他 open_id。
        </HeroText>
      </Hero>

      <Panel>
        <PanelTitle>接收人设置</PanelTitle>
        <PanelHint>留空则发送给默认接收人 {DEFAULT_RECIPIENT_NAME}；填写后将覆盖默认值。</PanelHint>
        <Field>
          飞书 open_id（可选）
          <FieldHint>当前将发送给：{effectiveRecipientLabel}</FieldHint>
          <Input
            value={openId}
            onChange={(event) => setOpenId(event.target.value)}
            placeholder={`默认：${DEFAULT_RECIPIENT_NAME}`}
          />
        </Field>
        {!openId.trim() && (
          <DefaultBadge>
            默认接收人：{DEFAULT_RECIPIENT_NAME}
          </DefaultBadge>
        )}
      </Panel>

      <Grid>
        <ActionCard>
          <ActionIcon $bg="#eef2ff">📋</ActionIcon>
          <ActionTitle>职位澄清</ActionTitle>
          <ActionDescription>发送「开始澄清」卡片，按钮点击后跳转澄清 H5。</ActionDescription>
          <Field>
            职位名称
            <Input
              value={positionName}
              onChange={(event) => setPositionName(event.target.value)}
            />
          </Field>
          <ActionButton
            type="button"
            disabled={loadingKey === 'clarification'}
            onClick={() =>
              runAction('clarification', '/api/position-context/manual-clarification', {
                positionName: positionName.trim(),
              })
            }
          >
            {loadingKey === 'clarification' ? '发送中…' : '发送澄清卡片'}
          </ActionButton>
        </ActionCard>

        <ActionCard>
          <ActionIcon $bg="#fff7ed">📉</ActionIcon>
          <ActionTitle>过筛率低于 30%</ActionTitle>
          <ActionDescription>发送演示用的过筛率预警卡片，包含 mock 数据与优化建议。</ActionDescription>
          <ActionButton
            type="button"
            disabled={loadingKey === 'screen-rate'}
            onClick={() => runAction('screen-rate', '/api/position-context/low-screen-rate-alert')}
          >
            {loadingKey === 'screen-rate' ? '发送中…' : '发送过筛率预警'}
          </ActionButton>
        </ActionCard>

        <ActionCard>
          <ActionIcon $bg="#ecfeff">🔄</ActionIcon>
          <ActionTitle>同步职位提醒</ActionTitle>
          <ActionDescription>提醒 HR 处理渠道中新职位同步与关联，避免遗漏寻聘机会。</ActionDescription>
          <ActionButton
            type="button"
            disabled={loadingKey === 'sync-position'}
            onClick={() => runAction('sync-position', '/api/position-context/sync-position-reminder')}
          >
            {loadingKey === 'sync-position' ? '发送中…' : '发送同步职位提醒'}
          </ActionButton>
        </ActionCard>
      </Grid>

      <Panel>
        <PanelTitle>自定义飞书卡片</PanelTitle>
        <PanelHint>标题和正文由你填写，接收人遵循上方设置。</PanelHint>
        <Field>
          卡片标题
          <Input
            value={customTitle}
            onChange={(event) => setCustomTitle(event.target.value)}
          />
        </Field>
        <Field>
          卡片内容
          <TextArea
            value={customContent}
            onChange={(event) => setCustomContent(event.target.value)}
          />
        </Field>
        <ActionButton
          type="button"
          $secondary
          disabled={loadingKey === 'custom'}
          onClick={() =>
            runAction('custom', '/api/position-context/custom-message', {
              title: customTitle.trim(),
              content: customContent.trim(),
            })
          }
        >
          {loadingKey === 'custom' ? '发送中…' : '发送自定义卡片'}
        </ActionButton>
      </Panel>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ResultPanel>
        <ResultTitle>接口响应</ResultTitle>
        <ResultBox>{result}</ResultBox>
      </ResultPanel>
    </Page>
  );
}

export default FeishuNotify;
