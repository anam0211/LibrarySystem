import { CheckCircleOutlined, CrownOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Spin, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import PublicShell from "../components/PublicChrome";
import { formatCurrency } from "../components/formatters";

export default function Plans({ session, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [memberships, setMemberships] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [membershipsRes, userData] = await Promise.all([
          apiClient.get('/memberships'),
          session?.id ? libraryGateway.getUser(session.id) : Promise.resolve(null)
        ]);
        
        const payload = membershipsRes.data || membershipsRes;
        const items = Array.isArray(payload) ? payload : (payload?.result || []);
        setMemberships(items.filter(m => (m.pricePerMonth || m.price) > 0 || m.code !== 'FREE'));
        setUser(userData);
      } catch (err) {
        message.error("Không thể tải dữ liệu gói hội viên.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [session?.id]);

  return (
    <PublicShell session={session} onLogout={onLogout}>
      <section className="page-shell" style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <CrownOutlined style={{ fontSize: 56, color: 'gold', marginBottom: 16 }} />
          <Typography.Title level={1}>Đăng ký Hội viên BookHub</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 18 }}>
            Lựa chọn gói hội viên phù hợp để mượn sách không giới hạn cùng nhiều đặc quyền giao hàng.
          </Typography.Paragraph>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[24, 24]} justify="center">
            {memberships.map(pkg => {
              const isCurrentPlan = user?.membershipCode === pkg.code;
              const hasMembership = user?.membershipCode && user.membershipCode !== 'FREE';
              
              return (
                <Col xs={24} sm={12} md={8} key={pkg.id}>
                  <Card 
                    hoverable 
                    className="glass-card"
                    style={{ height: '100%', display: 'flex', flexDirection: 'column', borderColor: isCurrentPlan ? '#1677ff' : '#e8e8e8' }}
                    bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <Typography.Title level={3} style={{ marginTop: 0, color: '#1677ff' }}>
                      {pkg.name || pkg.code}
                    </Typography.Title>
                    <div style={{ marginBottom: 24 }}>
                      <span style={{ fontSize: 32, fontWeight: 'bold' }}>{formatCurrency(pkg.pricePerMonth || pkg.price)}</span>
                      <span style={{ color: '#888' }}> / tháng</span>
                    </div>
                    
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', flex: 1, lineHeight: '2.5' }}>
                      <li><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Mượn tối đa <strong>{pkg.maxBorrowLimit || 3} cuốn</strong> cùng lúc</li>
                      <li><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Phí giao: <strong>{pkg.deliveryFee === 0 ? "Miễn phí" : formatCurrency(pkg.deliveryFee)}</strong></li>
                      <li><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> Ưu tiên xử lý đơn: <strong>{pkg.priorityProcessing ? "Có" : "Không"}</strong></li>
                      {pkg.benefitsDescription && (
                        <li><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} /> {pkg.benefitsDescription}</li>
                      )}
                    </ul>

                    <Button 
                      type="primary" 
                      size="large" 
                      block 
                      disabled={isCurrentPlan}
                      style={isCurrentPlan ? { fontWeight: 'bold' } : { background: 'gold', borderColor: 'gold', color: 'black', fontWeight: 'bold' }}
                      onClick={() => navigate(session ? "/reader/card" : "/login", { state: { from: { pathname: "/reader/card" }, autoOpenSubscription: !hasMembership, selectedPlanId: pkg.id } })}
                    >
                      {isCurrentPlan ? "Đã đăng ký" : "Đăng ký ngay"}
                    </Button>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </section>
    </PublicShell>
  );
}
