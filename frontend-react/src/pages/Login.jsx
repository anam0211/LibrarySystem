import {
  BookOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
  message
} from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultRoute, normalizeSession, writeSession } from "../api/authStore";
import { libraryGateway } from "../api/libraryGateway";

const DEMO_ACCOUNTS = [
  { title: "Admin", email: "admin@library.com", password: "123456", icon: <SafetyOutlined /> },
  { title: "Thủ thư", email: "librarian@library.com", password: "123456", icon: <TeamOutlined /> },
  { title: "Độc giả", email: "reader1@library.com", password: "123456", icon: <UserOutlined /> }
];

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [busy, setBusy] = useState("");

  function finishLogin(rawSession) {
    const session = normalizeSession(rawSession);
    writeSession(session);
    onLogin(session);
    message.success("Đăng nhập mock thành công.");
    navigate(location.state?.from?.pathname || getDefaultRoute(session.role), { replace: true });
  }

  async function handleLogin(values) {
    setBusy("login");

    try {
      finishLogin(await libraryGateway.login(values));
    } catch (error) {
      message.error(error.message);
    } finally {
      setBusy("");
    }
  }

  async function handleRegister(values) {
    setBusy("register");

    try {
      const user = await libraryGateway.register(values);
      registerForm.resetFields();
      finishLogin(user);
    } catch (error) {
      message.error(error.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="login-shell">
      <section className="login-stage">
        <Tag color="blue" style={{ width: "fit-content", borderRadius: 999 }}>
          Frontend-first mock mode
        </Tag>
        <Typography.Title level={1} style={{ marginTop: 18, marginBottom: 12 }}>
          BookHub Library E-Commerce
        </Typography.Title>
        <Typography.Paragraph style={{ maxWidth: 680, fontSize: 16 }}>
          Demo chạy độc lập bằng dữ liệu giả ở frontend: thẻ thư viện điện tử, e-KYC, giỏ mượn,
          giao sách tận nhà, review, leaderboard và thu phạt.
        </Typography.Paragraph>

        <Row gutter={[16, 16]} style={{ marginTop: 28 }}>
          <Col xs={24} md={12}>
            <Card className="glass-card" style={{ height: "100%" }}>
              <Space direction="vertical" size={12}>
                <Tag color="blue" icon={<BookOutlined />}>
                  Không cần backend
                </Tag>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  Dữ liệu được lưu ở localStorage
                </Typography.Title>
                <Typography.Paragraph style={{ margin: 0 }}>
                  Sau khi chốt UI/UX, mock service này có thể thay bằng API Spring Boot theo cùng luồng nghiệp vụ.
                  Tài khoản demo mock data có thể mượn sách và thêm giỏ hàng,...
                  reader2@library.com
                  123456
                </Typography.Paragraph>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="glass-card" style={{ height: "100%" }}>
              <Typography.Title level={4}>Tài khoản demo</Typography.Title>
              <List
                dataSource={DEMO_ACCOUNTS}
                renderItem={(account) => (
                  <List.Item
                    actions={[
                      <Button type="link" onClick={() => loginForm.setFieldsValue(account)}>
                        Điền nhanh
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={account.icon}
                      title={account.title}
                      description={`${account.email} / ${account.password}`}
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </section>

      <Card className="glass-card login-form-card">
        <Tabs
          items={[
            {
              key: "login",
              label: "Đăng nhập",
              children: (
                <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
                  <Form.Item name="email" label="Email" rules={[{ required: true, message: "Nhập email" }]}>
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
                    <Input.Password size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" loading={busy === "login"} block>
                    Đăng nhập vào demo
                  </Button>
                </Form>
              )
            },
            {
              key: "register",
              label: "Đăng ký độc giả",
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
                  <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Nhập email" },
                      { type: "email", message: "Email không hợp lệ" }
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true, min: 6, message: "Tối thiểu 6 ký tự" }]}
                  >
                    <Input.Password size="large" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" loading={busy === "register"} block>
                    Tạo tài khoản và vào hồ sơ
                  </Button>
                </Form>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
