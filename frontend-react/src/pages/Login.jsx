import {
  Button,
  Card,
  Form,
  Input,
  Tabs,
  Typography,
  message
} from "antd";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultRoute, normalizeSession, writeSession } from "../api/authStore";
import { libraryGateway } from "../api/libraryGateway";

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
    message.success("Đăng nhập thành công.");
    navigate(location.state?.from?.pathname || getDefaultRoute(session.role), { 
      replace: true,
      state: location.state
    });
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
        <Typography.Title level={1} style={{ marginTop: 18, marginBottom: 12 }}>
          BookHub Library E-Commerce
        </Typography.Title>
        <Typography.Paragraph style={{ maxWidth: 680, fontSize: 16 }}>
          Đăng nhập để quản lý hồ sơ bạn đọc, giỏ mượn, đơn mượn, thông báo và các nghiệp vụ thư viện.
        </Typography.Paragraph>
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
