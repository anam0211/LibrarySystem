import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  IdcardOutlined,
  MessageOutlined,
  ShopOutlined,
  TruckOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatCurrency } from "../components/formatters";

function isDeliveryLoan(loan) {
  return loan.receiveMethod === "DELIVERY" || loan.deliveryMethod === "HOME_DELIVERY";
}

function isPickupLoan(loan) {
  return !isDeliveryLoan(loan);
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

  const pickupLoans = useMemo(() => loans.filter(isPickupLoan), [loans]);
  const deliveryLoans = useMemo(() => loans.filter(isDeliveryLoan), [loans]);

  const metrics = useMemo(() => {
    const unpaid = fines.filter((fine) => fine.status === "UNPAID");

    return {
      activeOrders: loans.filter((loan) => loan.status !== "RETURNED").length,
      pickupActive: pickupLoans.filter((loan) => loan.status !== "RETURNED").length,
      deliveryActive: deliveryLoans.filter((loan) => loan.status !== "RETURNED").length,
      delivering: deliveryLoans.filter((loan) => loan.status === "SHIPPING").length,
      returning: deliveryLoans.filter((loan) => loan.status === "RETURNING").length,
      pendingKyc: users.filter((user) => user.kycStatus === "PENDING").length,
      hiddenReviews: reviews.filter((review) => review.hidden).length,
      unpaidAmount: unpaid.reduce((sum, fine) => sum + fine.amount, 0)
    };
  }, [deliveryLoans, fines, loans, pickupLoans, reviews, users]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Tổng quan thư viện"
        description="Theo dõi nhanh vận hành thư viện và đi tới các khu vực biên mục dành cho quản trị viên."
        extra={
          <Space wrap>
            <Link to="/books">
              <Button icon={<CheckCircleOutlined />}>Quản lý sách</Button>
            </Link>
            <Link to="/media">
              <Button type="primary">Media</Button>
            </Link>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Đơn đang xử lý" value={metrics.activeOrders} prefix={<TruckOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Đơn đến lấy" value={metrics.pickupActive} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Đơn giao tận nhà" value={metrics.deliveryActive} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Yêu cầu trả" value={metrics.returning} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Chờ duyệt KYC" value={metrics.pendingKyc} prefix={<IdcardOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Review ẩn" value={metrics.hiddenReviews} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Đang giao" value={metrics.delivering} prefix={<TruckOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Typography.Text type="secondary">Nợ chưa thu</Typography.Text>
            <strong>{formatCurrency(metrics.unpaidAmount)}</strong>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={8}>
          <Card className="glass-card" title="Biên mục nhanh">
            <Space direction="vertical">
              <Link to="/books">
                <Button block type="primary" icon={<CheckCircleOutlined />}>Quản lý sách</Button>
              </Link>
              <Link to="/media">
                <Button block>Media</Button>
              </Link>
              <Tag icon={<CheckCircleOutlined />} color="green">Khu vực này dành riêng cho quản trị viên</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card className="glass-card" title="Truy cập nhanh">
            <Space wrap>
              <Link to="/authors"><Button>Tác giả</Button></Link>
              <Link to="/categories"><Button>Danh mục</Button></Link>
              <Link to="/publishers"><Button>NXB</Button></Link>
              <Link to="/"><Button>Kho sách client</Button></Link>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
