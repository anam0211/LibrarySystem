import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  IdcardOutlined,
  MessageOutlined,
  ShopOutlined,
  TruckOutlined,
  UserOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "../components/formatters";

const KANBAN_STATUSES = ["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNING", "RETURNED"];

const PICKUP_COLUMNS = [
  {
    key: "NEW",
    title: "Chờ xác nhận",
    note: "Bạn đọc đến quầy, thủ thư xác nhận",
    color: "gold"
  },
  {
    key: "BORROWING",
    title: "Đang mượn",
    note: "Đã bàn giao sách trực tiếp",
    color: "green"
  },
  {
    key: "RETURNED",
    title: "Đã trả",
    note: "Thủ thư đã nhận lại sách",
    color: "default"
  }
];

const DELIVERY_COLUMNS = [
  {
    key: "NEW",
    title: "Chờ xác nhận",
    note: "Kiểm tra địa chỉ, hồ sơ",
    color: "gold"
  },
  {
    key: "PACKING",
    title: "Đang đóng gói",
    note: "Chuẩn bị sách để giao",
    color: "cyan"
  },
  {
    key: "SHIPPING",
    title: "Đang giao",
    note: "Theo dõi đơn vận chuyển",
    color: "blue"
  },
  {
    key: "BORROWING",
    title: "Đã giao / đang mượn",
    note: "Bạn đọc đã nhận sách",
    color: "green"
  },
  {
    key: "RETURNING",
    title: "Yêu cầu trả",
    note: "Bạn đọc chờ thư viện nhận lại",
    color: "purple"
  },
  {
    key: "RETURNED",
    title: "Đã trả",
    note: "Đã nhận lại sách",
    color: "default"
  }
];

function isDeliveryLoan(loan) {
  return loan.receiveMethod === "DELIVERY" || loan.deliveryMethod === "HOME_DELIVERY";
}

function isPickupLoan(loan) {
  return !isDeliveryLoan(loan);
}

function statusTitle(columns, status) {
  return columns.find((column) => column.key === status)?.title || status;
}

function KanbanBoard({ title, subtitle, icon, mode, columns, loans, onMove }) {
  return (
    <Card
      className="glass-card"
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
      extra={<Tag color="blue">{loans.length} đơn</Tag>}
    >
      <Typography.Paragraph className="kanban-board-copy">{subtitle}</Typography.Paragraph>

      <div className="kanban-board">
        {columns.map((column) => {
          const columnLoans = loans.filter((loan) => loan.status === column.key);

          return (
            <section
              className="kanban-column"
              key={column.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onMove(event, column.key, mode, column.title)}
            >
              <div className="kanban-column-head">
                <div>
                  <strong>{column.title}</strong>
                  <p>{column.note}</p>
                </div>
                <Tag color={column.color}>{columnLoans.length}</Tag>
              </div>

              <div className="kanban-list">
                {columnLoans.map((loan) => (
                  <article
                    className="kanban-card"
                    key={loan.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/plain", loan.id);
                      event.dataTransfer.setData("loan-mode", mode);
                    }}
                  >
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Space wrap>
                        <Tag color={column.color}>{loan.id}</Tag>
                        <Tag>{mode === "DELIVERY" ? "Giao tại nhà" : "Đến lấy"}</Tag>
                      </Space>
                      <Typography.Text strong>{loan.readerName}</Typography.Text>
                      <Typography.Text type="secondary">{loan.bookTitle}</Typography.Text>
                      {mode === "DELIVERY" && loan.address ? (
                        <Typography.Text type="secondary" className="kanban-address">
                          {loan.address}
                        </Typography.Text>
                      ) : null}
                      <div className="kanban-meta">
                        <span>{formatDate(loan.createdAt)}</span>
                        <span>Hạn: {formatDate(loan.dueDate)}</span>
                      </div>
                    </Space>
                  </article>
                ))}

                {!columnLoans.length ? <div className="kanban-empty">Không có đơn</div> : null}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [fines, setFines] = useState([]);
  const [reviews, setReviews] = useState([]);

  async function refresh() {
    const [nextLoans, nextUsers, nextFines, nextReviews] = await Promise.all([
      libraryGateway.listLoans(),
      libraryGateway.listUsers(),
      libraryGateway.listFines(),
      libraryGateway.listReviews()
    ]);
    setLoans(nextLoans);
    setUsers(nextUsers);
    setFines(nextFines);
    setReviews(nextReviews);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDrop(event, status, mode, title) {
    const loanId = event.dataTransfer.getData("text/plain");
    const sourceMode = event.dataTransfer.getData("loan-mode");

    if (!loanId) {
      return;
    }

    if (sourceMode && sourceMode !== mode) {
      message.warning("Không kéo đơn giữa hai hình thức nhận sách.");
      return;
    }

    try {
      await libraryGateway.moveLoan(loanId, status);
      await refresh();
      message.success(`Đã chuyển đơn ${loanId} sang ${title}.`);
    } catch (error) {
      message.error(error?.message || "Không thể cập nhật trạng thái đơn.");
    }
  }

  const kanbanLoans = useMemo(
    () => loans.filter((loan) => KANBAN_STATUSES.includes(loan.status)),
    [loans]
  );
  const pickupLoans = useMemo(() => kanbanLoans.filter(isPickupLoan), [kanbanLoans]);
  const deliveryLoans = useMemo(() => kanbanLoans.filter(isDeliveryLoan), [kanbanLoans]);

  const metrics = useMemo(() => {
    const pendingKyc = users.filter((user) => user.kycStatus === "PENDING").length;
    const unpaid = fines.filter((fine) => fine.status === "UNPAID");

    return {
      activeOrders: loans.filter((loan) => loan.status !== "RETURNED").length,
      pickupBorrowing: pickupLoans.filter((loan) => loan.status === "BORROWING").length,
      delivering: deliveryLoans.filter((loan) => loan.status === "SHIPPING").length,
      returning: deliveryLoans.filter((loan) => loan.status === "RETURNING").length,
      pendingKyc,
      hiddenReviews: reviews.filter((review) => review.hidden).length,
      unpaidAmount: unpaid.reduce((sum, fine) => sum + fine.amount, 0)
    };
  }, [deliveryLoans, fines, loans, pickupLoans, reviews, users]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Điều phối mượn sách"
        description="Theo dõi riêng đơn đến lấy tại quầy và đơn giao tại nhà để xử lý đúng quy trình."
        extra={
          <Space wrap>
            <Link to="/admin/kyc">
              <Button icon={<IdcardOutlined />}>Quản lý KYC</Button>
            </Link>
            <Link to="/admin/fines">
              <Button type="primary" icon={<WarningOutlined />}>Thu phạt</Button>
            </Link>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={5}>
          <Card className="metric-card">
            <Statistic title="Đơn đang xử lý" value={metrics.activeOrders} prefix={<TruckOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={5}>
          <Card className="metric-card">
            <Statistic title="Đang mượn tại quầy" value={metrics.pickupBorrowing} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={5}>
          <Card className="metric-card">
            <Statistic title="Đang giao" value={metrics.delivering} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={5}>
          <Card className="metric-card">
            <Statistic title="Yêu cầu trả" value={metrics.returning} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={24} xl={4}>
          <Card className="metric-card">
            <Typography.Text type="secondary">Nợ chưa thu</Typography.Text>
            <strong>{formatCurrency(metrics.unpaidAmount)}</strong>
          </Card>
        </Col>
      </Row>

      <KanbanBoard
        title="Đến lấy tại quầy"
        subtitle="Mượn trực tiếp chỉ cần xác nhận tại quầy, chuyển sang đang mượn và kết thúc khi bạn đọc trả sách."
        icon={<ShopOutlined />}
        mode="PICKUP"
        columns={PICKUP_COLUMNS}
        loans={pickupLoans}
        onMove={handleDrop}
      />

      <KanbanBoard
        title="Giao tại nhà"
        subtitle="Giao tận nhà có đóng gói, vận chuyển, xác nhận đã giao, sau đó bạn đọc tạo yêu cầu trả sách từ trang hồ sơ."
        icon={<HomeOutlined />}
        mode="DELIVERY"
        columns={DELIVERY_COLUMNS}
        loans={deliveryLoans}
        onMove={handleDrop}
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card className="glass-card" title="Luồng nghiệp vụ">
            <Space direction="vertical">
              <Tag icon={<CheckCircleOutlined />} color="green">Bạn đọc gửi KYC</Tag>
              <Tag icon={<CheckCircleOutlined />} color="green">Admin duyệt hồ sơ</Tag>
              <Tag color="gold">{statusTitle(PICKUP_COLUMNS, "NEW")} đơn mượn</Tag>
              <Tag color="cyan">Chuẩn bị hoặc đóng gói sách</Tag>
              <Tag color="blue">Tách tại quầy và giao tại nhà</Tag>
              <Tag color="red">Theo dõi phạt và quá hạn</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card className="glass-card" title="Truy cập nhanh">
            <Space wrap>
              <Link to="/books"><Button type="primary">Quản lý sách</Button></Link>
              <Link to="/media"><Button>Media</Button></Link>
              <Link to="/authors"><Button>Tác giả</Button></Link>
              <Link to="/categories"><Button>Danh mục</Button></Link>
              <Link to="/publishers"><Button>NXB</Button></Link>
              <Link to="/admin/kyc"><Button>Quản lý KYC</Button></Link>
              <Link to="/admin/reviews"><Button>Quản lý review</Button></Link>
              <Link to="/admin/fines"><Button>Thu phạt</Button></Link>
              <Link to="/"><Button>Kho sách client</Button></Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
