import {
  ApartmentOutlined,
  BarChartOutlined,
  BookOutlined,
  CreditCardOutlined,
  FileImageOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MessageOutlined,
  ReadOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, Typography } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const { Content, Sider } = Layout;

const MENU_ITEMS = [
  { key: "/dashboard", label: "Dashboard", icon: <BarChartOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/books", label: "Quản lý sách", icon: <BookOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/media", label: "Media", icon: <FileImageOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/authors", label: "Tác giả", icon: <TeamOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/categories", label: "Danh mục", icon: <TagsOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/publishers", label: "NXB", icon: <ApartmentOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/users", label: "Người dùng", icon: <UserOutlined />, roles: ["ADMIN"] },
  { key: "/admin/kyc", label: "Duyệt KYC", icon: <IdcardOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/admin/reviews", label: "Review", icon: <MessageOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/admin/fines", label: "Thu phạt", icon: <WalletOutlined />, roles: ["ADMIN", "LIBRARIAN"] },
  { key: "/reader", label: "Hồ sơ", icon: <ReadOutlined />, roles: ["READER"] },
  { key: "/cart", label: "Giỏ mượn", icon: <ShoppingCartOutlined />, roles: ["READER"] }
];

export default function AppLayout({ session, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuItems = MENU_ITEMS.filter((item) => item.roles.includes(session?.role)).map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label
  }));

  const selectedKey =
    menuItems.find((item) => location.pathname.startsWith(item.key))?.key || menuItems[0]?.key;

  return (
    <Layout className="app-layout">
      <Sider width={272} breakpoint="lg" collapsedWidth={0} className="app-sider">
        <div className="app-brand">
          <strong>BookHub Console</strong>
          <span>Quản lý thư viện</span>
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

      <Layout style={{ background: "transparent" }}>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
