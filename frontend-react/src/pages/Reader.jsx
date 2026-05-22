import {
  AlertOutlined,
  BankOutlined,
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  EyeOutlined,
  LockOutlined,
  ReadOutlined,
  RollbackOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  UserOutlined,
  UploadOutlined,
  WalletOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  QRCode,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { normalizeSession, writeSession } from "../api/authStore";
import { toAbsoluteMediaUrl, apiClient } from "../api/apiClient";
import { libraryApi } from "../api/libraryApi";
import { libraryGateway } from "../api/libraryGateway";
import BookCard from "../components/BookCard";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "../components/formatters";
import {
  STATUS_META,
  READER_QR_TTL_MS,
  bookCountText,
  buildReaderQrToken,
  formatQrTime,
  isDeliveryLoan,
  isDueSoon,
  isOverdue,
  loanedDateValue,
  readerLoanStatus,
  useReaderData
} from "./readerHelpers";

function StatusBadge({ status }) {
  const [color, label] = STATUS_META[status] || ["default", status];
  return <Tag color={color}>{label}</Tag>;
}

function kycTag(status) {
  if (status === "VERIFIED") return <Tag color="green">Đã xác thực</Tag>;
  if (status === "PENDING") return <Tag color="gold">Chờ xác thực</Tag>;
  return <Tag color="red">Chưa xác thực</Tag>;
}

function ReaderHeader({ user, session, unpaidAmount }) {
  return (
    <div className="reader-dashboard-header">
      <div>
        <p className="page-eyebrow">Tài khoản bạn đọc</p>
        <h1 className="page-title">Xin chào, {user?.fullName || session?.fullName || "bạn đọc"}</h1>
        <p className="page-copy">Theo dõi đơn mượn, hạn trả, phí phạt và thông tin thẻ thư viện của bạn.</p>
      </div>
      <Space wrap>
        {kycTag(user?.kycStatus || session?.kycStatus)}
        {user?.membershipCode && user?.membershipCode !== "FREE" ? (
          <Tag color="gold">{user?.membershipName || user?.membershipCode}</Tag>
        ) : (
          <Tag color="default">{user?.membershipName && user.membershipCode === "FREE" ? user.membershipName : "Thành viên cơ bản"}</Tag>
        )}
        {unpaidAmount > 0 ? <Tag color="red">Nợ phạt {formatCurrency(unpaidAmount)}</Tag> : null}
        <Link to="/reader/cart">
          <Button type="primary" icon={<ShoppingCartOutlined />}>Mở giỏ mượn</Button>
        </Link>
      </Space>
    </div>
  );
}

function ReaderStats({ loans, fines }) {
  const borrowedBooks = loans
    .filter((loan) => ["BORROWING", "RETURNING", "OVERDUE"].includes(readerLoanStatus(loan)))
    .reduce((sum, loan) => sum + (Array.isArray(loan.books) && loan.books.length ? loan.books.length : 1), 0);
  const activeOrders = loans.filter((loan) => !["RETURNED", "CANCELLED"].includes(loan.status)).length;
  const dueSoon = loans.filter(isDueSoon).length;
  const unpaidAmount = fines.filter((fine) => fine.status === "UNPAID").reduce((sum, fine) => sum + fine.amount, 0);
  const items = [
    ["Đơn đang xử lý", activeOrders, "Đơn chưa hoàn tất", <TruckOutlined />],
    ["Sách đang mượn", borrowedBooks, "Tổng số cuốn đang giữ", <ReadOutlined />],
    ["Sắp đến hạn", dueSoon, "Cần chú ý trong 24 giờ", <ClockCircleOutlined />],
    ["Nợ phạt", formatCurrency(unpaidAmount), "Khoản chưa thanh toán", <WalletOutlined />]
  ];

  return (
    <div className="reader-stat-grid">
      {items.map(([title, value, desc, icon]) => (
        <Card className="metric-card reader-stat-card" key={title}>
          <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
            <div>
              <Typography.Text type="secondary">{title}</Typography.Text>
              <strong>{typeof value === "number" ? formatNumber(value) : value}</strong>
              <span>{desc}</span>
            </div>
            <span className="reader-stat-icon">{icon}</span>
          </Space>
        </Card>
      ))}
    </div>
  );
}

function ReaderAlertSection({ loans }) {
  const overdueLoans = loans.filter(isOverdue);
  const dueSoonLoans = loans.filter(isDueSoon);
  if (overdueLoans.length) {
    return (
      <Alert
        type="error"
        showIcon
        icon={<AlertOutlined />}
        message={`Bạn có ${overdueLoans.length} đơn quá hạn`}
        description="Vui lòng gửi yêu cầu trả sách hoặc liên hệ thư viện để tránh phát sinh thêm phí phạt."
      />
    );
  }
  if (dueSoonLoans.length) {
    return (
      <Alert
        type="warning"
        showIcon
        message={`${dueSoonLoans.length} đơn sắp đến hạn`}
        description="Bạn nên chuẩn bị trả sách đúng hạn để không phát sinh phí phạt."
      />
    );
  }
  return <Alert type="success" showIcon message="Bạn không có đơn quá hạn." />;
}

function BorrowOrderDetailDrawer({ loan, fines = [], open, onClose, onRequestReturn, returningLoanId }) {
  const books = Array.isArray(loan?.books) ? loan.books : [];
  const status = loan ? readerLoanStatus(loan) : "";
  const canReturn = ["BORROWING", "OVERDUE"].includes(status);
  const loanFines = loan
    ? fines.filter((fine) => String(fine.loanId || "") === String(loan.id || ""))
    : [];
  const unpaidFineAmount = loanFines
    .filter((fine) => fine.status === "UNPAID")
    .reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const totalFineAmount = loanFines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const displayFineAmount = unpaidFineAmount || totalFineAmount;

  return (
    <Drawer title={loan ? `Chi tiết đơn #${loan.id}` : "Chi tiết đơn"} open={open} onClose={onClose} width={560}>
      {loan ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Trạng thái"><StatusBadge status={status} /></Descriptions.Item>
            <Descriptions.Item label="Hình thức">{isDeliveryLoan(loan) ? "Giao tận nhà" : "Đến lấy"}</Descriptions.Item>
            <Descriptions.Item label="Số sách">{bookCountText(loan)}</Descriptions.Item>
            <Descriptions.Item label="Ngày mượn">{formatDate(loanedDateValue(loan))}</Descriptions.Item>
            <Descriptions.Item label="Hạn trả">{formatDate(loan.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="Phí phạt">
              {displayFineAmount ? formatCurrency(displayFineAmount) : "Chưa phát sinh"}
            </Descriptions.Item>
          </Descriptions>
          {loanFines.length ? (
            <Card size="small" title="Phiếu phạt">
              <List
                dataSource={loanFines}
                renderItem={(fine) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{formatCurrency(fine.amount)}</Typography.Text>
                      <Typography.Text type="secondary">
                        {fine.reason} / {fine.status === "UNPAID" ? "Chưa thanh toán" : "Đã thanh toán"}
                        {fine.copyBarcode ? ` / Mã bản sao: ${fine.copyBarcode}` : ""}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          ) : null}
          {status === "OVERDUE" ? <Alert type="error" showIcon message="Đơn đã quá hạn, có thể phát sinh phí phạt." /> : null}
          {status === "RETURNING" ? <Alert type="info" showIcon message="Đang chờ thư viện nhận lại sách." /> : null}
          {status === "CHECKING" ? <Alert type="warning" showIcon message="Thư viện đang kiểm tra sách." /> : null}
          <Card size="small" title="Danh sách sách trong đơn">
            {books.length ? (
              <List dataSource={books} renderItem={(book, index) => <List.Item>{index + 1}. {book.title}</List.Item>} />
            ) : (
              <Typography.Text type="secondary">{loan.bookTitle}</Typography.Text>
            )}
          </Card>
          <Card size="small" title="Lịch sử xử lý đơn">
            <List
              dataSource={loan.tracking || []}
              locale={{ emptyText: "Chưa có lịch sử." }}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <Tag color={item.done ? "green" : "default"}>{item.label}</Tag>
                    <Typography.Text type="secondary">{item.time && item.time !== "BE" ? formatDateTime(item.time) : "Theo luồng đơn"}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
          {canReturn ? (
            <Button type="primary" icon={<RollbackOutlined />} loading={returningLoanId === loan.id} onClick={() => onRequestReturn(loan)}>
              Yêu cầu trả sách
            </Button>
          ) : null}
        </Space>
      ) : null}
    </Drawer>
  );
}

function summarizeLoanTitle(loan) {
  const titles = Array.isArray(loan?.books) && loan.books.length
    ? loan.books.map((book) => book?.title).filter(Boolean)
    : [];
  const text = titles.length ? titles.join(", ") : String(loan?.bookTitle || "-");

  return text.length > 72 ? `${text.slice(0, 72).trim()}...` : text;
}

function useReaderReturnAction(loadReader, onDone) {
  const [returningLoanId, setReturningLoanId] = useState(null);

  async function handleRequestReturn(loan) {
    setReturningLoanId(loan.id);
    try {
      await libraryGateway.requestReturn(loan.id);
      message.success("Yêu cầu trả sách đã được gửi. Thư viện sẽ liên hệ hoặc đến nhận sách.");
      await loadReader();
      onDone?.();
    } catch (error) {
      message.error(error?.message || "Không thể gửi yêu cầu trả sách.");
    } finally {
      setReturningLoanId(null);
    }
  }

  return { returningLoanId, handleRequestReturn };
}

export default function Reader({ session }) {
  const { user, loans, fines, loadReader } = useReaderData(session);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const { returningLoanId, handleRequestReturn } = useReaderReturnAction(loadReader, () => setSelectedLoan(null));
  const unpaidAmount = fines.filter((fine) => fine.status === "UNPAID").reduce((sum, fine) => sum + fine.amount, 0);
  const activeLoans = loans.filter((loan) => !["RETURNED", "CANCELLED"].includes(loan.status));
  const cardCode = user?.cardCode || "Chưa cấp thẻ";

  return (
    <div className="page-shell reader-dashboard">
      <ReaderHeader user={user} session={session} unpaidAmount={unpaidAmount} />
      <ReaderStats loans={loans} fines={fines} />
      <ReaderAlertSection loans={loans} />
      <div className="reader-overview-grid">
        <Card className="glass-card" title="Đơn mượn gần đây">
          <List
            dataSource={loans.slice(0, 4)}
            locale={{ emptyText: "Chưa có đơn mượn." }}
            renderItem={(loan) => (
              <List.Item actions={[<Button type="link" onClick={() => setSelectedLoan(loan)}>Xem chi tiết</Button>]}>
                <List.Item.Meta
                  title={<Space><Tag color="blue">#{loan.id}</Tag><StatusBadge status={readerLoanStatus(loan)} /></Space>}
                  description={`${bookCountText(loan)} / Ngày mượn: ${formatDate(loanedDateValue(loan))} / Hạn trả: ${formatDate(loan.dueDate)}`}
                />
              </List.Item>
            )}
          />
        </Card>
        <Card className="glass-card" title="Sách đang mượn">
          <List
            dataSource={activeLoans.slice(0, 5)}
            locale={{ emptyText: "Không có sách đang mượn." }}
            renderItem={(loan) => (
              <List.Item>
                <List.Item.Meta avatar={<BookOutlined />} title={loan.bookTitle} description={`${bookCountText(loan)} / Ngày mượn: ${formatDate(loanedDateValue(loan))} / Hạn trả: ${formatDate(loan.dueDate)}`} />
              </List.Item>
            )}
          />
        </Card>
        <Card className="glass-card" title="Thông tin tài khoản">
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Họ tên">{user?.fullName || session?.fullName || "-"}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email || session?.email || "-"}</Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{user?.phone || session?.phone || "-"}</Descriptions.Item>
            <Descriptions.Item label="Xác thực">{kycTag(user?.kycStatus)}</Descriptions.Item>
          </Descriptions>
          <Link to="/reader/account"><Button style={{ marginTop: 12 }}>Quản lý tài khoản</Button></Link>
        </Card>
        <Card className="glass-card reader-mini-card" title="Thẻ thư viện" style={user?.membershipCode && user?.membershipCode !== "FREE" ? { borderColor: "gold" } : {}}>
          <Space>
            <QRCode value={buildReaderQrToken(user?.id || session?.id, Date.now())} size={92} bordered={false} color={user?.membershipCode && user?.membershipCode !== "FREE" ? "gold" : "#000"} />
            <div>
              <Typography.Text type="secondary" style={user?.membershipCode && user?.membershipCode !== "FREE" ? { color: "gold" } : {}}>BOOKHUB CARD</Typography.Text>
              <Typography.Title level={4} style={{ margin: "4px 0" }}>{cardCode}</Typography.Title>
              <Link to="/reader/card"><Button size="small">Xem thẻ</Button></Link>
            </div>
          </Space>
        </Card>
      </div>
      <Card className="glass-card">
        <Space wrap>
          <Link to="/reader/orders"><Button type="primary">Xem đơn mượn</Button></Link>
          <Link to="/reader/returns"><Button>Trả sách</Button></Link>
          <Link to="/reader/fines"><Button>Nợ phạt</Button></Link>
          <Link to="/reader/favorites"><Button>Yêu thích</Button></Link>
          <Link to="/reader/account"><Button>Tài khoản</Button></Link>
        </Space>
      </Card>
      <BorrowOrderDetailDrawer loan={selectedLoan} fines={fines} open={Boolean(selectedLoan)} onClose={() => setSelectedLoan(null)} onRequestReturn={handleRequestReturn} returningLoanId={returningLoanId} />
    </div>
  );
}

export function ReaderAccount({ session, onSessionUpdate }) {
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { user, setUser, loadReader } = useReaderData(session);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    profileForm.setFieldsValue({
      fullName: user?.fullName || session?.fullName || "",
      email: user?.email || session?.email || "",
      phone: user?.phone || session?.phone || ""
    });
  }, [profileForm, session?.email, session?.fullName, session?.phone, user]);

  async function handleSaveProfile(values) {
    setSavingProfile(true);
    try {
      const nextUser = await libraryGateway.updateMyAccount(values);
      setUser(nextUser);
      const nextSession = normalizeSession({
        ...session,
        fullName: nextUser.fullName || session?.fullName,
        phone: nextUser.phone || "",
        email: nextUser.accountEmail || nextUser.email || session?.email,
        kycStatus: nextUser.kycStatus || session?.kycStatus,
        membershipCode: nextUser.membershipCode || session?.membershipCode,
        membershipName: nextUser.membershipName || session?.membershipName,
        premiumValidUntil: nextUser.premiumValidUntil || session?.premiumValidUntil
      });
      writeSession(nextSession);
      onSessionUpdate?.(nextSession);
      message.success("Đã cập nhật thông tin tài khoản.");
      await loadReader();
    } catch (error) {
      message.error(error?.message || "Không thể cập nhật tài khoản.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(values) {
    setChangingPassword(true);
    try {
      await libraryGateway.changeMyPassword(values);
      passwordForm.resetFields();
      message.success("Đã đổi mật khẩu.");
    } catch (error) {
      const errorMessage = error?.message || "Không thể đổi mật khẩu.";
      if (errorMessage.toLowerCase().includes("mat khau hien tai")
          || errorMessage.toLowerCase().includes("mật khẩu hiện tại")) {
        passwordForm.setFields([{ name: "currentPassword", errors: [errorMessage] }]);
      }
      message.error(errorMessage);
    } finally {
      setChangingPassword(false);
    }
  }

  function handlePasswordValidationFailed({ errorFields }) {
    const firstError = errorFields?.[0]?.errors?.[0];
    message.error(firstError || "Vui lòng kiểm tra lại thông tin đổi mật khẩu.");
  }

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Tài khoản</p>
          <h1 className="page-title">Quản lý tài khoản</h1>
        </div>
      </div>

      <Row gutter={[18, 18]}>
        <Col xs={24} lg={14}>
          <Card className="glass-card" title={<Space><UserOutlined />Thông tin cá nhân</Space>}>
            <Form form={profileForm} layout="vertical" onFinish={handleSaveProfile}>
              <Row gutter={14}>
                <Col xs={24} md={12}>
                  <Form.Item name="fullName" label="Họ tên" rules={[{ required: true, message: "Vui lòng nhập họ tên." }]}>
                    <Input placeholder="Nhập họ tên" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="email" label="Email đăng nhập">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input placeholder="Nhập số điện thoại" />
                  </Form.Item>
                </Col>
              </Row>
              <Button type="primary" htmlType="submit" loading={savingProfile}>
                Lưu thay đổi
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card className="glass-card" title={<Space><LockOutlined />Đổi mật khẩu</Space>}>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              onFinishFailed={handlePasswordValidationFailed}
            >
              <Form.Item name="currentPassword" label="Mật khẩu hiện tại" rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại." }]}>
                <Input.Password autoComplete="current-password" />
              </Form.Item>
              <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới." }, { min: 6, message: "Mật khẩu mới tối thiểu 6 ký tự." }]}>
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Vui lòng xác nhận mật khẩu mới." },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return !value || getFieldValue("newPassword") === value
                        ? Promise.resolve()
                        : Promise.reject(new Error("Xác nhận mật khẩu không khớp."));
                    }
                  })
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                Đổi mật khẩu
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export function ReaderOrders({ session }) {
  const { loans, fines, loadReader } = useReaderData(session);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const { returningLoanId, handleRequestReturn } = useReaderReturnAction(loadReader, () => setSelectedLoan(null));

  const filteredLoans = useMemo(() => loans.filter((loan) => {
    const status = readerLoanStatus(loan);
    const matchesStatus = statusFilter === "ALL" || status === statusFilter;
    const matchesKeyword = [loan.id, loan.readerName, loan.bookTitle].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword.trim().toLowerCase()));
    return matchesStatus && (!keyword.trim() || matchesKeyword);
  }), [keyword, loans, statusFilter]);

  const columns = [
    { title: "Mã đơn", dataIndex: "id", width: 100, render: (value) => <Tag color="blue">#{value}</Tag> },
    { title: "Số sách", width: 90, render: (_, loan) => bookCountText(loan) },
    { title: "Hình thức", width: 130, render: (_, loan) => isDeliveryLoan(loan) ? "Giao tận nhà" : "Đến lấy" },
    { title: "Ngày mượn", width: 120, render: (_, loan) => formatDate(loanedDateValue(loan)) },
    { title: "Hạn trả", dataIndex: "dueDate", width: 120, render: formatDate },
    { title: "Trạng thái", width: 140, render: (_, loan) => <StatusBadge status={readerLoanStatus(loan)} /> },
    {
      title: "Hành động",
      width: 210,
      render: (_, loan) => {
        const status = readerLoanStatus(loan);
        return (
          <Space>
            <Button onClick={() => setSelectedLoan(loan)}>Xem chi tiết</Button>
            {["BORROWING", "OVERDUE"].includes(status) ? (
              <Button type="primary" icon={<RollbackOutlined />} loading={returningLoanId === loan.id} onClick={() => handleRequestReturn(loan)}>
                Yêu cầu trả
              </Button>
            ) : null}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Đơn mượn</p>
          <h1 className="page-title">Danh sách đơn mượn</h1>
          <p className="page-copy">Tra cứu đơn mượn, theo dõi trạng thái và yêu cầu trả sách.</p>
        </div>
      </div>
      <Card className="glass-card">
        <Space wrap style={{ marginBottom: 14 }}>
          <Input.Search allowClear placeholder="Tìm mã đơn hoặc tên sách" value={keyword} onChange={(event) => setKeyword(event.target.value)} style={{ width: 280 }} />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }}>
            <Select.Option value="ALL">Tất cả trạng thái</Select.Option>
            {Object.entries(STATUS_META).map(([status, [, label]]) => <Select.Option key={status} value={status}>{label}</Select.Option>)}
          </Select>
        </Space>
        <Table rowKey="id" columns={columns} dataSource={filteredLoans} scroll={{ x: 900 }} pagination={{ pageSize: 5, showSizeChanger: true, pageSizeOptions: [5, 10] }} />
      </Card>
      <BorrowOrderDetailDrawer loan={selectedLoan} fines={fines} open={Boolean(selectedLoan)} onClose={() => setSelectedLoan(null)} onRequestReturn={handleRequestReturn} returningLoanId={returningLoanId} />
    </div>
  );
}

export function ReaderReturns({ session }) {
  const { loans, fines, loadReader } = useReaderData(session);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const { returningLoanId, handleRequestReturn } = useReaderReturnAction(loadReader, () => setSelectedLoan(null));
  const borrowableLoans = loans.filter((loan) => ["BORROWING", "OVERDUE"].includes(readerLoanStatus(loan)));

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Trả sách</p>
          <h1 className="page-title">Yêu cầu trả sách</h1>
          <p className="page-copy">Chọn đơn đang mượn hoặc quá hạn để gửi yêu cầu trả cho thư viện.</p>
        </div>
      </div>
      <Card className="glass-card return-request-card" title="Yêu cầu trả sách">
        <List
          className="return-request-list"
          dataSource={borrowableLoans}
          locale={{ emptyText: <Empty description="Bạn chưa có đơn nào cần trả." /> }}
          renderItem={(loan) => {
            const status = readerLoanStatus(loan);
            const statusLabel = STATUS_META[status]?.[1] || status;

            return (
              <List.Item
                className="return-request-item"
                actions={[
                  <Button key="detail" icon={<EyeOutlined />} onClick={() => setSelectedLoan(loan)}>
                    Xem chi tiết
                  </Button>,
                  <Button key="request" type="primary" icon={<RollbackOutlined />} loading={returningLoanId === loan.id} onClick={() => handleRequestReturn(loan)}>
                    Yêu cầu trả
                  </Button>
                ]}
              >
                <div className="return-request-main">
                  <div className="return-request-head">
                    <Space wrap size={[8, 8]}>
                      <Tag color="blue">Mã đơn #{loan.id}</Tag>
                      <StatusBadge status={status} />
                    </Space>
                  </div>
                  <div className="return-request-title">
                    <Typography.Text type="secondary">Tên sách</Typography.Text>
                    <Typography.Paragraph className="return-request-book-name">
                      {summarizeLoanTitle(loan)}
                    </Typography.Paragraph>
                  </div>
                  <div className="return-request-meta">
                    <span><strong>Số sách:</strong> {bookCountText(loan)}</span>
                    <span><strong>Ngày mượn:</strong> {formatDate(loanedDateValue(loan))}</span>
                    <span><strong>Hạn trả:</strong> {formatDate(loan.dueDate)}</span>
                    <span><strong>Trạng thái:</strong> {statusLabel}</span>
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      </Card>
      <BorrowOrderDetailDrawer loan={selectedLoan} fines={fines} open={Boolean(selectedLoan)} onClose={() => setSelectedLoan(null)} onRequestReturn={handleRequestReturn} returningLoanId={returningLoanId} />
    </div>
  );
}

export function ReaderFines({ session }) {
  const { fines, loadReader } = useReaderData(session);
  const [payFine, setPayFine] = useState(null);
  const [selectedFine, setSelectedFine] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const unpaid = fines.filter((fine) => fine.status === "UNPAID");
  const total = unpaid.reduce((sum, fine) => sum + fine.amount, 0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("vnpay");
    if (!paymentStatus) {
      return;
    }

    if (paymentStatus === "success") {
      message.success("Thanh toán phiếu phạt thành công.");
      loadReader();
    } else {
      message.error(params.get("message") || "Thanh toán VNPay chưa thành công.");
    }

    navigate(location.pathname, { replace: true });
  }, [location.search]);

  async function handlePayFine() {
    try {
      const payment = await libraryGateway.payFine(payFine.id);
      if (!payment?.paymentUrl) {
        throw new Error("Không lấy được liên kết thanh toán VNPay.");
      }
      setPayFine(null);
      window.location.href = payment.paymentUrl;
    } catch (error) {
      message.error(error?.message || "Không thể thanh toán phiếu phạt.");
    }
  }

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Nợ phạt</p>
          <h1 className="page-title">Khoản phạt của bạn</h1>
        </div>
      </div>
      <Card className="metric-card">
        <Typography.Text type="secondary">Tổng nợ phạt</Typography.Text>
        <strong>{formatCurrency(total)}</strong>
      </Card>
      <Card className="glass-card">
        {fines.length ? (
          <List
            dataSource={fines}
            renderItem={(fine) => (
              <List.Item
                actions={[
                  <Button icon={<EyeOutlined />} onClick={() => setSelectedFine(fine)}>Chi tiết</Button>,
                  fine.status === "UNPAID" ? <Button type="primary" icon={<CreditCardOutlined />} onClick={() => setPayFine(fine)}>Thanh toán VNPay</Button> : <Tag color="green">Đã thanh toán</Tag>
                ]}
              >
                <List.Item.Meta title={`${fine.loanId ? `Đơn #${fine.loanId}` : "Phiếu phạt"} - ${formatCurrency(fine.amount)}`} description={`${fine.reason} / ${fine.status === "UNPAID" ? "Chưa thanh toán" : "Đã thanh toán"}${fine.copyBarcode ? ` / Mã bản sao: ${fine.copyBarcode}` : ""}`} />
              </List.Item>
            )}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn không có khoản phạt nào." />
        )}
      </Card>
      <Modal open={Boolean(payFine)} title="Thanh toán phiếu phạt qua VNPay" onCancel={() => setPayFine(null)} footer={[
        <Button key="close" onClick={() => setPayFine(null)}>Đóng</Button>,
        <Button key="paid" type="primary" icon={<BankOutlined />} onClick={handlePayFine}>Thanh toán qua VNPay</Button>
      ]}>
        {payFine ? (
          <div className="payment-modal-body">
            <Space direction="vertical">
              <Tag color="blue" icon={<CreditCardOutlined />}>VNPay</Tag>
              <Typography.Title level={4}>{formatCurrency(payFine.amount)}</Typography.Title>
              <Typography.Text>{payFine.reason}</Typography.Text>
              <Typography.Text type="secondary">Bạn sẽ được chuyển sang cổng thanh toán VNPay.</Typography.Text>
            </Space>
          </div>
        ) : null}
      </Modal>
      <Modal open={Boolean(selectedFine)} title={`Chi tiết phiếu phạt #${selectedFine?.id}`} onCancel={() => setSelectedFine(null)} footer={<Button onClick={() => setSelectedFine(null)}>Đóng</Button>}>
        {selectedFine ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Mã phiếu">#{selectedFine.id}</Descriptions.Item>
            <Descriptions.Item label="Mã đơn">{selectedFine.loanId ? `#${selectedFine.loanId}` : "-"}</Descriptions.Item>
            <Descriptions.Item label="Sách">{selectedFine.bookTitle || "-"}</Descriptions.Item>
            <Descriptions.Item label="Mã bản sao">{selectedFine.copyBarcode || "-"}</Descriptions.Item>
            <Descriptions.Item label="Số tiền">{formatCurrency(selectedFine.amount)}</Descriptions.Item>
            <Descriptions.Item label="Lý do">{selectedFine.reason}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{selectedFine.status === "UNPAID" ? <Tag color="red">Chưa thanh toán</Tag> : <Tag color="green">Đã thanh toán</Tag>}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
}

export function ReaderFavorites({ session }) {
  const navigate = useNavigate();
  const { wishlist } = useReaderData(session);
  async function handleAddToCart(book) {
    try {
      await libraryGateway.addToCart(session.id, book.id);
      window.dispatchEvent(new Event("cartUpdated"));
      message.success("Đã thêm sách vào giỏ mượn.");
      navigate("/reader/cart");
    } catch (error) {
      message.error(error?.message || "Không thể thêm sách vào giỏ mượn.");
    }
  }

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Yêu thích</p>
          <h1 className="page-title">Sách yêu thích</h1>
        </div>
      </div>
      {wishlist.length ? (
        <div className="reader-favorite-grid">
          {wishlist.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onAction={handleAddToCart}
              actionLabel="Thêm vào giỏ mượn"
              className="reader-favorite-book-card"
            />
          ))}
        </div>
      ) : (
        <Card className="glass-card"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có sách yêu thích." /></Card>
      )}
    </div>
  );
}

export function ReaderCard({ session, onSessionUpdate }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [kycForm] = Form.useForm();
  const [autoOpened, setAutoOpened] = useState(false);
  const { user, setUser, loadReader } = useReaderData(session);
  const [kycFileList, setKycFileList] = useState([]);
  const [submittingKyc, setSubmittingKyc] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [paySubscriptionOpen, setPaySubscriptionOpen] = useState(false);
  const [upgradePackages, setUpgradePackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [hasHigherTier, setHasHigherTier] = useState(true);
  const [qrIssuedAt, setQrIssuedAt] = useState(() => Date.now());
  const cardCode = user?.cardCode || "Chưa cấp thẻ";
  const readerUserId = user?.id || session?.id;
  const canEditKyc = user?.canEdit !== false && user?.kycStatus !== "VERIFIED";
  const hasExistingKycDocument = Boolean(user?.idCardImageUrl);
  const submitButtonLabel = hasExistingKycDocument || user?.kycStatus === "PENDING" ? "Cập nhật KYC" : "Gửi hồ sơ xác thực";
  
  const selectedPackage = upgradePackages.find(p => p.id === selectedPackageId);

  useEffect(() => {
    async function checkHigherTier() {
      if (!user?.membershipCode || user.membershipCode === "FREE") {
        setHasHigherTier(true);
        return;
      }
      try {
        const res = await apiClient.get('/memberships');
        const payload = res.data || res;
        const items = Array.isArray(payload) ? payload : (payload?.result || []);
        const currentPkg = items.find(m => m.code === user.membershipCode);
        const currentPrice = currentPkg ? (currentPkg.pricePerMonth || currentPkg.price || 0) : 0;
        const hasHigher = items.some(m => (m.pricePerMonth || m.price || 0) > currentPrice);
        setHasHigherTier(hasHigher);
      } catch (e) {
        setHasHigherTier(true);
      }
    }
    checkHigherTier();
  }, [user?.membershipCode]);

  useEffect(() => {
    setQrIssuedAt(Date.now());
    const timer = window.setInterval(() => setQrIssuedAt(Date.now()), READER_QR_TTL_MS);
    return () => window.clearInterval(timer);
  }, [session?.id]);

  useEffect(() => {
    if (user && location.state?.autoOpenSubscription && !autoOpened) {
      handleOpenSubscription(location.state.selectedPlanId);
      setAutoOpened(true);
      
      // Xóa state để không bị tự động mở lại nếu người dùng F5
      const nextState = { ...location.state };
      delete nextState.autoOpenSubscription;
      delete nextState.selectedPlanId;
      navigate(location.pathname, { replace: true, state: nextState });
    }
  }, [user, location.state, autoOpened, navigate, location.pathname]);

  useEffect(() => {
    kycForm.setFieldsValue({
      email: user?.email || session?.email || "",
      phone: user?.phone || session?.phone || "",
      address: user?.address || "",
      idCardNumber: user?.idCardNumber || ""
    });
  }, [kycForm, session?.email, session?.phone, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get("vnpay");
    if (!paymentStatus) {
      return;
    }

    async function refreshAfterPayment() {
      if (paymentStatus === "success") {
        message.success("Thanh toán thành công. Gói hội viên mới đã được kích hoạt.");
        const nextUser = await loadReader();
        if (nextUser) {
          const nextSession = normalizeSession({
            ...session,
            membershipCode: nextUser.membershipCode,
            membershipName: nextUser.membershipName,
            premiumValidUntil: nextUser.premiumValidUntil
          });
          writeSession(nextSession);
          onSessionUpdate?.(nextSession);
        }
      } else {
        message.error(params.get("message") || "Thanh toán VNPay chưa thành công.");
      }
      navigate(location.pathname, { replace: true });
    }

    refreshAfterPayment();
  }, [location.search]);

  async function handleSubmitKyc(values) {
    const selectedFile = kycFileList[0]?.originFileObj || null;
    if (!hasExistingKycDocument && !selectedFile) {
      message.error("Vui lòng tải ảnh CCCD hoặc thẻ sinh viên trước khi gửi hồ sơ.");
      return;
    }
    setSubmittingKyc(true);
    try {
      const nextUser = await libraryGateway.saveMyKyc(session.id, values, selectedFile, Boolean(hasExistingKycDocument || user?.kycStatus === "PENDING"));
      setUser(nextUser);
      setKycFileList([]);
      const nextSession = normalizeSession({ ...session, fullName: nextUser.fullName || session?.fullName, phone: nextUser.phone || "", studentCode: nextUser.studentCode || session?.studentCode, kycStatus: nextUser.kycStatus || session?.kycStatus });
      writeSession(nextSession);
      onSessionUpdate?.(nextSession);
      message.success("Đã gửi hồ sơ xác thực.");
    } catch (error) {
      message.error(error?.message || "Không thể lưu hồ sơ xác thực.");
    } finally {
      setSubmittingKyc(false);
    }
  }

  async function handleCancelKyc() {
    try {
      await libraryApi.users.cancelVerification();
      message.success("Đã hủy xác thực hồ sơ thành công.");
      await loadReader();
    } catch (error) {
      message.error(error?.message || "Không thể hủy xác thực.");
    }
  }

  async function handleOpenSubscription(preselectedPlanId) {
    setPaySubscriptionOpen(true);
    setLoadingPackages(true);
    try {
      const res = await apiClient.get('/memberships');
      
      const payload = res.data || res;
      const items = Array.isArray(payload) ? payload : (payload?.result || []);
      
      let premiums = items.filter(m => (m.pricePerMonth || m.price) > 0 || m.code !== 'FREE');
      
      // Nếu user đã có gói, chỉ lọc ra những gói đắt tiền hơn gói hiện tại
      if (user?.membershipCode && user.membershipCode !== "FREE") {
        const currentPkg = items.find(m => m.code === user.membershipCode);
        const currentPrice = currentPkg ? (currentPkg.pricePerMonth || currentPkg.price || 0) : 0;
        premiums = premiums.filter(m => (m.pricePerMonth || m.price || 0) > currentPrice);
      }
      
      if (premiums.length > 0) {
        setUpgradePackages(premiums);
        // Chọn gói từ URL nếu có, nếu không thì chọn gói mặc định đầu tiên
        if (preselectedPlanId && premiums.some(p => p.id === preselectedPlanId)) {
          setSelectedPackageId(preselectedPlanId);
        } else {
          setSelectedPackageId(premiums[0].id);
        }
      } else {
        message.info("Bạn đang sử dụng gói hội viên cao cấp nhất!");
        setPaySubscriptionOpen(false);
      }
    } catch (error) {
      message.error("Không thể tải danh sách gói hội viên. Vui lòng thử lại!");
      setPaySubscriptionOpen(false);
    } finally {
      setLoadingPackages(false);
    }
  }

  async function handleSubscribe() {
    setUpgrading(true);
    try {
      const payment = await libraryApi.payments.createPremiumVnpay(selectedPackageId);
      if (!payment?.paymentUrl) {
        throw new Error("Không nhận được liên kết thanh toán VNPay.");
      }
      window.location.assign(payment.paymentUrl);
      return;
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.message || "Lỗi kết nối đến máy chủ khi đăng ký.";
      message.error(errorMsg);
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="page-shell reader-dashboard">
      <div className="page-toolbar">
        <div>
          <p className="page-eyebrow">Thẻ thư viện</p>
          <h1 className="page-title">Thẻ thư viện & KYC</h1>
        </div>
      </div>
      <Row gutter={[18, 18]}>
        <Col xs={24} lg={9}>
          <Card className="glass-card reader-library-card" style={user?.membershipCode && user?.membershipCode !== "FREE" ? { background: "linear-gradient(135deg, #232526 0%, #414345 100%)", color: "white", borderColor: "gold" } : {}}>
            <Space direction="vertical" size={14} style={{ width: "100%" }}>
              <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                <div>
                  <Typography.Text type="secondary" style={user?.membershipCode && user?.membershipCode !== "FREE" ? { color: "gold" } : {}}>BOOKHUB CARD</Typography.Text>
                  <Typography.Title level={3} style={{ margin: 0, color: user?.membershipCode && user?.membershipCode !== "FREE" ? "white" : "inherit" }}>{cardCode}</Typography.Title>
                </div>
                {user?.membershipCode && user?.membershipCode !== "FREE" ? <Tag color="gold" style={{ textTransform: 'uppercase' }}>{user?.membershipName || user?.membershipCode}</Tag> : kycTag(user?.kycStatus)}
              </Space>
              <div style={{ background: user?.membershipCode && user?.membershipCode !== "FREE" ? "rgba(255,255,255,0.1)" : "transparent", padding: 8, borderRadius: 8, display: "inline-block" }}>
                <QRCode value={buildReaderQrToken(readerUserId, qrIssuedAt)} size={128} bordered={false} color={user?.membershipCode && user?.membershipCode !== "FREE" ? "gold" : "#000"} bgColor="transparent" />
              </div>
              <Typography.Text type="secondary" style={user?.membershipCode && user?.membershipCode !== "FREE" ? { color: "#ccc" } : {}}>Làm mới lúc {formatQrTime(qrIssuedAt + READER_QR_TTL_MS)}</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={15}>
          <Card className="glass-card" title="Thông tin thẻ thư viện">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Họ tên">{user?.fullName || session?.fullName || "-"}</Descriptions.Item>
              <Descriptions.Item label="Mã bạn đọc">{user?.studentCode || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email">{user?.email || session?.email || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{user?.phone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{user?.address || "-"}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{kycTag(user?.kycStatus)}</Descriptions.Item>
              <Descriptions.Item label="Gói hội viên">
                {user?.membershipCode && user?.membershipCode !== "FREE" ? (
                  <Space>
                    <Tag color="gold">{user?.membershipName || user?.membershipCode}</Tag>
                    <Typography.Text type="secondary">
                      (Hạn tới: {formatDate(user?.premiumValidUntil)})
                    </Typography.Text>
                    {hasHigherTier && (
                      <Button size="small" style={{ background: "gold", borderColor: "gold", color: "black", fontWeight: 500 }} onClick={() => handleOpenSubscription()}>
                        Nâng cấp
                      </Button>
                    )}
                  </Space>
                ) : (
                  <Space>
                    <Tag>{user?.membershipName && user.membershipCode === "FREE" ? user.membershipName : "Cơ bản"}</Tag>
                    <Button size="small" style={{ background: "gold", borderColor: "gold", color: "black", fontWeight: 500 }} onClick={() => handleOpenSubscription()}>
                      Đăng ký
                    </Button>
                  </Space>
                )}
              </Descriptions.Item>
            </Descriptions>
            {user?.kycStatus !== "VERIFIED" ? (
              <Form form={kycForm} layout="vertical" onFinish={handleSubmitKyc} className="reader-kyc-form">
                <Row gutter={14}>
                  <Col xs={24} md={12}><Form.Item name="email" label="Email xác thực" rules={[{ required: true }, { type: "email" }]}><Input disabled={!canEditKyc} /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}><Input disabled={!canEditKyc} /></Form.Item></Col>
                  <Col xs={24}><Form.Item name="address" label="Địa chỉ" rules={[{ required: true }]}><Input.TextArea rows={2} disabled={!canEditKyc} /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="idCardNumber" label="Số CCCD / Mã sinh viên"><Input disabled={!canEditKyc} /></Form.Item></Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Ảnh CCCD / Thẻ sinh viên">
                      <Upload accept=".jpg,.jpeg,.png,.webp" beforeUpload={() => false} disabled={!canEditKyc} fileList={kycFileList} maxCount={1} onChange={({ fileList }) => setKycFileList(fileList.slice(-1))}>
                        <Button disabled={!canEditKyc} icon={<UploadOutlined />}>Chọn ảnh</Button>
                      </Upload>
                      {user?.idCardImageUrl ? <Button type="link" href={toAbsoluteMediaUrl(user.idCardImageUrl)} target="_blank" style={{ paddingInline: 0 }}>Xem ảnh đã lưu</Button> : null}
                    </Form.Item>
                  </Col>
                </Row>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submittingKyc} disabled={!canEditKyc}>{submitButtonLabel}</Button>
                  {user?.kycStatus === "PENDING" ? <Popconfirm title="Hủy xác thực hồ sơ?" onConfirm={handleCancelKyc}><Button danger>Hủy xác thực</Button></Popconfirm> : null}
                </Space>
              </Form>
            ) : <Alert type="success" showIcon message="Hồ sơ đã được xác thực." style={{ marginTop: 16 }} />}
          </Card>
        </Col>
      </Row>

      <Modal 
        open={paySubscriptionOpen} 
        title="Chọn gói hội viên"
        onCancel={() => setPaySubscriptionOpen(false)} 
        footer={[
          <Button key="close" onClick={() => setPaySubscriptionOpen(false)}>Đóng</Button>,
          <Button key="confirm" type="primary" icon={<BankOutlined />} loading={upgrading} onClick={handleSubscribe} disabled={!selectedPackageId || loadingPackages}>Thanh toán VNPay</Button>
        ]}
      >
        <div className="package-selection-body" style={{ paddingTop: 8 }}>
          <List
            loading={loadingPackages}
            dataSource={upgradePackages}
            renderItem={(pkg) => (
              <List.Item
                onClick={() => setSelectedPackageId(pkg.id)}
                style={{
                  cursor: 'pointer',
                  border: selectedPackageId === pkg.id ? '2px solid #1677ff' : '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 12,
                  background: selectedPackageId === pkg.id ? '#e6f4ff' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <List.Item.Meta
                  title={<Space size={8}>{pkg.name || pkg.code} {selectedPackageId === pkg.id && <CheckCircleOutlined style={{ color: '#1677ff' }} />}</Space>}
                  description={`Mượn tối đa ${pkg.maxBorrowLimit || 3} cuốn`}
                />
                <div style={{ textAlign: 'right' }}>
                  <strong style={{ fontSize: 16, color: '#1677ff' }}>{formatCurrency(pkg.pricePerMonth || pkg.price || 49000)}</strong>
                  <div style={{ fontSize: 12, color: '#888' }}>/ tháng</div>
                </div>
              </List.Item>
            )}
          />
          {selectedPackage && (
            <div style={{ marginTop: 8, padding: '12px 16px', background: '#f5f5f5', borderRadius: 8, border: '1px solid #e8e8e8' }}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8, color: '#1677ff' }}>Chi tiết quyền lợi:</Typography.Text>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: '1.8' }}>
                <li>Được mượn tối đa: <strong>{selectedPackage.maxBorrowLimit || 3} cuốn</strong> cùng lúc</li>
                <li>Phí giao hàng: <strong>{selectedPackage.deliveryFee === 0 ? "Miễn phí" : formatCurrency(selectedPackage.deliveryFee || 20000)}</strong></li>
                <li>Ưu tiên xử lý đơn: <strong>{selectedPackage.priorityProcessing ? "Có" : "Không"}</strong></li>
                {selectedPackage.benefitsDescription && (
                  <li>{selectedPackage.benefitsDescription}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
