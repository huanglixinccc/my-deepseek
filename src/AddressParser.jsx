import { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

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

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const TextArea = styled.textarea`
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #ddd;
  font-family: inherit;
  resize: none;
  height: 100px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
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

const ResultContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: #f9f9f9;
`;

const ResultItem = styled.div`
  margin-bottom: 10px;
  display: flex;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ResultLabel = styled.div`
  font-weight: bold;
  width: 100px;
  flex-shrink: 0;
`;

const ResultValue = styled.div`
  flex-grow: 1;
`;

const ErrorMessage = styled.div`
  color: #d9534f;
  margin-top: 10px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9f2f2;
  border: 1px solid #ebccd1;
`;

function AddressParser() {
  const [address, setAddress] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 解析地址
  const parseAddress = async () => {
    if (!address.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // 调用 DeepSeek API 进行地址解析
      const response = await callDeepSeekAPI(address);
      setResult(response);
    } catch (error) {
      console.error('解析地址时出错:', error);
      setError('解析地址时出错，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 生成随机地址
  const generateRandomAddress = () => {
    const provinces = ['北京市', '上海市', '广东省', '江苏省', '浙江省', '四川省', '湖北省'];
    const cities = ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市', '武汉市'];
    const districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '福田区', '西湖区', '锦江区', '武昌区'];
    const streets = ['中关村大街', '人民路', '解放大道', '建设路', '科技园路', '文化街', '幸福大道'];
    const buildings = ['金融中心', '科技大厦', '创业园', '商务楼', '国际公寓'];
    const names = ['张三', '李四', '王五', '赵六', '陈七', '刘八'];
    
    const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    const randomStreet = streets[Math.floor(Math.random() * streets.length)];
    const randomBuilding = buildings[Math.floor(Math.random() * buildings.length)];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomPhone = `1${Math.floor(Math.random() * 9) + 1}${Array(9).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`;
    const randomPostalCode = `${Math.floor(Math.random() * 9) + 1}${Array(5).fill(0).map(() => Math.floor(Math.random() * 10)).join('')}`;
    const randomEmail = `${randomName}${Math.floor(Math.random() * 1000)}@example.com`;
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    
    const randomAddress = `${randomProvince}${randomCity}${randomDistrict}${randomStreet}${randomNumber}号${randomBuilding}，${randomName}，${randomPhone}，${randomPostalCode}，${randomEmail}`;
    
    setAddress(randomAddress);
  };
  
  // 调用 DeepSeek API 的函数
  const callDeepSeekAPI = async (addressText) => {
    const API_KEY = 'sk-be8ed567ad944b5cae552cd880eb66f8';
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    
    try {
      console.log('正在发送请求到 DeepSeek API...');
      const response = await axios.post(
        API_URL,
        {
          model: "deepseek-chat",
          messages: [
            { 
              role: "system", 
              content: "你是一个地址解析助手，你的任务是从用户提供的地址文本中提取以下信息：省份、城市、区县、详细地址、姓名、电话号码、邮政编码、电子邮箱。如果某项信息不存在，请返回空字符串。请以JSON格式返回结果，不要有任何其他文字。" 
            },
            { role: "user", content: addressText }
          ],
          temperature: 0.1,
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );
      
      console.log('API 响应:', response.data);
      
      // 解析 AI 返回的 JSON 字符串
      const content = response.data.choices[0].message.content;
      let parsedResult;
      
      try {
        // 尝试直接解析 JSON
        parsedResult = JSON.parse(content);
        
        // 将中文字段名映射到英文字段名
        return {
          province: parsedResult["省份"] || '',
          city: parsedResult["城市"] || '',
          district: parsedResult["区县"] || '',
          address: parsedResult["详细地址"] || '',
          name: parsedResult["姓名"] || '',
          phone: parsedResult["电话号码"] || '',
          postalCode: parsedResult["邮政编码"] || '',
          email: parsedResult["电子邮箱"] || ''
        };
      } catch (e) {
        // 如果直接解析失败，尝试提取 JSON 部分
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
          
          // 将中文字段名映射到英文字段名
          return {
            province: parsedResult["省份"] || '',
            city: parsedResult["城市"] || '',
            district: parsedResult["区县"] || '',
            address: parsedResult["详细地址"] || '',
            name: parsedResult["姓名"] || '',
            phone: parsedResult["电话号码"] || '',
            postalCode: parsedResult["邮政编码"] || '',
            email: parsedResult["电子邮箱"] || ''
          };
        } else {
          throw new Error('无法解析 API 返回的结果');
        }
      }
    } catch (error) {
      console.error('API 错误详情:', error.response ? error.response.data : error.message);
      
      // 如果是余额不足错误，使用模拟解析
      if (error.response?.data?.message === "Insufficient Balance") {
        console.log('API 余额不足，使用模拟解析');
        return simulateAddressParsing(addressText);
      }
      
      throw error;
    }
  };
  
  // 模拟地址解析（当 API 不可用时使用）
  const simulateAddressParsing = (addressText) => {
    console.log('使用模拟解析地址:', addressText);
    
    // 简单的正则表达式匹配
    const provinceMatch = addressText.match(/(北京市|上海市|天津市|重庆市|河北省|山西省|辽宁省|吉林省|黑龙江省|江苏省|浙江省|安徽省|福建省|江西省|山东省|河南省|湖北省|湖南省|广东省|海南省|四川省|贵州省|云南省|陕西省|甘肃省|青海省|台湾省|内蒙古自治区|广西壮族自治区|西藏自治区|宁夏回族自治区|新疆维吾尔自治区|香港特别行政区|澳门特别行政区)/);
    const cityMatch = addressText.match(/([\u4e00-\u9fa5]{2,}市|地区|自治州)/);
    const districtMatch = addressText.match(/([\u4e00-\u9fa5]{2,}区|县|市|旗)/);
    const phoneMatch = addressText.match(/1[3-9]\d{9}/);
    const postalCodeMatch = addressText.match(/\d{6}/);
    const emailMatch = addressText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const nameMatch = addressText.match(/([\u4e00-\u9fa5]{2,3})[,，]/);
    
    // 提取详细地址（简化处理）
    let detailAddress = addressText;
    if (provinceMatch) detailAddress = detailAddress.replace(provinceMatch[0], '');
    if (cityMatch) detailAddress = detailAddress.replace(cityMatch[0], '');
    if (districtMatch) detailAddress = detailAddress.replace(districtMatch[0], '');
    if (phoneMatch) detailAddress = detailAddress.replace(phoneMatch[0], '');
    if (postalCodeMatch) detailAddress = detailAddress.replace(postalCodeMatch[0], '');
    if (emailMatch) detailAddress = detailAddress.replace(emailMatch[0], '');
    if (nameMatch) detailAddress = detailAddress.replace(nameMatch[0], '');
    
    // 清理详细地址中的标点符号
    detailAddress = detailAddress.replace(/[,，。.、；;：:""''！!？?]/g, '').trim();
    
    return {
      province: provinceMatch ? provinceMatch[0] : '',
      city: cityMatch ? cityMatch[0] : '',
      district: districtMatch ? districtMatch[0] : '',
      address: detailAddress,
      name: nameMatch ? nameMatch[1] : '',
      phone: phoneMatch ? phoneMatch[0] : '',
      postalCode: postalCodeMatch ? postalCodeMatch[0] : '',
      email: emailMatch ? emailMatch[0] : ''
    };
  };
  
  return (
    <Container>
      <Header>
        <h1>地址信息识别</h1>
      </Header>
      
      <InputContainer>
        <TextArea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="请输入地址信息，例如：广东省深圳市南山区科技园路1号高新科技大厦，张三，13800138000，518000，zhangsan@example.com"
        />
      </InputContainer>
      
      <ButtonContainer>
        <Button onClick={parseAddress} disabled={isLoading || !address.trim()}>
          {isLoading ? '解析中...' : '解析地址'}
        </Button>
        <Button onClick={generateRandomAddress} disabled={isLoading}>
          生成随机地址
        </Button>
      </ButtonContainer>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      
      {result && (
        <ResultContainer>
          <ResultItem>
            <ResultLabel>省份：</ResultLabel>
            <ResultValue>{result.province || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>城市：</ResultLabel>
            <ResultValue>{result.city || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>区县：</ResultLabel>
            <ResultValue>{result.district || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>详细地址：</ResultLabel>
            <ResultValue>{result.address || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>姓名：</ResultLabel>
            <ResultValue>{result.name || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>电话号码：</ResultLabel>
            <ResultValue>{result.phone || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>邮政编码：</ResultLabel>
            <ResultValue>{result.postalCode || '未识别'}</ResultValue>
          </ResultItem>
          <ResultItem>
            <ResultLabel>电子邮箱：</ResultLabel>
            <ResultValue>{result.email || '未识别'}</ResultValue>
          </ResultItem>
        </ResultContainer>
      )}
    </Container>
  );
}

export default AddressParser;