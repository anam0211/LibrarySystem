import {
  BellOutlined,
  HeartOutlined,
  IdcardOutlined,
  LogoutOutlined,
  ReadOutlined,
  RollbackOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";

const { Content, Sider } = Layout;

const READER_MENU_ITEMS = [
  { key: "/reader", label: "Tổng quan", icon: <ReadOutlined /> },
  { key: "/reader/orders", label: "Đơn mượn", icon: <TruckOutlined /> },
  { key: "/reader/returns", label: "Trả sách", icon: <RollbackOutlined /> },
  { key: "/reader/fines", label: "Nợ phạt", icon: <WalletOutlined /> },
  { key: "/reader/favorites", label: "Yêu thích", icon: <HeartOutlined /> },
  { key: "/reader/card", label: "Thẻ thư viện", icon: <IdcardOutlined /> },
  { key: "/reader/account", label: "Tài khoản", icon: <SettingOutlined /> },
  { key: "/reader/cart", label: "Giỏ mượn", icon: <ShoppingCartOutlined /> },
  { key: "/reader/notifications", label: "Thông báo", icon: <BellOutlined /> }
];

function ReaderSidebar({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedKey =
    READER_MENU_ITEMS.find((item) => item.key === location.pathname)?.key
    || READER_MENU_ITEMS.find((item) => item.key !== "/reader" && location.pathname.startsWith(item.key))?.key
    || "/reader";

  return (
    <Sider width={240} breakpoint="lg" collapsedWidth={0} className="app-sider reader-sider">
      <div className="app-brand">
        <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
          <strong>BOOKHUB</strong>
          <span>Tài khoản bạn đọc</span>
        </Link>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={READER_MENU_ITEMS}
        className="app-menu"
        onClick={({ key }) => navigate(key)}
      />

      <div className="app-sider-account">
        <Typography.Text strong>{session?.fullName || "Bạn đọc"}</Typography.Text>
        <Typography.Text type="secondary">{session?.email}</Typography.Text>
        <Button icon={<LogoutOutlined />} danger onClick={onLogout}>
          Đăng xuất
        </Button>
      </div>
    </Sider>
  );
}

export default function ReaderLayout({ session, onLogout }) {
  return (
    <Layout className="app-layout reader-layout">
      <ReaderSidebar session={session} onLogout={onLogout} />
      <Layout className="app-main-layout" style={{ background: "transparent" }}>
        <Content className="app-content reader-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export { ReaderSidebar };
