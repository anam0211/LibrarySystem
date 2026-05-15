import {
  ApartmentOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CreditCardOutlined,
  CrownOutlined,
  FileImageOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MessageOutlined,
  ShopOutlined,
  TagsOutlined,
  TeamOutlined,
  TruckOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const { Content, Sider } = Layout;

const MENU_ITEMS = [
  { key: "/dashboard", label: "Dashboard", icon: <BarChartOutlined />, roles: ["ADMIN"] },
  { key: "/books", label: "Quản lý sách", icon: <BookOutlined />, roles: ["ADMIN"] },
  { key: "/media", label: "Media", icon: <FileImageOutlined />, roles: ["ADMIN"] },
  { key: "/authors", label: "Tác giả", icon: <TeamOutlined />, roles: ["ADMIN"] },
  { key: "/categories", label: "Danh mục", icon: <TagsOutlined />, roles: ["ADMIN"] },
  { key: "/publishers", label: "NXB", icon: <ApartmentOutlined />, roles: ["ADMIN"] },
  { key: "/admin/memberships", label: "Gói hội viên", icon: <CrownOutlined />, roles: ["ADMIN"] },
  { key: "/loans/pickup", label: "Đến lấy", icon: <ShopOutlined />, roles: ["LIBRARIAN"] },
  { key: "/loans/delivery", label: "Giao tận nhà", icon: <TruckOutlined />, roles: ["LIBRARIAN"] },
  { key: "/users", label: "Người dùng", icon: <UserOutlined />, roles: ["ADMIN"] },
  { key: "/admin/kyc", label: "Duyệt KYC", icon: <IdcardOutlined />, roles: ["LIBRARIAN"] },
  { key: "/admin/reviews", label: "Review", icon: <MessageOutlined />, roles: ["LIBRARIAN"] },
  { key: "/admin/fines", label: "Thu phạt", icon: <WalletOutlined />, roles: ["LIBRARIAN"] },
  { key: "/notifications", label: "Thông báo", icon: <BellOutlined />, roles: ["LIBRARIAN"] }
];

export default function AppLayout({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = MENU_ITEMS.filter((item) => item.roles.includes(session?.role)).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label
  }));

  const currentPath = `${location.pathname}${location.search}`;
  const selectedKey =
    menuItems.find((item) => currentPath === item.key)?.key
    || menuItems.find((item) => item.key === location.pathname)?.key
    || menuItems.find((item) => location.pathname.startsWith(item.key))?.key
    || menuItems[0]?.key;
  const isReader = session?.role === "READER";

  return (
    <Layout className="app-layout">
      <Sider width={240} breakpoint="lg" collapsedWidth={0} className="app-sider">
        <div className="app-brand">
          <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column" }}>
            <strong>{isReader ? "BOOKHUB" : "BookHub Console"}</strong>
            <span>{isReader ? "Tài khoản bạn đọc" : "Quản lý thư viện"}</span>
          </Link>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={menuItems}
          className="app-menu"
          onClick={({ key }) => navigate(key)}
        />

        <div className="app-sider-account">
          <Typography.Text strong>{session?.fullName || "Người dùng"}</Typography.Text>
          <Typography.Text type="secondary">{session?.email}</Typography.Text>
          {session?.studentCode ? (
            <Typography.Text type="secondary">
              <CreditCardOutlined /> {session.studentCode}
            </Typography.Text>
          ) : null}
          <Button icon={<LogoutOutlined />} danger onClick={onLogout}>
            Đăng xuất
          </Button>
        </div>
      </Sider>

      <Layout className="app-main-layout" style={{ background: "transparent" }}>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
