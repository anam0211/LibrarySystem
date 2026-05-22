import {
  BookOutlined,
  ExclamationCircleOutlined,
  ShopOutlined,
  TeamOutlined,
  TruckOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Statistic, Tag } from "antd";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatCurrency } from "../components/formatters";

export default function Dashboard() {
  const [catalog, setCatalog] = useState({});
  const [operations, setOperations] = useState({});

  async function refresh() {
    const [nextCatalog, nextOperations] = await Promise.all([
      libraryGateway.getCatalogOverview(),
      libraryGateway.getOperationsOverview()
    ]);

    setCatalog(nextCatalog || {});
    setOperations(nextOperations || {});
  }

  useEffect(() => {
    refresh();
  }, []);

  const metrics = useMemo(() => ({
    totalBooks: Number(catalog.totalBooks || 0),
    totalUsers: Number(operations.totalUsers || 0),
    pickupLoans: Number(operations.pickupLoans || 0),
    deliveryLoans: Number(operations.deliveryLoans || 0),
    outOfStockBooks: Number(catalog.outOfStockBooks || 0),
    unpaidFineAmount: Number(operations.unpaidFineAmount || 0),
    membershipRevenue: Number(operations.membershipRevenue || 0)
  }), [catalog, operations]);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin dashboard"
        title="Tổng quan thư viện"
        description="Theo dõi nhanh kho sách, bạn đọc, đơn mượn và dòng tiền chính của hệ thống."
        extra={
          <Space wrap>
            <Link to="/books">
              <Button icon={<BookOutlined />}>Quản lý sách</Button>
            </Link>
            <Link to="/admin/memberships">
              <Button type="primary">Gói hội viên</Button>
            </Link>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Tổng sách" value={metrics.totalBooks} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Tổng người dùng" value={metrics.totalUsers} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Tổng đơn đến lấy" value={metrics.pickupLoans} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Tổng đơn giao tại nhà" value={metrics.deliveryLoans} prefix={<TruckOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Sách hết hàng" value={metrics.outOfStockBooks} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Nợ phạt chưa thu" value={metrics.unpaidFineAmount} formatter={formatCurrency} prefix={<WalletOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card className="metric-card">
            <Statistic title="Doanh thu hội viên" value={metrics.membershipRevenue} formatter={formatCurrency} prefix={<WalletOutlined />} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
