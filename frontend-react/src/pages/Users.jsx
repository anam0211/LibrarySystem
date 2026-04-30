import {
  DeleteOutlined,
  LockOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { libraryApi } from "../api/libraryApi";
import PageHeader from "../components/PageHeader";
import { formatDate } from "../components/formatters";

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);

  async function loadUsers() {
    setLoading(true);

    try {
      const data = await libraryApi.users.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSuspend(record) {
    try {
      await libraryApi.users.suspend(record.id);
      message.success("Đã khóa tài khoản.");
      loadUsers();
    } catch (error) {
      message.error(error.message);
    }
  }

  async function handleDelete(record) {
    try {
      await libraryApi.users.remove(record.id);
      message.success("Đã xóa tài khoản.");
      loadUsers();
    } catch (error) {
      message.error(error.message);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesKeyword =
      !keyword
      || String(user?.fullName || "").toLowerCase().includes(keyword.toLowerCase())
      || String(user?.email || "").toLowerCase().includes(keyword.toLowerCase());

    const matchesStatus = !statusFilter || String(user?.status || "") === statusFilter;

    return matchesKeyword && matchesStatus;
  });

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Admin"
        title="Quản lý người dùng"
        description="Theo dõi tài khoản, vai trò và xử lý nhanh các thao tác khóa hoặc xóa người dùng."
      />

      <Card className="glass-card">
        <Space wrap style={{ width: "100%", justifyContent: "space-between", marginBottom: 16 }}>
          <Input
            style={{ maxWidth: 320 }}
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên hoặc email"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Select
            allowClear
            placeholder="Lọc trạng thái"
            style={{ width: 220 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { label: "ACTIVE", value: "ACTIVE" },
              { label: "SUSPENDED", value: "SUSPENDED" }
            ]}
          />
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredUsers}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "Người dùng",
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>{record.fullName}</Typography.Text>
                  <Typography.Text type="secondary">{record.email}</Typography.Text>
                </Space>
              )
            },
            {
              title: "Vai trò",
              dataIndex: "role",
              render: (value) => <Tag color={value === "ADMIN" ? "gold" : value === "LIBRARIAN" ? "blue" : "green"}>{value}</Tag>
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (value) => <Tag color={value === "SUSPENDED" ? "red" : "green"}>{value || "ACTIVE"}</Tag>
            },
            {
              title: "Số điện thoại",
              dataIndex: "phone",
              render: (value) => value || "-"
            },
            {
              title: "Tạo lúc",
              dataIndex: "createdAt",
              render: formatDate
            },
            {
              title: "Thao tác",
              key: "actions",
              render: (_, record) => (
                <Space className="table-actions">
                  <Popconfirm
                    title="Khóa tài khoản?"
                    okText="Khóa"
                    cancelText="Hủy"
                    onConfirm={() => handleSuspend(record)}
                  >
                    <Button
                      icon={<LockOutlined />}
                      disabled={record.status === "SUSPENDED"}
                    />
                  </Popconfirm>
                  <Popconfirm
                    title="Xóa tài khoản?"
                    description="Hành động này không thể hoàn tác."
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(record)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
