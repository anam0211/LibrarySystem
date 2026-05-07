import { CheckCircleOutlined, CheckSquareOutlined, MailOutlined, NotificationOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  List,
  Space,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { libraryApi } from "../api/libraryApi";
import { formatDateTime } from "../components/formatters";
import PageHeader from "../components/PageHeader";

const TYPE_LABELS = {
  DUE_SOON: "Sắp đến hạn",
  OVERDUE: "Quá hạn",
  FINE_CREATED: "Phát sinh phí phạt",
  GENERIC: "Hệ thống"
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    setLoading(true);

    try {
      const currentUser = await libraryApi.users.me();
      const data = await libraryApi.notifications.list(currentUser.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleMarkAsRead(item) {
    try {
      await libraryApi.notifications.markAsRead(item.notificationId);
      message.success("Đã đánh dấu đã đọc.");
      loadNotifications();
    } catch (error) {
      message.error(error.message);
    }
  }

  async function handleMarkAllAsRead() {
    const unreadNotifs = notifications.filter((n) => !n.readAt);
    if (!unreadNotifs.length) return;

    setLoading(true);
    try {
      // Gọi API đánh dấu đã đọc cho tất cả các thông báo chưa đọc cùng lúc
      await Promise.all(unreadNotifs.map((item) => libraryApi.notifications.markAsRead(item.notificationId)));
      message.success("Đã đánh dấu tất cả là đã đọc.");
      loadNotifications();
    } catch (error) {
      message.error(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Thông báo"
        title="Thông báo từ hệ thống"
        description="Xem lời nhắc sắp đến hạn, quá hạn và các thông điệp vận hành khác."
        extra={
          <Button
            icon={<CheckSquareOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some((n) => !n.readAt)}
          >
            Đánh dấu tất cả là đã đọc
          </Button>
        }
      />

      <Card className="glass-card">
        <List
          loading={loading}
          className="compact-list"
          locale={{ emptyText: "Chưa có thông báo nào." }}
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              actions={[
                item.readAt ? (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Đã đọc
                  </Tag>
                ) : (
                  <Button type="link" onClick={() => handleMarkAsRead(item)}>
                    Đánh dấu đã đọc
                  </Button>
                )
              ]}
            >
              <List.Item.Meta
                avatar={<NotificationOutlined style={{ fontSize: 20, color: "#00a260" }} />}
                title={
                  <Space wrap>
                    <Typography.Text strong>{item.subject || "Thông báo hệ thống"}</Typography.Text>
                    <Tag>{TYPE_LABELS[item.type] || item.type}</Tag>
                    <Tag icon={<MailOutlined />}>{item.channel}</Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <Typography.Text type="secondary">{item.body}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      Tạo lúc {formatDateTime(item.createdAt)}
                    </Typography.Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
