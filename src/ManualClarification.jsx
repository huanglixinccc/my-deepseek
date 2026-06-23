import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const RECRUIT_API_BASE = 'http://hlxccc.asia';

const Container = styled.div`
  max-width: 560px;
  margin: 0 auto;
  width: 100%;
`;

const Card = styled.div`
  padding: 24px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
`;

const Description = styled.p`
  margin: 0 0 20px;
  color: #64748b;
  font-size: 14px;
`;

const Field = styled.label`
  display: block;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
`;

const Input = styled.input`
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
  box-sizing: border-box;
`;

const TextArea = styled.textarea`
  display: block;
  width: 100%;
  min-height: 88px;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font: inherit;
  resize: vertical;
  box-sizing: border-box;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #3370ff;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ResultBox = styled.pre`
  margin: 20px 0 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
  color: #334155;
`;

const ErrorMessage = styled.div`
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 14px;
`;

function ManualClarification() {
  const [positionName, setPositionName] = useState('HRBP');
  const [openIds, setOpenIds] = useState('');
  const [result, setResult] = useState('等待调用…');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('请求中…');

    const payload = { positionName: positionName.trim() };
    const normalizedOpenIds = openIds
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (normalizedOpenIds.length > 0) {
      payload.openIds = normalizedOpenIds;
    }

    try {
      const response = await axios.post(
        `${RECRUIT_API_BASE}/api/position-context/manual-clarification`,
        payload,
        { headers: { 'Content-Type': 'application/json' } },
      );

      setResult(JSON.stringify({ status: response.status, ...response.data }, null, 2));
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
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Card>
        <Description>调用线上接口，向指定飞书用户发送「开始澄清」卡片。</Description>

        <form onSubmit={handleSubmit}>
          <Field>
            职位名称
            <Input
              value={positionName}
              onChange={(event) => setPositionName(event.target.value)}
              required
            />
          </Field>

          <Field>
            飞书 open_id（多个用英文逗号分隔，留空则使用服务端默认 HR）
            <TextArea
              value={openIds}
              onChange={(event) => setOpenIds(event.target.value)}
              placeholder="ou_xxxxxxxx"
            />
          </Field>

          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? '发送中…' : '发送澄清卡片'}
          </SubmitButton>
        </form>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        <ResultBox>{result}</ResultBox>
      </Card>
    </Container>
  );
}

export default ManualClarification;
