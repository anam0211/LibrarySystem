import {
  BellOutlined,
  DashboardOutlined,
  HeartOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  TrophyOutlined,
  UserOutlined
} from "@ant-design/icons";
import { Avatar, Badge, Dropdown, Input, Popover } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getDefaultRoute } from "../api/authStore";
import { libraryApi } from "../api/libraryApi";
import { libraryGateway } from "../api/libraryGateway";

function getInitials(session) {
  return String(session?.fullName || session?.email || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function PublicHeader({
  session,
  onLogout,
  onSearchClick,
  onSearchSubmit,
  searchValue,
  navContent
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isReader = session?.role === "READER";
  const showReaderTools = !session || isReader;
  const [searchText, setSearchText] = useState(searchValue || "");
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCartCount() {
      if (session?.id && isReader) {
        try {
          const cart = await libraryGateway.getCart(session.id);
          if (active) {
            setCartCount(cart.length);
          }
        } catch (error) {
          // Bỏ qua lỗi
        }
      }
    }

    loadCartCount();

    window.addEventListener("cartUpdated", loadCartCount);

    return () => {
      active = false;
      window.removeEventListener("cartUpdated", loadCartCount);
    };
  }, [session?.id, isReader]);

  useEffect(() => {
    let active = true;

    async function loadUnreadCount() {
      if (!session?.id) {
        setUnreadCount(0);
        return;
      }

      try {
        const unreadNotifications = await libraryApi.notifications.unread(session.id);
        if (active) {
          setUnreadCount(Array.isArray(unreadNotifications) ? unreadNotifications.length : 0);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    window.addEventListener("notificationUpdated", loadUnreadCount);
    window.addEventListener("focus", loadUnreadCount);

    return () => {
      active = false;
      window.removeEventListener("notificationUpdated", loadUnreadCount);
      window.removeEventListener("focus", loadUnreadCount);
    };
  }, [session?.id, location.pathname]);

  useEffect(() => {
    setSearchText(searchValue || "");
  }, [searchValue]);

  function goHome() {
    navigate("/", {
      state: {
        reset: true,
        scrollTo: "top"
      }
    });
  }

  function goCatalog(filters = null) {
    navigate("/", {
      state: {
        filters,
        scrollTo: "catalog"
      }
    });
  }

  function goReaderTool(path) {
    if (!session) {
      navigate("/login");
      return;
    }

    navigate(isReader ? path : getDefaultRoute(session.role));
  }

  function handleSearchSubmit(event) {
    event.preventDefault();

    const keyword = searchText.trim();
    setSearchOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(keyword);
      return;
    }

    if (keyword) {
      goCatalog({ keyword });
      return;
    }

    if (onSearchClick) {
      onSearchClick();
      return;
    }

    goCatalog();
  }

  const accountMenu = session
    ? [
        {
          key: "account",
          icon: <UserOutlined />,
          label: "Tài khoản",
          onClick: () => navigate("/reader")
        },
        {
          key: "orders",
          icon: <ShoppingCartOutlined />,
          label: "Phiếu mượn",
          onClick: () => navigate("/reader/orders")
        },
        ...(isReader ? [] : [
          {
            key: "workspace",
            icon: <DashboardOutlined />,
            label: "Trang quản trị",
            onClick: () => navigate(getDefaultRoute(session.role))
          }
        ]),
        {
          type: "divider"
        },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          label: "Đăng xuất",
          danger: true,
          onClick: () => {
            onLogout?.();
            navigate("/");
          }
        }
      ]
    : [
        {
          key: "login",
          icon: <LoginOutlined />,
          label: "Đăng nhập",
          onClick: () => navigate("/login")
        }
      ];

  const defaultNav = (
    <nav className="public-nav" aria-label="Điều hướng công khai">
      <button
        className={`public-nav-btn ${location.pathname === "/" ? "active" : ""}`}
        type="button"
        onClick={goHome}
      >
        <HomeOutlined /> Trang chủ
      </button>
      <button className="public-nav-btn" type="button" onClick={() => goCatalog()}>
        Kho sách
      </button>
      <button className="public-nav-btn" type="button" onClick={() => goReaderTool("/reader/orders")}>
        Đơn mượn
      </button>
      <button className="public-nav-btn" type="button" onClick={() => goReaderTool("/reader/returns")}>
        Trả sách
      </button>
      <button
        className={`public-nav-btn ${location.pathname === "/leaderboard" ? "active" : ""}`}
        type="button"
        onClick={() => navigate("/leaderboard")}
      >
        <TrophyOutlined /> Xếp hạng
      </button>
    </nav>
  );

  const searchContent = (
    <form className="public-search-form" onSubmit={handleSearchSubmit}>
      <Input
        allowClear
        autoFocus
        size="large"
        value={searchText}
        prefix={<SearchOutlined />}
        placeholder="Nhập tên sách, ISBN, tác giả rồi nhấn Enter"
        onChange={(event) => setSearchText(event.target.value)}
      />
    </form>
  );

  return (
    <header className="public-topbar">
      <div className="public-navbar">
        <button className="public-brand" type="button" aria-label="Về trang chủ" onClick={goHome}>
          <h1>BOOKHUB</h1>
          <p>Library</p>
        </button>

        {navContent || defaultNav}

        <div className="public-nav-tools">
          {showReaderTools ? (
            <>
              <button
                className="public-icon-btn"
                type="button"
                aria-label="Yêu thích"
                onClick={() => goReaderTool("/reader/favorites")}
              >
                <HeartOutlined />
              </button>
              <button
                className="public-icon-btn"
                type="button"
                aria-label="Thông báo"
                onClick={() => goReaderTool("/reader/notifications")}
              >
                <Badge count={unreadCount} size="small">
                  <BellOutlined />
                </Badge>
              </button>
              <button
                className="public-icon-btn"
                type="button"
                aria-label="Giỏ mượn"
                onClick={() => goReaderTool("/reader/cart")}
              >
                <Badge count={cartCount} size="small">
                  <ShoppingCartOutlined />
                </Badge>
              </button>
            </>
          ) : null}

          <Popover
            content={searchContent}
            open={searchOpen}
            overlayClassName="public-search-popover"
            placement="bottomRight"
            trigger="click"
            onOpenChange={setSearchOpen}
          >
            <button
              className={`public-icon-btn ${searchOpen ? "active" : ""}`}
              type="button"
              aria-label="Tìm kiếm"
            >
              <SearchOutlined />
            </button>
          </Popover>

          <Dropdown menu={{ items: accountMenu }} placement="bottomRight" trigger={["click"]}>
            <button className="public-account-btn" type="button" aria-label="Tài khoản">
              {session ? <Avatar size={32}>{getInitials(session)}</Avatar> : <UserOutlined />}
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}

export function PublicFooter({ session }) {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  function goHome() {
    navigate("/", {
      state: {
        reset: true,
        scrollTo: "top"
      }
    });
  }

  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        <div className="public-footer-brand">
          <strong className="public-footer-logo">BOOKHUB</strong>
          <p className="public-footer-copy">Tra cứu sách trực tuyến của thư viện.</p>
        </div>

        <div className="public-footer-column">
          <h3 className="public-footer-title">Điều hướng</h3>
          <div className="public-footer-list">
            <button className="public-footer-nav" type="button" onClick={goHome}>
              Trang chủ
            </button>
            <button
              className="public-footer-nav"
              type="button"
              onClick={() => navigate(session ? "/reader" : "/login")}
            >
              {session ? "Tài khoản" : "Đăng nhập"}
            </button>
          </div>
        </div>

        <div className="public-footer-column">
          <h3 className="public-footer-title">Liên hệ</h3>
          <div className="public-footer-list">
            <span className="public-footer-item">BookHub Library</span>
            <span className="public-footer-item">Email: support@bookhub.local</span>
          </div>
        </div>

        <div className="public-footer-column">
          <h3 className="public-footer-title">Giờ phục vụ</h3>
          <div className="public-footer-list">
            <span className="public-footer-item">Thứ 2 - Thứ 6: 08:00 - 17:00</span>
            <span className="public-footer-item">Thứ 7: 08:00 - 11:30</span>
          </div>
        </div>
      </div>

      <div className="public-footer-bottom">
        <p>© {year} BookHub Library</p>
        <p>Tra cứu và đặt trước sách trực tuyến</p>
      </div>
    </footer>
  );
}

export default function PublicShell({
  session,
  onLogout,
  onSearchClick,
  onSearchSubmit,
  searchValue,
  navContent,
  children
}) {
  return (
    <div className="public-shell">
      <PublicHeader
        session={session}
        onLogout={onLogout}
        onSearchClick={onSearchClick}
        onSearchSubmit={onSearchSubmit}
        searchValue={searchValue}
        navContent={navContent}
      />
      <main className="public-content">{children}</main>
      <PublicFooter session={session} />
    </div>
  );
}
