import {
  DeleteOutlined,
  EnvironmentOutlined,
  QrcodeOutlined,
  ShopOutlined,
  TruckOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Radio,
  Row,
  Space,
  Steps,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { libraryGateway } from "../api/libraryGateway";
import PublicShell from "../components/PublicChrome";
import { formatCurrency, formatNumber } from "../components/formatters";

function MockCover({ book }) {
  return (
    <div className="mock-cover mock-cover-small" style={{ "--cover-tone": book.coverTone }}>
      <strong>{book.title}</strong>
    </div>
  );
}

function FakeQr({ label }) {
  return (
    <div className="fake-qr">
      {Array.from({ length: 49 }).map((_, index) => (
        <i key={index} className={(index + label.length) % 3 === 0 ? "on" : ""} />
      ))}
    </div>
  );
}

export default function Cart({ session, onLogout }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const receiveMethod = Form.useWatch("receiveMethod", form) || "DELIVERY";
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);

  async function loadCart() {
    if (!session?.id) {
      setCart([]);
      setUser(null);
      return;
    }

    const [nextCart, nextUser] = await Promise.all([
      libraryGateway.getCart(session.id),
      libraryGateway.getUser(session.id)
    ]);
    setCart(nextCart);
    setUser(nextUser);
    form.setFieldsValue({
      fullName: session.fullName,
      phone: session.phone,
      address: nextUser?.address,
      receiveMethod: form.getFieldValue("receiveMethod") || "DELIVERY",
      dueDays: form.getFieldValue("dueDays") || 14
    });
  }

  useEffect(() => {
    loadCart();
  }, [session?.id]);

  async function removeBook(bookId) {
    await libraryGateway.removeFromCart(session.id, bookId);
    loadCart();
  }

  async function handleCheckout(values) {
    try {
      const loan = await libraryGateway.checkout(session.id, values);
      message.success("Đã tạo đơn mượn.");
      navigate("/reader", { state: { loanId: loan.id } });
    } catch (error) {
      message.error(error.message);
    }
  }

  const deliveryFee = receiveMethod === "DELIVERY" ? 18000 : 0;

  return (
    <PublicShell session={session} onLogout={onLogout}>
      <section className="page-shell">
        <div className="page-toolbar">
          <div>
            <p className="page-eyebrow">Giỏ mượn</p>
            <h1 className="page-title">Checkout sách mượn</h1>
            <p className="page-copy">
              Chọn sách, hình thức nhận và tạo đơn mượn trực tuyến.
            </p>
          </div>
        </div>

        <Row gutter={[20, 20]} align="start">
          <Col xs={24} lg={10}>
            <Card className="glass-card" title={`Sách trong giỏ (${cart.length})`}>
              {cart.length ? (
                <List
                  dataSource={cart}
                  renderItem={(book) => (
                    <List.Item
                      actions={[
                        <Button danger icon={<DeleteOutlined />} onClick={() => removeBook(book.id)}>
                          Xóa
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<MockCover book={book} />}
                        title={<Link to={`/book/${book.id}`}>{book.title}</Link>}
                        description={`${(book.authors || []).join(", ")} - Còn ${formatNumber(book.stockAvailable)}`}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty
                  description="Giỏ mượn đang trống."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Link to="/">
                    <Button type="primary">Chọn sách</Button>
                  </Link>
                </Empty>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card className="glass-card" title="Thông tin nhận sách">
              <Steps
                size="small"
                current={0}
                items={[
                  { title: "Tạo đơn" },
                  { title: receiveMethod === "DELIVERY" ? "Đang giao" : "Sẵn sàng nhận" },
                  { title: "Đang mượn" },
                  { title: "Đã trả" }
                ]}
                style={{ marginBottom: 18 }}
              />

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  receiveMethod: "DELIVERY",
                  fullName: session?.fullName,
                  phone: session?.phone,
                  address: user?.address,
                  dueDays: 14
                }}
                onFinish={handleCheckout}
              >
                <Form.Item name="receiveMethod" label="Hình thức nhận sách">
                  <Radio.Group className="receive-method-group">
                    <Radio.Button value="PICKUP">
                      <ShopOutlined /> Tại quầy
                    </Radio.Button>
                    <Radio.Button value="DELIVERY">
                      <TruckOutlined /> Giao tận nhà
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Row gutter={[14, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item name="fullName" label="Người nhận" rules={[{ required: true }]}>
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                      <Input size="large" />
                    </Form.Item>
                  </Col>
                </Row>

                {receiveMethod === "DELIVERY" ? (
                  <Form.Item name="address" label="Địa chỉ giao hàng" rules={[{ required: true }]}>
                    <Input size="large" prefix={<EnvironmentOutlined />} />
                  </Form.Item>
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    icon={<QrcodeOutlined />}
                    message="Nhận tại quầy"
                    description="Khi đến thư viện, đưa mã QR dưới đây cho thủ thư để xác nhận đơn mượn."
                    style={{ marginBottom: 18 }}
                  />
                )}

                {receiveMethod === "PICKUP" ? (
                  <div className="checkout-qr-row">
                    <FakeQr label={session?.studentCode || "PICKUP"} />
                    <div>
                      <Typography.Text strong>QR nhận sách tại quầy</Typography.Text>
                      <p className="subtle">Mã giả lập: PICKUP-{session?.studentCode || "GUEST"}</p>
                    </div>
                  </div>
                ) : null}

                <Form.Item name="dueDays" label="Số ngày mượn">
                  <InputNumber min={7} max={30} style={{ width: "100%" }} />
                </Form.Item>

                <Card size="small" className="pickup-note-card">
                  <Space direction="vertical" size={4}>
                    <Typography.Text strong>Tạm tính</Typography.Text>
                    <Typography.Text>Số sách: {formatNumber(cart.length)}</Typography.Text>
                    <Typography.Text>Phí giao hàng: {formatCurrency(deliveryFee)}</Typography.Text>
                  </Space>
                </Card>

                <Button type="primary" htmlType="submit" size="large" disabled={!cart.length} block>
                  Tạo đơn mượn
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </section>
    </PublicShell>
  );
}
