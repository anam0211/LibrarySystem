import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Tabs,
  Typography,
  message
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined
} from "@ant-design/icons";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultRoute, normalizeSession, writeSession } from "../api/authStore";
import { libraryGateway } from "../api/libraryGateway";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [messageApi, messageContextHolder] = message.useMessage();
  const [busy, setBusy] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");

  function finishLogin(rawSession) {
    const session = normalizeSession(rawSession);
    writeSession(session);
    onLogin(session);
    messageApi.success("Đăng nhập thành công.");
    navigate(location.state?.from?.pathname || getDefaultRoute(session.role), {
      replace: true,
      state: location.state
    });
  }

  async function handleLogin(values) {
    setBusy("login");
    setLoginError("");

    try {
      finishLogin(await libraryGateway.login(values));
    } catch (error) {
      const errorMessage = error.message || "Không thể đăng nhập lúc này.";
      setLoginError(errorMessage);
      loginForm.setFields([
        { name: "email", errors: [] },
        { name: "password", errors: [errorMessage] }
      ]);
    } finally {
      setBusy("");
    }
  }

  async function handleRegister(values) {
    setBusy("register");
    setRegisterError("");

    try {
      const user = await libraryGateway.register(values);
      registerForm.resetFields();
      finishLogin(user);
    } catch (error) {
      setRegisterError(error.message || "Không thể tạo tài khoản lúc này.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="login-shell">
      {messageContextHolder}
      <Card className="glass-card login-form-card">
        <Space direction="vertical" size={4} className="login-form-heading">
          <Typography.Title level={2}>Chào mừng trở lại</Typography.Title>
          <Typography.Text type="secondary">Dùng email đã đăng ký để truy cập hệ thống.</Typography.Text>
        </Space>
        <Tabs
          centered
          items={[
            {
              key: "login",
              label: "Đăng nhập",
              children: (
                <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
                  {loginError ? <Alert type="error" showIcon message={loginError} className="login-alert" /> : null}
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Nhập email" },
                      { type: "email", message: "Email không hợp lệ" }
                    ]}
                  >
                    <Input size="large" prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" />
                  </Form.Item>
                  <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
                    <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" autoComplete="current-password" />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" size="large" loading={busy === "login"} block icon={<SafetyCertificateOutlined />}>
                    Đăng nhập
                  </Button>
                </Form>
              )
            },
            {
              key: "register",
              label: "Đăng ký độc giả",
              children: (
                <Form form={registerForm} layout="vertical" onFinish={handleRegister}>
                  {registerError ? <Alert type="error" showIcon message={registerError} className="login-alert" /> : null}
                  <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: "Nhập họ tên" }]}>
                    <Input size="large" prefix={<UserOutlined />} placeholder="Nguyễn Văn A" autoComplete="name" />
                  </Form.Item>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Nhập email" },
                      { type: "email", message: "Email không hợp lệ" }
                    ]}
                  >
                    <Input size="large" prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" />
                  </Form.Item>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input size="large" prefix={<PhoneOutlined />} placeholder="09xxxxxxxx" autoComplete="tel" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[{ required: true, min: 6, message: "Tối thiểu 6 ký tự" }]}
                  >
                    <Input.Password size="large" prefix={<LockOutlined />} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
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
