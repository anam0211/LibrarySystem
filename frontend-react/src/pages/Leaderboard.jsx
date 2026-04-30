import { StarFilled, TrophyOutlined } from "@ant-design/icons";
import { Card, Col, Row, Space, Spin, Tabs, Tag, Typography } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import PublicShell from "../components/PublicChrome";
import { formatNumber } from "../components/formatters";

function BookVisual({ book }) {
  const coverUrl = toAbsoluteMediaUrl(book.primaryImageUrl);

  if (coverUrl) {
    return <img src={coverUrl} alt={book.title} className="real-book-cover leaderboard-cover" />;
  }

  return (
    <div className="mock-cover leaderboard-cover" style={{ "--cover-tone": book.coverTone }}>
      <span>{book.category}</span>
      <strong>{book.title}</strong>
    </div>
  );
}

function RankingGrid({ books, metric }) {
  return (
    <Row gutter={[16, 16]}>
      {books.map((book, index) => (
        <Col xs={24} md={12} xl={8} key={book.id}>
          <Link to={`/book/${book.id}`} className="ranking-card">
            <BookVisual book={book} />
            <div className="ranking-card-body">
              <Space wrap>
                <Tag color={index < 3 ? "gold" : "blue"} icon={<TrophyOutlined />}>
                  #{index + 1}
                </Tag>
                <Tag>{metric(book)}</Tag>
              </Space>
              <Typography.Title level={4}>{book.title}</Typography.Title>
              <Typography.Text type="secondary">{(book.authors || []).join(", ")}</Typography.Text>
              <p className="mini">
                <StarFilled style={{ color: "#f5a623" }} /> {book.rating} / {formatNumber(book.borrowCount)} lượt mượn
              </p>
            </div>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

export default function Leaderboard({ session, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [leaderboards, setLeaderboards] = useState({ borrowed: [], rated: [], favorite: [] });

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      const data = await libraryGateway.getLeaderboards();

      if (active) {
        setLeaderboards(data);
        setLoading(false);
      }
    }

    loadLeaderboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <PublicShell session={session} onLogout={onLogout}>
      <section className="page-shell">
        <div className="page-toolbar">
          <div>
            <p className="page-eyebrow">Leaderboard</p>
            <h1 className="page-title">Bảng xếp hạng thư viện</h1>
            <p className="page-copy">
              Tách riêng khỏi trang chủ để người đọc xem nhanh các đầu sách đang được mượn, đánh giá và yêu thích nhiều.
            </p>
          </div>
        </div>

        <Card className="glass-card">
          {loading ? (
            <div style={{ display: "grid", placeItems: "center", minHeight: 260 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Tabs
              items={[
                {
                  key: "borrowed",
                  label: "Top mượn nhiều",
                  children: (
                    <RankingGrid books={leaderboards.borrowed} metric={(book) => `${book.borrowCount} lượt`} />
                  )
                },
                {
                  key: "rated",
                  label: "Top đánh giá",
                  children: <RankingGrid books={leaderboards.rated} metric={(book) => `${book.rating} sao`} />
                },
                {
                  key: "favorite",
                  label: "Yêu thích nhất",
                  children: (
                    <RankingGrid books={leaderboards.favorite} metric={(book) => `${book.favoriteCount} thích`} />
                  )
                }
              ]}
            />
          )}
        </Card>
      </section>
    </PublicShell>
  );
}
