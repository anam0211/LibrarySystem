import {
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  HeartOutlined,
  IdcardOutlined,
  QrcodeOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  UploadOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Modal,
  QRCode,
  Row,
  Space,
  Steps,
  Tabs,
  Tag,
  Typography,
  Upload,
  message
} from "antd";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { normalizeSession, writeSession } from "../api/authStore";
import { libraryGateway } from "../api/libraryGateway";
import { formatCurrency, formatDate, formatNumber } from "../components/formatters";

const READER_QR_TTL_MS = 60000;

function FakeQr({ label }) {
  return (
    <div className="fake-qr fake-qr-large">
      {Array.from({ length: 64 }).map((_, index) => (
        <i key={index} className={(index * 7 + String(label).length) % 4 === 0 ? "on" : ""} />
      ))}
    </div>
  );
}

function statusTag(status) {
  const map = {
    NEW: ["gold", "Chờ duyệt"],
    PACKING: ["cyan", "Đang gói"],
    SHIPPING: ["blue", "Đang giao"],
    BORROWING: ["green", "Đang mượn"],
    RETURNING: ["purple", "Chờ nhận trả"],
    RETURNED: ["default", "Đã trả"],
    OVERDUE: ["red", "Quá hạn"]
  };
  const [color, label] = map[status] || ["default", status];
  return <Tag color={color}>{label}</Tag>;
}

function kycTag(status) {
  if (status === "VERIFIED") {
    return <Tag color="green">Đã xác thực</Tag>;
  }

  if (status === "PENDING") {
    return <Tag color="gold">Chờ admin duyệt</Tag>;
  }

  return <Tag color="red">Chưa xác thực</Tag>;
}

function buildReaderQrToken(userId, issuedAt) {
  const slot = Math.floor(issuedAt / READER_QR_TTL_MS);
  return `LIBRARY_READER|user_id=${userId || ""}|slot=${slot}`;
}

function formatQrTime(value) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default function Reader({ session, onSessionUpdate }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [kycForm] = Form.useForm();
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [payFine, setPayFine] = useState(null);
  const [qrIssuedAt, setQrIssuedAt] = useState(() => Date.now());
  const [kycFileList, setKycFileList] = useState([]);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [returningLoanId, setReturningLoanId] = useState(null);

  const activeTab = searchParams.get("tab") || location.state?.section || "card";

  async function loadReader() {
    if (!session?.id) {
      return;
    }

    const [nextUser, nextLoans, nextFines, nextWishlist] = await Promise.all([
      libraryGateway.getUser(session.id),
      libraryGateway.listLoans(session.id),
      libraryGateway.listFines(session.id),
      libraryGateway.getWishlist(session.id)
    ]);

    setUser(nextUser);
    setLoans(nextLoans);
    setFines(nextFines);
    setWishlist(nextWishlist);
  }

  useEffect(() => {
    loadReader();
  }, [session?.id, location.state?.loanId]);

  useEffect(() => {
    setQrIssuedAt(Date.now());
    const timer = window.setInterval(() => {
      setQrIssuedAt(Date.now());
    }, READER_QR_TTL_MS);

    return () => window.clearInterval(timer);
  }, [session?.id]);

  useEffect(() => {
    kycForm.setFieldsValue({
      email: user?.email || session?.email || "",
      phone: user?.phone || session?.phone || "",
      address: user?.address || "",
      idCardNumber: user?.idCardNumber || ""
    });
  }, [kycForm, session?.email, session?.phone, user?.address, user?.email, user?.idCardNumber, user?.phone]);

  async function handleSubmitKyc(values) {
    if (!session?.id) {
      return;
    }

    const selectedFile = kycFileList[0]?.originFileObj || null;
    const hasExistingDocument = Boolean(user?.kycDocument?.fileName || user?.kycDocument?.fileUrl);

    if (user?.canEdit === false || user?.kycStatus === "VERIFIED") {
      message.warning("Hồ sơ đã được xác thực nên không thể chỉnh sửa.");
      return;
    }

    if (!hasExistingDocument && !selectedFile) {
      message.error("Vui lòng tải ảnh CCCD hoặc thẻ sinh viên trước khi gửi hồ sơ.");
      return;
    }

    setSubmittingKyc(true);

    try {
      const nextUser = await libraryGateway.saveMyKyc(
        session.id,
        values,
        selectedFile,
        Boolean(hasExistingDocument || user?.kycStatus === "PENDING")
      );

      setUser(nextUser);
      setKycFileList([]);

      const nextSession = normalizeSession({
        ...session,
        fullName: nextUser.fullName || session?.fullName,
        phone: nextUser.phone || "",
        studentCode: nextUser.studentCode || session?.studentCode,
        kycStatus: nextUser.kycStatus || session?.kycStatus
      });

      writeSession(nextSession);
      onSessionUpdate?.(nextSession);

      if (nextUser.adminApprovalEnabled) {
        message.success("Đã gửi hồ sơ xác thực thành công.");
      } else {
        message.success("Đã lưu hồ sơ xác thực.");
      }
    } catch (error) {
      message.error(error?.message || "Không thể lưu hồ sơ xác thực.");
    } finally {
      setSubmittingKyc(false);
    }
  }

  async function handlePayFine() {
    await libraryGateway.payFine(payFine.id);
    message.success("Thanh toán phạt thành công.");
    setPayFine(null);
    loadReader();
  }

  async function handleRequestReturn(loan) {
    setReturningLoanId(loan.id);

    try {
      await libraryGateway.requestReturn(loan.id);
      message.success("Đã gửi yêu cầu trả sách. Thư viện sẽ liên hệ nhận lại sách.");
      await loadReader();
      setSearchParams({ tab: "returns" });
    } catch (error) {
      message.error(error?.message || "Không thể gửi yêu cầu trả sách.");
    } finally {
      setReturningLoanId(null);
    }
  }

  const unpaidFines = fines.filter((fine) => fine.status === "UNPAID");
  const cardCode = user?.cardCode || "Chưa cấp thẻ";
  const readerUserId = user?.id || session?.id;
  const readerQrToken = buildReaderQrToken(readerUserId, qrIssuedAt);
  const readerQrExpiresAt = qrIssuedAt + READER_QR_TTL_MS;
  const hasExistingKycDocument = Boolean(user?.kycDocument?.fileName || user?.kycDocument?.fileUrl);
  const canEditKyc = user?.canEdit !== false && user?.kycStatus !== "VERIFIED";
  const deliveryReturnLoans = loans.filter((loan) => loan.receiveMethod === "DELIVERY"
    && ["BORROWING", "RETURNING", "RETURNED"].includes(loan.status));
  const submitButtonLabel = hasExistingKycDocument || user?.kycStatus === "PENDING"
    ? "Cập nhật và gửi lại"
    : "Gửi hồ sơ xác thực";

  const tabItems = [
    {
      key: "card",
      label: "Thẻ & KYC",
      icon: <IdcardOutlined />,
      children: (
        <Row gutter={[20, 20]} align="stretch">
          <Col xs={24} xl={10}>
            <Card className="glass-card library-card-panel">
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <div className="page-toolbar">
                  <div>
                    <p className="page-eyebrow">Thẻ thư viện điện tử</p>
                    <Typography.Title level={3} style={{ margin: 0 }}>
                      {user?.fullName || session?.fullName}
                    </Typography.Title>
                  </div>
                  {kycTag(user?.kycStatus)}
                </div>

                <div className="virtual-card">
                  <div>
                    <span>BOOKHUB CARD</span>
                    <strong>{cardCode}</strong>
                    <p>{user?.studentCode}</p>
                  </div>
                  <div className="reader-qr-panel">
                    <QRCode
                      key={readerQrToken}
                      value={readerQrToken}
                      size={132}
                      bordered={false}
                      color="#162839"
                      bgColor="#ffffff"
                    />
                    <small>user_id: {readerUserId}</small>
                    <small>Làm mới lúc {formatQrTime(readerQrExpiresAt)}</small>
                  </div>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={14}>
            <Card className="glass-card" title="Thông tin xác thực">
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Email tài khoản">{user?.accountEmail || session?.email || "-"}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{user?.phone || "-"}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ">{user?.address || "-"}</Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">{kycTag(user?.kycStatus)}</Descriptions.Item>
                  <Descriptions.Item label="Số CCCD / Mã SV">{user?.idCardNumber || "-"}</Descriptions.Item>
                  <Descriptions.Item label="Ảnh CCCD">
                    {hasExistingKycDocument ? user?.kycDocument?.fileName || "Đã lưu" : "Chưa tải"}
                  </Descriptions.Item>
                </Descriptions>

                {user?.kycStatus === "VERIFIED" ? (
                  <Alert
                    type="success"
                    showIcon
                    message="Hồ sơ đã được xác thực."
                    description="Thông tin KYC đã khóa, bạn đọc không thể chỉnh sửa sau khi admin duyệt."
                  />
                ) : null}

                {user?.kycStatus === "PENDING" ? (
                  <Alert
                    type={user?.adminApprovalEnabled ? "info" : "warning"}
                    showIcon
                    message={user?.adminApprovalEnabled ? "Hồ sơ đang chờ admin duyệt." : "Hồ sơ đã lưu."}
                    description={user?.adminApprovalEnabled
                      ? "Bạn vẫn có thể chỉnh sửa thông tin và gửi lại trước khi hồ sơ được xác thực."
                      : "Bạn có thể tiếp tục sửa email, số điện thoại, địa chỉ và gửi lại khi cần."}
                  />
                ) : null}

                <Form form={kycForm} layout="vertical" onFinish={handleSubmitKyc}>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Email xác thực"
                        rules={[
                          { required: true, message: "Nhập email xác thực" },
                          { type: "email", message: "Email không hợp lệ" }
                        ]}
                      >
                        <Input disabled={!canEditKyc} placeholder="reader@library.com" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="phone"
                        label="Số điện thoại"
                        rules={[{ required: true, message: "Nhập số điện thoại" }]}
                      >
                        <Input disabled={!canEditKyc} placeholder="09xxxxxxxx" />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item
                        name="address"
                        label="Địa chỉ"
                        rules={[{ required: true, message: "Nhập địa chỉ" }]}
                      >
                        <Input.TextArea disabled={!canEditKyc} rows={3} placeholder="Nhập địa chỉ hiện tại của bạn" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="idCardNumber" label="Số CCCD / Mã sinh viên">
                        <Input disabled={!canEditKyc} placeholder="Nhập số CCCD hoặc mã sinh viên" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item required label="Ảnh CCCD / Thẻ sinh viên">
                        <Space direction="vertical" size={8} style={{ width: "100%" }}>
                          <Upload
                            accept=".jpg,.jpeg,.png,.webp"
                            beforeUpload={() => false}
                            disabled={!canEditKyc}
                            fileList={kycFileList}
                            maxCount={1}
                            onChange={({ fileList }) => setKycFileList(fileList.slice(-1))}
                          >
                            <Button disabled={!canEditKyc} icon={<UploadOutlined />}>
                              {hasExistingKycDocument ? "Chọn ảnh mới" : "Tải ảnh CCCD"}
                            </Button>
                          </Upload>
                          {hasExistingKycDocument ? (
                            <Typography.Text type="secondary">
                              Đang dùng: {user?.kycDocument?.fileName || "Ảnh CCCD đã lưu"}
                            </Typography.Text>
                          ) : (
                            <Typography.Text type="secondary">
                              Ảnh CCCD hoặc thẻ sinh viên là bắt buộc trước khi gửi hồ sơ.
                            </Typography.Text>
                          )}
                          {user?.kycDocument?.fileUrl ? (
                            <Button
                              type="link"
                              href={user.kycDocument.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ paddingInline: 0 }}
                            >
                              Xem ảnh đã lưu
                            </Button>
                          ) : null}
                        </Space>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Space>
                    <Button type="primary" htmlType="submit" loading={submittingKyc} disabled={!canEditKyc}>
                      {submitButtonLabel}
                    </Button>
                    <Button
                      disabled={!canEditKyc}
                      onClick={() => {
                        kycForm.setFieldsValue({
                          email: user?.email || session?.email || "",
                          phone: user?.phone || session?.phone || "",
                          address: user?.address || "",
                          idCardNumber: user?.idCardNumber || ""
                        });
                        setKycFileList([]);
                      }}
                    >
                      Khôi phục dữ liệu đã lưu
                    </Button>
                  </Space>
                </Form>
              </Space>
            </Card>
          </Col>
        </Row>
      )
    },
    {
      key: "orders",
      label: "Đơn mượn",
      icon: <TruckOutlined />,
      children: (
        <Card className="glass-card" title="Đơn mượn & tracking">
          <List
            dataSource={loans}
            locale={{ emptyText: "Chưa có đơn mượn." }}
            renderItem={(loan) => (
              <List.Item
                className={location.state?.loanId === loan.id ? "highlight-row" : ""}
                actions={[
                  loan.receiveMethod === "DELIVERY" && loan.status === "BORROWING" ? (
                    <Button
                      icon={<RollbackOutlined />}
                      loading={returningLoanId === loan.id}
                      onClick={() => handleRequestReturn(loan)}
                    >
                      Yêu cầu trả sách
                    </Button>
                  ) : null
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <strong>{loan.id}</strong>
                      {statusTag(loan.status)}
                      <Tag>{loan.receiveMethod === "DELIVERY" ? "Giao tận nhà" : "Tại quầy"}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <span>{loan.bookTitle}</span>
                      <span>Hạn trả: {formatDate(loan.dueDate)}</span>
                      <Steps
                        size="small"
                        current={Math.max(0, (loan.tracking || []).filter((item) => item.done).length - 1)}
                        items={(loan.tracking || []).map((item) => ({ title: item.label }))}
                      />
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )
    },
    {
      key: "returns",
      label: "Trả sách",
      icon: <RollbackOutlined />,
      children: (
        <Card
          className="glass-card"
          title="Trả sách giao tận nhà"
          extra={<Tag color="blue">{deliveryReturnLoans.length} đơn</Tag>}
        >
          <List
            dataSource={deliveryReturnLoans}
            locale={{ emptyText: "Không có đơn giao tận nhà nào cần trả." }}
            renderItem={(loan) => (
              <List.Item
                actions={[
                  loan.status === "BORROWING" ? (
                    <Button
                      type="primary"
                      icon={<RollbackOutlined />}
                      loading={returningLoanId === loan.id}
                      onClick={() => handleRequestReturn(loan)}
                    >
                      Gửi yêu cầu trả
                    </Button>
                  ) : loan.status === "RETURNING" ? (
                    <Tag color="purple">Đang chờ thư viện nhận lại</Tag>
                  ) : (
                    <Tag color="green">Đã trả</Tag>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={<TruckOutlined />}
                  title={
                    <Space wrap>
                      <strong>{loan.id}</strong>
                      {statusTag(loan.status)}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={6}>
                      <span>{loan.bookTitle}</span>
                      <span>Địa chỉ nhận trả: {loan.address || "Theo địa chỉ giao sách"}</span>
                      <span>Hạn trả: {formatDate(loan.dueDate)}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )
    },
    {
      key: "fines",
      label: "Nợ phạt",
      icon: <QrcodeOutlined />,
      children: (
        <Card
          className="glass-card"
          title="Nợ & phạt"
          extra={<Tag color={unpaidFines.length ? "red" : "green"}>{unpaidFines.length} chưa thanh toán</Tag>}
        >
          <List
            dataSource={fines}
            locale={{ emptyText: "Không có phiếu phạt." }}
            renderItem={(fine) => (
              <List.Item
                actions={[
                  fine.status === "UNPAID" ? (
                    <Button type="primary" icon={<QrcodeOutlined />} onClick={() => setPayFine(fine)}>
                      Thanh toán
                    </Button>
                  ) : (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      Đã thanh toán
                    </Tag>
                  )
                ]}
              >
                <List.Item.Meta
                  avatar={fine.status === "UNPAID" ? <ClockCircleOutlined /> : <CheckCircleOutlined />}
                  title={`${fine.id} - ${formatCurrency(fine.amount)}`}
                  description={`${fine.reason} / ${fine.loanId}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )
    },
    {
      key: "wishlist",
      label: "Yêu thích",
      icon: <HeartOutlined />,
      children: (
        <Card className="glass-card" title="Sách yêu thích">
          {wishlist.length ? (
            <List
              dataSource={wishlist}
              renderItem={(book) => (
                <List.Item actions={[<Link to={`/book/${book.id}`}>Xem sách</Link>]}>
                  <List.Item.Meta
                    avatar={<HeartOutlined />}
                    title={book.title}
                    description={(book.authors || []).join(", ")}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Chưa có sách yêu thích." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )
    }
  ];

  return (
    <div className="page-shell">
      <div className="reader-summary-grid">
        <Card className="metric-card">
          <Typography.Text type="secondary">Đơn đang xử lý</Typography.Text>
          <strong>{formatNumber(loans.filter((loan) => loan.status !== "RETURNED").length)}</strong>
        </Card>
        <Card className="metric-card">
          <Typography.Text type="secondary">Sách yêu thích</Typography.Text>
          <strong>{formatNumber(wishlist.length)}</strong>
        </Card>
        <Card className="metric-card">
          <Typography.Text type="secondary">Nợ phạt</Typography.Text>
          <strong>{formatCurrency(unpaidFines.reduce((sum, fine) => sum + fine.amount, 0))}</strong>
        </Card>
        <Card className="metric-card">
          <Typography.Text type="secondary">Giỏ mượn</Typography.Text>
          <Link to="/cart">
            <Button type="primary" icon={<ShoppingCartOutlined />}>
              Mở giỏ
            </Button>
          </Link>
        </Card>
      </div>

      <Card className="glass-card reader-tabs-card">
        <Tabs activeKey={activeTab} onChange={(key) => setSearchParams({ tab: key })} items={tabItems} />
      </Card>

      <Modal
        open={Boolean(payFine)}
        title="Thanh toán phạt bằng QR giả lập"
        onCancel={() => setPayFine(null)}
        footer={[
          <Button key="close" onClick={() => setPayFine(null)}>
            Đóng
          </Button>,
          <Button key="paid" type="primary" icon={<BankOutlined />} onClick={handlePayFine}>
            Đã thanh toán
          </Button>
        ]}
      >
        {payFine ? (
          <div className="payment-modal-body">
            <FakeQr label={payFine.id} />
            <Space direction="vertical">
              <Tag color="blue" icon={<CreditCardOutlined />}>
                Momo/VNPay
              </Tag>
              <Typography.Title level={4}>{formatCurrency(payFine.amount)}</Typography.Title>
              <Typography.Text>{payFine.reason}</Typography.Text>
              <Typography.Text type="secondary">{payFine.id}</Typography.Text>
            </Space>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
