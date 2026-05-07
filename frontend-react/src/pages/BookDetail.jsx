import {
  FileOutlined,
  HeartFilled,
  HeartOutlined,
  ShoppingCartOutlined,
  StarFilled
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  List,
  Rate,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  notification
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import PublicShell from "../components/PublicChrome";
import { formatNumber } from "../components/formatters";

function MockCover({ book }) {
  return (
    <div className="mock-cover mock-cover-detail" style={{ "--cover-tone": book.coverTone }}>
      <span>{book.category}</span>
      <strong>{book.title}</strong>
    </div>
  );
}

function isImage(asset) {
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF"].includes(String(asset?.assetType || "").toUpperCase());
}

export default function BookDetail({ session, onLogout }) {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState(null);
  const [media, setMedia] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [cartStatus, setCartStatus] = useState("idle");
  const [notifyApi, notifyContextHolder] = notification.useNotification();

  async function loadDetail() {
    setLoading(true);
    const [nextBook, nextMedia, nextWishlist] = await Promise.all([
      libraryGateway.getBook(bookId),
      libraryGateway.getBookMedia(bookId),
      session?.id ? libraryGateway.getWishlist(session.id) : Promise.resolve([])
    ]);
    setBook(nextBook);
    setMedia(nextMedia);
    setWishlist(nextWishlist.map((item) => item.id));
    setLoading(false);
  }

  useEffect(() => {
    loadDetail();
  }, [bookId, session?.id]);

  const visibleReviews = useMemo(
    () => (book?.reviews || []).filter((review) => !review.hidden),
    [book]
  );

  if (loading) {
    return (
      <PublicShell session={session} onLogout={onLogout}>
        <div style={{ display: "grid", placeItems: "center", minHeight: 420 }}>
          <Spin size="large" />
        </div>
      </PublicShell>
    );
  }

  if (!book) {
    return (
      <PublicShell session={session} onLogout={onLogout}>
        <div className="route-empty">Không tìm thấy sách cần xem.</div>
      </PublicShell>
    );
  }

  const available = Number(book.stockAvailable || 0) > 0;
  const liked = wishlist.includes(book.id);
  const coverAsset = media.find((asset) => asset.primary && isImage(asset)) || media.find(isImage);
  const coverUrl = toAbsoluteMediaUrl(coverAsset?.fileUrl || book.primaryImageUrl);
  const attachments = media.filter((asset) => !coverAsset || asset.id !== coverAsset.id);

  async function handleAddToCart() {
    if (!session) {
      navigate("/login");
      return;
    }

    setCartStatus("loading");
    try {
      await libraryGateway.addToCart(session.id, book.id);
      notifyApi.success({
        message: "Thêm giỏ thành công",
        description: `Đã thêm "${book.title}" vào giỏ.`,
        placement: "bottomRight"
      });
      window.dispatchEvent(new Event("cartUpdated"));
      setCartStatus("added");
      setTimeout(() => setCartStatus("idle"), 1500);
    } catch (error) {
      notifyApi.error({
        message: "Không thể thêm vào giỏ",
        description: error?.message || "Đã xảy ra lỗi khi thêm vào giỏ mượn.",
        placement: "bottomRight"
      });
      setCartStatus("idle");
    }
  }

  async function handleWishlist() {
    if (!session) {
      navigate("/login");
      return;
    }

    setWishlist(await libraryGateway.toggleWishlist(session.id, book.id));
  }

  async function handleReview(values) {
    if (!session) {
      navigate("/login");
      return;
    }

    await libraryGateway.addReview(book.id, {
      userId: session.id,
      userName: session.fullName || session.email,
      rating: values.rating,
      content: values.content
    });
    form.resetFields();
    message.success("Đã gửi đánh giá.");
    loadDetail();
  }

  return (
    <PublicShell session={session} onLogout={onLogout}>
      {notifyContextHolder}
      <section className="book-detail-page">
        <Card className="glass-card">
          <div className="detail-grid">
            {coverUrl ? (
              <img src={coverUrl} alt={book.title} className="book-cover-lg" />
            ) : (
              <MockCover book={book} />
            )}

            <div className="detail-stack">
              <div className="book-detail-heading">
                <div className="showcase-badges">
                  <Tag color={available ? "green" : "red"}>{available ? "Còn sách" : "Hết sách"}</Tag>
                  <Tag>{book.category}</Tag>
                </div>
                <Typography.Title level={1} style={{ margin: 0 }}>
                  {book.title}
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 16 }}>
                  {book.subtitle}
                </Typography.Text>
                <Typography.Paragraph style={{ fontSize: 16, marginBottom: 0 }}>
                  {(book.authors || []).join(", ")}
                </Typography.Paragraph>
                <Space wrap>
                  <Tag icon={<StarFilled />} color="gold">
                    {book.rating} sao
                  </Tag>
                  <Tag>{formatNumber(book.borrowCount)} lượt mượn</Tag>
                  <Tag>{formatNumber(book.favoriteCount)} yêu thích</Tag>
                </Space>
              </div>

              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="ISBN">{book.isbn}</Descriptions.Item>
                <Descriptions.Item label="Năm XB">{book.publishYear}</Descriptions.Item>
                <Descriptions.Item label="Nhà xuất bản">{book.publisher}</Descriptions.Item>
                <Descriptions.Item label="Ngôn ngữ">{book.language}</Descriptions.Item>
                <Descriptions.Item label="Số trang">{formatNumber(book.pages)}</Descriptions.Item>
                <Descriptions.Item label="Tồn kho">
                  {formatNumber(book.stockAvailable)} / {formatNumber(book.stockTotal)}
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title="Mô tả">
                <Typography.Paragraph style={{ marginBottom: 0 }}>{book.description}</Typography.Paragraph>
              </Card>

              <div className="book-detail-actions">
                <Button
                  type={cartStatus === "added" ? "default" : "primary"}
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  disabled={!available || cartStatus === "added"}
                  loading={cartStatus === "loading"}
                  onClick={handleAddToCart}
                >
                  {!session ? "Đăng nhập" : cartStatus === "added" ? "Đã thêm" : "Thêm giỏ"}
                </Button>
                <Button
                  size="large"
                  icon={liked ? <HeartFilled /> : <HeartOutlined />}
                  onClick={handleWishlist}
                >
                  {liked ? "Đã yêu thích" : "Thêm yêu thích"}
                </Button>
                <Button size="large" onClick={() => navigate("/")}>
                  Về kho sách
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="section-grid">
          <Card className="glass-card" title="Tệp đính kèm">
            {attachments.length ? (
              <List
                dataSource={attachments}
                renderItem={(asset) => (
                  <List.Item
                    actions={[
                      <a href={toAbsoluteMediaUrl(asset.fileUrl)} target="_blank" rel="noreferrer">
                        Mở tệp
                      </a>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        isImage(asset) ? (
                          <img
                            src={toAbsoluteMediaUrl(asset.fileUrl)}
                            alt={asset.fileName}
                            className="book-cover"
                          />
                        ) : (
                          <div className="book-fallback">
                            <FileOutlined />
                          </div>
                        )
                      }
                      title={asset.fileName}
                      description={asset.assetType}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có tệp đính kèm từ backend." />
            )}
          </Card>

          <Card className="glass-card" title="Review & Rating">
            <Form form={form} layout="vertical" onFinish={handleReview} initialValues={{ rating: 5 }}>
              <Form.Item name="rating" label="Đánh giá sao" rules={[{ required: true }]}>
                <Rate />
              </Form.Item>
              <Form.Item name="content" label="Bình luận" rules={[{ required: true, message: "Nhập nội dung đánh giá" }]}>
                <Input.TextArea rows={4} placeholder="Cảm nhận của bạn về cuốn sách..." />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Gửi đánh giá
              </Button>
            </Form>
          </Card>

          <Card className="glass-card" title={`Bình luận (${visibleReviews.length})`}>
            {visibleReviews.length ? (
              <List
                dataSource={visibleReviews}
                renderItem={(review) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <strong>{review.userName}</strong>
                          <Rate disabled value={review.rating} style={{ fontSize: 14 }} />
                        </Space>
                      }
                      description={review.content}
                    />
                    <Typography.Text type="secondary">{review.createdAt}</Typography.Text>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có đánh giá." />
            )}
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
