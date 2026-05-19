import {
  DeleteOutlined,
  EditOutlined,
  LockOutlined,
  SearchOutlined,
  UnlockOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";
import { libraryApi } from "../api/libraryApi";
import PageHeader from "../components/PageHeader";
import { formatDate } from "../components/formatters";

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

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
    apiClient.get('/memberships').then(res => {
      const payload = res.data || res;
      setMemberships(Array.isArray(payload) ? payload : (payload?.result || []));
    }).catch(() => {});
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

  async function handleActivate(record) {
    try {
      await libraryApi.users.activate(record.id);
      message.success("Đã mở khóa tài khoản.");
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

  function handleEdit(record) {
    setEditingUser(record);
    const currentMembership = memberships.find(m => m.code === record.membershipCode);
    form.setFieldsValue({
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      role: record.role,
      membershipId: currentMembership?.id || null
    });
    setEditModalOpen(true);
  }

  async function handleUpdate(values) {
    try {
      const payload = {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        role: values.role,
        membershipId: values.membershipId || null
      };
      await libraryApi.users.update(editingUser.id, payload);
      message.success("Đã cập nhật thông tin người dùng.");
      setEditModalOpen(false);
      setEditingUser(null);
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
              title: "Xác thực",
              dataIndex: "verificationStatus",
              render: (value, record) => {
                const status = value || record.kycStatus;
                const isVerified = status === "VERIFIED";
                return <Tag color={isVerified ? "green" : "red"}>{isVerified ? "VERIFIED" : "UNVERIFIED"}</Tag>;
              }
            },
          {
            title: "Gói hội viên",
            dataIndex: "membershipCode",
            render: (value, record) => (
              (!value || value === "FREE") ? <Tag>Cơ bản</Tag> : <Tag color="gold" style={{ textTransform: 'uppercase' }}>{record.membershipName || value}</Tag>
            )
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
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
              {record.status === "SUSPENDED" ? (
                <Popconfirm
                  title="Mở khóa tài khoản?"
                  okText="Mở khóa"
                  cancelText="Hủy"
                  onConfirm={() => handleActivate(record)}
                >
                  <Button icon={<UnlockOutlined />} />
                </Popconfirm>
              ) : (
                <Popconfirm
                  title="Khóa tài khoản?"
                  okText="Khóa"
                  cancelText="Hủy"
                  onConfirm={() => handleSuspend(record)}
                >
                  <Button icon={<LockOutlined />} />
                </Popconfirm>
              )}
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

      <Modal
        title="Chỉnh sửa người dùng"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setEditModalOpen(false);
            setEditingUser(null);
          }}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            OK
          </Button>
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item
            name="fullName"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item 
            name="phone" label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập SĐT" },
              { type: "phone", message: "SĐT không hợp lệ" }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select
              options={[
                { label: "Độc giả (READER)", value: "READER" },
                { label: "Thủ thư (LIBRARIAN)", value: "LIBRARIAN" },
                { label: "Quản trị viên (ADMIN)", value: "ADMIN" }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="membershipId"
            label="Gói hội viên"
            rules={[{ required: true, message: "Vui lòng chọn gói hội viên" }]}
          >
            <Select
              options={memberships.map(m => ({ label: m.name || m.code, value: m.id }))}
              placeholder="Chọn gói hội viên"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
