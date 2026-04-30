import { EyeInvisibleOutlined, EyeOutlined, MessageOutlined } from "@ant-design/icons";
import { Button, Card, Rate, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);

  async function refresh() {
    setReviews(await libraryGateway.listReviews());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggle(review) {
    await libraryGateway.setReviewHidden(review.id, !review.hidden);
    message.success(review.hidden ? "Đã hiện lại review." : "Đã ẩn review.");
    refresh();
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Cộng đồng"
        title="Quản lý review sách"
        description="Theo dõi đánh giá sao và ẩn các bình luận không phù hợp trong mock data."
      />

      <Card
        className="glass-card"
        title="Danh sách đánh giá"
        extra={<Tag icon={<MessageOutlined />}>{reviews.length} review</Tag>}
      >
        <Table
          rowKey="id"
          dataSource={reviews}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "Sách",
              dataIndex: "bookTitle",
              render: (value) => <Typography.Text strong>{value}</Typography.Text>
            },
            {
              title: "Người viết",
              dataIndex: "userName"
            },
            {
              title: "Sao",
              dataIndex: "rating",
              width: 150,
              render: (value) => <Rate disabled value={value} style={{ fontSize: 14 }} />
            },
            {
              title: "Nội dung",
              dataIndex: "content"
            },
            {
              title: "Trạng thái",
              render: (_, record) => record.hidden ? <Tag color="red">Đã ẩn</Tag> : <Tag color="green">Đang hiện</Tag>
            },
            {
              title: "Thao tác",
              width: 140,
              render: (_, record) => (
                <Space>
                  <Button
                    icon={record.hidden ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    onClick={() => toggle(record)}
                  >
                    {record.hidden ? "Hiện" : "Ẩn"}
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
