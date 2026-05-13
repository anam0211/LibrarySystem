import {
  FilterOutlined,
  LoginOutlined,
  RightOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  Button,
  Carousel,
  Col,
  Form,
  Input,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  message,
  notification
} from "antd";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import BookCard from "../components/BookCard";
import PublicShell from "../components/PublicChrome";
import { formatNumber } from "../components/formatters";

const DEFAULT_FILTERS = {
  keyword: "",
  authorId: undefined,
  categoryId: undefined,
  publisherId: undefined,
  publishYear: undefined,
  available: undefined,
  page: 0,
  size: 8
};

const EMPTY_PAGE = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 8
};

function hasFilters(filters) {
  return Boolean(
    filters.keyword
      || filters.authorId
      || filters.categoryId
      || filters.publisherId
      || filters.publishYear
      || filters.available !== undefined
  );
}

function scrollToCatalog() {
  document.getElementById("home-book-discovery")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function toOptions(items) {
  return items.map((item) => ({ label: item.name, value: item.id }));
}

function BookVisual({ book, large = false }) {
  const coverUrl = toAbsoluteMediaUrl(book.primaryImageUrl);

  if (coverUrl) {
    return (
      <img
        src={coverUrl}
        alt={book.title}
        className={large ? "real-book-cover real-book-cover-large" : "real-book-cover"}
      />
    );
  }

  return (
    <div className={large ? "mock-cover mock-cover-large" : "mock-cover"} style={{ "--cover-tone": book.coverTone }}>
      <span>{book.category}</span>
      <strong>{book.title}</strong>
    </div>
  );
}

export default function Home({ session, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [facets, setFacets] = useState({ authors: [], categories: [], publishers: [] });
  const [featured, setFeatured] = useState([]);
  const [booksPage, setBooksPage] = useState(EMPTY_PAGE);
  const [notifyApi, notifyContextHolder] = notification.useNotification();

  async function loadPage(nextFilters = DEFAULT_FILTERS) {
    setLoading(true);

    try {
      const [nextPage, nextFacets, nextFeatured] = await Promise.all([
        libraryGateway.listBooks(nextFilters),
        libraryGateway.getFacets(),
        libraryGateway.getFeaturedBooks()
      ]);
      setFacets(nextFacets);
      setFeatured(nextFeatured);
      setBooksPage(nextPage);
      setFilters(nextFilters);
      form.setFieldsValue(nextFilters);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const routeState = location.state || {};
    const nextFilters = routeState.filters
      ? { ...DEFAULT_FILTERS, ...routeState.filters, page: 0 }
      : DEFAULT_FILTERS;

    loadPage(nextFilters).then(() => {
      if (!active) {
        return;
      }

      window.requestAnimationFrame(() => {
        if (routeState.scrollTo === "catalog") {
          scrollToCatalog();
          return;
        }

        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      });
    });

    return () => {
      active = false;
    };
  }, [location.key]);

  async function handleBorrow(book) {
    if (!session) {
      navigate("/login");
      return false;
    }

    try {
      await libraryGateway.addToCart(session.id, book.id);
      notifyApi.success({
        message: "Thêm giỏ thành công",
        description: `Đã thêm "${book.title}" vào giỏ.`,
        placement: "bottomRight"
      });
      window.dispatchEvent(new Event("cartUpdated"));
      return true;
    } catch (error) {
      notifyApi.error({
        message: "Không thể thêm vào giỏ",
        description: error?.message || "Đã xảy ra lỗi khi thêm vào giỏ mượn.",
        placement: "bottomRight"
      });
      throw error;
    }
  }

  function handleKeywordSearch(keyword) {
    const nextFilters = { ...filters, keyword, page: 0 };
    loadPage(nextFilters).then(() => window.requestAnimationFrame(scrollToCatalog));
  }

  function handleFilterSubmit(values) {
    loadPage({
      ...DEFAULT_FILTERS,
      ...values,
      keyword: filters.keyword,
      page: 0,
      size: filters.size
    });
  }

  function clearFilterOnly() {
    const nextFilters = { ...DEFAULT_FILTERS, keyword: filters.keyword, size: filters.size };
    form.resetFields();
    loadPage(nextFilters);
  }

  const activeSearch = hasFilters(filters);
  const activeFilterCount = [
    filters.authorId,
    filters.categoryId,
    filters.publisherId,
    filters.publishYear,
    filters.available
  ].filter((value) => value !== undefined && value !== null && value !== "").length;
  const catalogTitle = activeSearch ? "Kết quả tìm kiếm" : "Kho sách";
  const catalogSubtitle = activeSearch
    ? `${formatNumber(booksPage.totalItems)} đầu sách phù hợp.`
    : `${formatNumber(booksPage.totalItems)} đầu sách đang hiển thị.`;

  return (
    <PublicShell
      session={session}
      onLogout={onLogout}
      onSearchClick={scrollToCatalog}
      onSearchSubmit={handleKeywordSearch}
      searchValue={filters.keyword}
    >
      {notifyContextHolder}
      <section className="storefront-hero ecommerce-hero">
        <div className="storefront-hero-copy">
          <p className="eyebrow">BookHub Online Library</p>
          <h1>Mượn sách như đặt hàng online</h1>
          <p className="subtle">
            Tìm sách, thêm vào giỏ, chọn nhận tại quầy hoặc giao tận nhà.
          </p>

          <div className="actions">
            <Button type="primary" size="large" icon={<SearchOutlined />} onClick={scrollToCatalog}>
              Xem kho sách
            </Button>
            <Button
              size="large"
              icon={session ? <RightOutlined /> : <LoginOutlined />}
              onClick={() => navigate(session ? "/reader" : "/login")}
            >
              Tài khoản của tôi
            </Button>
          </div>
        </div>

        <div className="hero-carousel-panel">
          <Carousel autoplay dots>
            {featured.map((book) => (
              <div key={book.id}>
                <Link to={`/book/${book.id}`} className="hero-slide">
                  <BookVisual book={book} large />
                  <div>
                    <Tag color="blue">Sách nổi bật</Tag>
                    <h3>{book.title}</h3>
                    <p>{book.description}</p>
                  </div>
                </Link>
              </div>
            ))}
          </Carousel>
        </div>
      </section>

      <section id="home-book-discovery" className="table-card discovery-panel">
        <div className="page-toolbar">
          <div>
            <p className="eyebrow">{activeSearch ? "Tìm kiếm" : "Kho sách"}</p>
            <h2>{catalogTitle}</h2>
            <p className="subtle">{catalogSubtitle}</p>
          </div>

          <Space wrap>
            {filters.keyword ? <Tag color="blue">Từ khóa: {filters.keyword}</Tag> : null}
            {activeFilterCount ? <Tag color="geekblue">{activeFilterCount} bộ lọc</Tag> : null}
            <Button
              className={`filter-icon-btn ${filterOpen ? "active" : ""}`}
              shape="circle"
              icon={<FilterOutlined />}
              aria-label="Bộ lọc"
              onClick={() => setFilterOpen((open) => !open)}
            />
          </Space>
        </div>

        {filterOpen ? (
          <Form
            form={form}
            layout="vertical"
            className="toolbar-form filter-panel"
            style={{ marginTop: 18 }}
            onFinish={handleFilterSubmit}
          >
            <div className="filter-panel-head">
              <div>
                <strong>Bộ lọc nâng cao</strong>
                <span>Lọc theo thông tin biên mục và tình trạng sách.</span>
              </div>
            </div>

            <Row gutter={[14, 12]} align="bottom">
              <Col xs={24} md={6}>
                <Form.Item name="authorId" label="Tác giả">
                  <Select allowClear options={toOptions(facets.authors)} placeholder="Chọn tác giả" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="categoryId" label="Danh mục">
                  <Select allowClear options={toOptions(facets.categories)} placeholder="Chọn danh mục" />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="publisherId" label="Nhà xuất bản">
                  <Select allowClear options={toOptions(facets.publishers)} placeholder="Chọn NXB" />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name="publishYear" label="Năm XB">
                  <Input type="number" min={1900} max={2100} placeholder="2026" />
                </Form.Item>
              </Col>
              <Col xs={12} md={3}>
                <Form.Item name="available" label="Tình trạng">
                  <Select
                    allowClear
                    placeholder="Tất cả"
                    options={[
                      { label: "Còn sách", value: "true" },
                      { label: "Hết sách", value: "false" }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="filter-actions">
              <Button htmlType="submit" type="primary" icon={<FilterOutlined />}>
                Áp dụng lọc
              </Button>
              <Button onClick={clearFilterOnly}>Xóa lọc</Button>
            </div>
          </Form>
        ) : null}

        <div style={{ marginTop: 18 }}>
          {loading ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
              <Spin size="large" />
            </div>
          ) : booksPage.items?.length ? (
            <>
              <div className="showcase-grid">
                {booksPage.items.map((book) => (
                  <BookCard key={book.id} book={book} onAction={handleBorrow} />
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
                <Pagination
                  current={booksPage.page + 1}
                  total={booksPage.totalItems}
                  pageSize={booksPage.size}
                  showSizeChanger={false}
                  onChange={(page) => loadPage({ ...filters, page: page - 1 })}
                />
              </div>
            </>
          ) : (
            <div className="route-empty">Không tìm thấy đầu sách phù hợp.</div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
