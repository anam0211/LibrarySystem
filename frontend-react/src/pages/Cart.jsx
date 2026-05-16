import {
  CalendarOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  ShopOutlined,
  TruckOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  List,
  Radio,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient, toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import { formatCurrency, formatDate, formatNumber } from "../components/formatters";

const BORROW_DAY_OPTIONS = [
  { value: 7, label: "7 ngày" },
  { value: 14, label: "14 ngày" },
  { value: 21, label: "21 ngày" },
  { value: 30, label: "30 ngày" }
];

function isImage(asset) {
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(String(asset?.assetType || "").toUpperCase());
}

function CartBookCover({ book }) {
  const coverUrl = toAbsoluteMediaUrl(book.primaryImageUrl);

  if (coverUrl) {
    return <img src={coverUrl} alt={book.title} className="cart-book-cover" />;
  }

  return (
    <div className="mock-cover mock-cover-small cart-book-cover-fallback" style={{ "--cover-tone": book.coverTone }}>
      <strong>{book.title}</strong>
    </div>
  );
}

async function attachCartBookCovers(items) {
  return Promise.all(
    items.map(async (book) => {
      if (book.primaryImageUrl) {
        return book;
      }

      try {
        const media = await libraryGateway.getBookMedia(book.id);
        const coverAsset = media.find((asset) => asset.primary && isImage(asset)) || media.find(isImage);
        return {
          ...book,
          primaryImageUrl: coverAsset?.fileUrl || ""
        };
      } catch {
        return book;
      }
    })
  );
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + Number(days || 14));
  return date;
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className={`cart-summary-row ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Cart({ session }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const receiveMethod = Form.useWatch("receiveMethod", form) || "DELIVERY";
  const dueDays = Number(Form.useWatch("dueDays", form) || 14);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [userMembership, setUserMembership] = useState(null);
  const [hasHigherTier, setHasHigherTier] = useState(false);
  const [currentBorrowed, setCurrentBorrowed] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee = receiveMethod === "DELIVERY" ? (userMembership?.deliveryFee ?? (user?.membershipCode && user?.membershipCode !== "FREE" ? 0 : 20000)) : 0;
  const depositAmount = 0;
  const totalPayment = deliveryFee + depositAmount;
  const expectedDueDate = useMemo(() => addDays(dueDays), [dueDays]);

  const maxBooksAllowed = userMembership?.maxBorrowLimit ?? (user?.membershipCode && user?.membershipCode !== "FREE" ? 6 : 3);
  const availableQuota = Math.max(0, maxBooksAllowed - currentBorrowed);
  const isOverLimit = cart.length > availableQuota;
  const canSubmit = Boolean(cart.length) && !isOverLimit;

  async function loadCart() {
    if (!session?.id) {
      setCart([]);
      setUser(null);
      setCurrentBorrowed(0);
      return;
    }

    const [nextCart, nextUser, nextLoans, membershipsRes] = await Promise.all([
      libraryGateway.getCart(session.id),
      libraryGateway.getUser(session.id),
      libraryGateway.listLoans(session.id),
      apiClient.get('/memberships').catch(() => ({ data: [] }))
    ]);

    const payload = membershipsRes.data || membershipsRes;
    const memberships = Array.isArray(payload) ? payload : (payload?.result || []);
    const currentMembership = memberships.find(m => m.code === nextUser?.membershipCode);
    setUserMembership(currentMembership || null);
    
    const currentPrice = currentMembership?.pricePerMonth || currentMembership?.price || 0;
    setHasHigherTier(memberships.some(m => (m.pricePerMonth || m.price || 0) > currentPrice));

    const nextPhone = nextUser?.phone || nextUser?.verificationPhone || session.phone || "";
    const nextAddress = nextUser?.address || nextUser?.verificationAddress || "";
    const nextName = nextUser?.fullName || session.fullName || "";
    const savedMethod = form.getFieldValue("receiveMethod");

    const activeLoans = (nextLoans || []).filter((loan) => !["RETURNED", "CANCELLED", "EXPIRED"].includes(loan.status));
    const borrowedCount = activeLoans.reduce((sum, loan) => sum + (Array.isArray(loan.books) && loan.books.length ? loan.books.length : 1), 0);
    
    setCart(await attachCartBookCovers(nextCart));
    setUser(nextUser);
    setCurrentBorrowed(borrowedCount);
    form.setFieldsValue({
      fullName: form.getFieldValue("fullName") || nextName,
      phone: form.getFieldValue("phone") || nextPhone,
      address: form.getFieldValue("address") || nextAddress,
      receiveMethod: savedMethod || "DELIVERY",
      dueDays: form.getFieldValue("dueDays") || 14,
      note: form.getFieldValue("note") || ""
    });
  }

  useEffect(() => {
    loadCart();
  }, [session?.id]);

  async function removeBook(bookId) {
    await libraryGateway.removeFromCart(session.id, bookId);
    loadCart();
    window.dispatchEvent(new Event("cartUpdated"));
  }

  async function handleCheckout(values) {
    if (!cart.length) {
      message.warning("Giỏ mượn đang trống.");
      return;
    }

    setSubmitting(true);
    try {
      const loan = await libraryGateway.checkout(session.id, values);
      message.success(`Đã gửi yêu cầu mượn #${loan.id}.`);
      navigate("/reader/orders", { state: { loanId: loan.id } });
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell reader-cart-page">
      <div className="page-toolbar cart-page-header">
        <div>
          <p className="page-eyebrow">Giỏ mượn</p>
          <h1 className="page-title">Gửi yêu cầu mượn sách</h1>
          <p className="page-copy">Kiểm tra sách, chọn hình thức nhận và gửi yêu cầu tới thư viện.</p>
        </div>
        <Tag color={cart.length ? "blue" : "default"}>{formatNumber(cart.length)} cuốn trong giỏ</Tag>
      </div>

      <Row gutter={[18, 18]} align="start" className="cart-checkout-grid">
        <Col xs={24} lg={11} xl={10}>
          <Card className="glass-card cart-books-card" title={`Sách trong giỏ (${formatNumber(cart.length)})`}>
            {cart.length ? (
              <List
                className="cart-book-list"
                dataSource={cart}
                renderItem={(book) => (
                  <List.Item
                    className="cart-book-item"
                    actions={[
                      <Button
                        danger
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => removeBook(book.id)}
                      >
                        Xóa
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<CartBookCover book={book} />}
                      title={<Link to={`/book/${book.id}`}>{book.title}</Link>}
                      description={
                        <Space direction="vertical" size={2}>
                          <Typography.Text type="secondary">
                            {(book.authors || []).join(", ")}
                          </Typography.Text>
                          <Tag color={Number(book.stockAvailable || 0) > 0 ? "green" : "red"}>
                            Còn {formatNumber(book.stockAvailable)} cuốn
                          </Tag>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Giỏ mượn đang trống." image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Link to="/">
                  <Button type="primary">Chọn sách</Button>
                </Link>
              </Empty>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={13} xl={14}>
          <Form
            form={form}
            layout="vertical"
            className="cart-receiver-form"
            initialValues={{
              receiveMethod: "DELIVERY",
              fullName: session?.fullName,
              phone: session?.phone,
              address: user?.address,
              dueDays: 14,
              note: ""
            }}
            onFinish={handleCheckout}
          >
            <Card className="glass-card cart-info-card" title="Thông tin nhận sách">
              <Form.Item name="receiveMethod" label="Hình thức nhận sách">
                <Radio.Group className="receive-method-group cart-receive-method">
                  <Radio.Button value="PICKUP">
                    <ShopOutlined /> Tại quầy
                  </Radio.Button>
                  <Radio.Button value="DELIVERY">
                    <TruckOutlined /> Giao tận nhà
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Row gutter={[12, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Người nhận"
                    rules={[{ required: true, message: "Vui lòng nhập người nhận." }]}
                  >
                    <Input placeholder="Họ tên người nhận" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[{ required: true, message: "Vui lòng nhập số điện thoại." }]}
                  >
                    <Input placeholder="Số điện thoại liên hệ" />
                  </Form.Item>
                </Col>
              </Row>

              {receiveMethod === "DELIVERY" ? (
                <Form.Item
                  name="address"
                  label="Địa chỉ giao tận nhà"
                  rules={[{ required: true, message: "Vui lòng nhập địa chỉ giao tận nhà." }]}
                >
                  <Input prefix={<EnvironmentOutlined />} placeholder="Số nhà, đường, phường/xã, quận/huyện" />
                </Form.Item>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="Nhận tại quầy thư viện"
                  description="Khi đơn được duyệt, bạn đến quầy lưu thông để nhận sách theo mã đơn."
                  className="cart-pickup-alert"
                />
              )}

              <Row gutter={[12, 0]}>
                <Col xs={24} md={10}>
                  <Form.Item name="dueDays" label="Số ngày mượn">
                    <Select options={BORROW_DAY_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={14}>
                  <Form.Item name="note" label="Ghi chú">
                    <Input.TextArea rows={2} placeholder="Ghi chú ngắn cho thư viện nếu cần" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card className="glass-card cart-summary-card" title="Tóm tắt đơn mượn">
              <SummaryRow label="Số sách" value={`${formatNumber(cart.length)} cuốn`} />
              <SummaryRow label="Hình thức nhận" value={receiveMethod === "DELIVERY" ? "Giao tận nhà" : "Tại quầy"} />
              <SummaryRow label="Số ngày mượn" value={`${formatNumber(dueDays)} ngày`} />
              <SummaryRow label="Hạn trả dự kiến" value={formatDate(expectedDueDate)} />
              <SummaryRow 
                label="Phí giao" 
                value={receiveMethod === "DELIVERY" && deliveryFee === 0 ? <Tag color="gold" style={{ margin: 0 }}>Miễn phí</Tag> : formatCurrency(deliveryFee)} 
              />
              <SummaryRow label="Tiền cọc" value={formatCurrency(depositAmount)} />
              <Divider />
              <SummaryRow label="Tổng thanh toán" value={formatCurrency(totalPayment)} strong />
              {totalPayment > 0 ? (
                <Typography.Text type="secondary" className="cart-summary-note">
                  Phí hiển thị để demo, thư viện sẽ xác nhận khi duyệt đơn.
                </Typography.Text>
              ) : null}
              
              {isOverLimit ? (
                <Alert
                  type="error"
                  showIcon
                  message="Vượt giới hạn mượn sách"
                  description={
                    <Space direction="vertical" size={4} style={{ width: "100%" }}>
                      <Typography.Text>
                         <strong style={{ color: user?.membershipCode && user?.membershipCode !== 'FREE' ? 'goldenrod' : 'inherit', textTransform: 'uppercase' }}>{userMembership?.name || user?.membershipName || 'Gói Cơ bản'}</strong> cho phép giữ tối đa <strong>{maxBooksAllowed}</strong> cuốn cùng lúc.
                        <br/>
                        Bạn đang giữ <strong>{currentBorrowed}</strong> cuốn (đang mượn/chờ duyệt), nên chỉ có thể mượn thêm tối đa <strong>{availableQuota}</strong> cuốn. Vui lòng bỏ bớt sách ra khỏi giỏ!
                      </Typography.Text>
                      {(!user?.membershipCode || user?.membershipCode === 'FREE') ? (
                      <Link to="/plans" style={{ display: "block", marginTop: 4 }}>
                          <Button size="small" style={{ background: "gold", borderColor: "gold", color: "black", fontWeight: 500 }}>Đăng ký Hội viên ngay</Button>
                        </Link>
                      ) : hasHigherTier ? (
                      <Link to="/plans" style={{ display: "block", marginTop: 4 }}>
                          <Button size="small" style={{ background: "gold", borderColor: "gold", color: "black", fontWeight: 500 }}>Nâng cấp gói hội viên</Button>
                        </Link>
                      ) : null}
                    </Space>
                  }
                  style={{ marginTop: 12, marginBottom: 16 }}
                />
              ) : null}
              {isOverLimit ? (
                <div style={{ textAlign: "center", marginBottom: 12 }}>
                  <Typography.Text type="danger" strong>Vượt quá số lượng sách có thể đặt</Typography.Text>
                </div>
              ) : null}
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={submitting}
                disabled={!canSubmit}
                icon={<CalendarOutlined />}
              >
                Gửi yêu cầu mượn
              </Button>
            </Card>
          </Form>
        </Col>
      </Row>
    </div>
  );
}
