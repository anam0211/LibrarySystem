import { CheckCircleOutlined, PlusOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";
import { libraryApi } from "../api/libraryApi";
import PageHeader from "../components/PageHeader";
import { formatCurrency } from "../components/formatters";

export default function AdminFines() {
  const [keyword, setKeyword] = useState("");
  const [fines, setFines] = useState([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [userLoans, setUserLoans] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [form] = Form.useForm();
  const watchUserId = Form.useWatch("userId", form);

  async function refresh() {
    setFines(await libraryGateway.listFines());
  }

  useEffect(() => {
    refresh();
    // Tải sẵn danh sách người dùng để tra cứu nhanh khi nhập ID
    libraryApi.users.list()
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!watchUserId) {
      setUserLoans([]);
      form.setFieldsValue({ loanId: undefined });
      return;
    }

    setLoadingLoans(true);
    libraryGateway.listLoans(watchUserId)
      .then(data => {
        setUserLoans(Array.isArray(data) ? data : []);
        form.setFieldsValue({ loanId: undefined });
      })
      .catch(() => setUserLoans([]))
      .finally(() => setLoadingLoans(false));
  }, [watchUserId, form]);

  async function collect(fine) {
    await libraryGateway.collectFine(fine.id);
    message.success(`Đã ghi nhận thu ${formatCurrency(fine.amount)}.`);
    refresh();
  }

  async function handleCreate(values) {
    try {
      // Gọi API thực tế của Backend để tạo phiếu phạt mới
      await libraryApi.fines.create({
        userId: values.userId,
        loanId: values.loanId,
        amount: values.amount,
        reason: values.reason
      });
      message.success("Đã tạo phiếu phạt thành công.");
      setCreateModalOpen(false);
      form.resetFields();
      refresh();
    } catch (error) {
      message.error(error?.message || "Không thể tạo phiếu phạt.");
    }
  }

  const filtered = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    if (!text) {
      return fines;
    }

    return fines.filter((fine) =>
      [fine.readerName, fine.studentCode, fine.loanId, fine.id]
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [fines, keyword]);

  const selectedUser = useMemo(() => {
    if (!watchUserId) return null;
    return users.find((u) => u.id === Number(watchUserId)) || null;
  }, [watchUserId, users]);

  const returnedLoans = useMemo(() => {
    return userLoans.filter(loan => loan.status === "RETURNED" || loan.status === "CLOSED");
  }, [userLoans]);

  const unpaidAmount = filtered
    .filter((fine) => fine.status === "UNPAID")
    .reduce((sum, fine) => sum + fine.amount, 0);

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Thu phạt"
        title="Quản lý nợ & phạt"
        description="Tra cứu mã sinh viên, xem số tiền nợ và ghi nhận đã thu tiền mặt."
      />

      <Card className="glass-card">
        <Form layout="vertical" onFinish={(values) => setKeyword(values.keyword || "")}>
          <Form.Item label="Tra cứu bạn đọc" name="keyword">
            <Input
              size="large"
              prefix={<SearchOutlined />}
              placeholder="Nhập mã sinh viên, tên bạn đọc, mã đơn hoặc mã phiếu phạt"
            />
          </Form.Item>
          <Space wrap>
            <Button htmlType="submit" type="primary" icon={<SearchOutlined />}>
              Tra cứu
            </Button>
            <Button onClick={() => setKeyword("")}>Xóa tìm kiếm</Button>
            <Tag color="red">Chưa thu: {formatCurrency(unpaidAmount)}</Tag>
          </Space>
        </Form>
      </Card>

      <Card
        className="glass-card"
        title="Danh sách phiếu phạt"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
            Tạo phiếu phạt
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={filtered}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "Phiếu",
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>{record.id}</Typography.Text>
                  <Typography.Text type="secondary">{record.loanId}</Typography.Text>
                </Space>
              )
            },
            {
              title: "Bạn đọc",
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text>{record.readerName}</Typography.Text>
                  <Typography.Text type="secondary">{record.studentCode}</Typography.Text>
                </Space>
              )
            },
            { title: "Lý do", dataIndex: "reason" },
            { title: "Số tiền", dataIndex: "amount", render: formatCurrency },
            {
              title: "Trạng thái",
              render: (_, record) =>
                record.status === "PAID" ? <Tag color="green">Đã thu</Tag> : <Tag color="red">Chưa thu</Tag>
            },
            {
              title: "Thao tác",
              width: 170,
              render: (_, record) =>
                record.status === "UNPAID" ? (
                  <Button type="primary" icon={<WalletOutlined />} onClick={() => collect(record)}>
                    Đã thu tiền mặt
                  </Button>
                ) : (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Hoàn tất
                  </Tag>
                )
            }
          ]}
        />
      </Card>

      <Modal
        title="Tạo phiếu phạt mới"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setCreateModalOpen(false);
            form.resetFields();
          }}>
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            Tạo phiếu
          </Button>
        ]}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="userId"
            label="Mã bạn đọc (User ID)"
            rules={[{ required: true, message: "Vui lòng nhập mã bạn đọc" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} placeholder="Ví dụ: 1" />
          </Form.Item>
          {selectedUser ? (
            <div style={{ marginBottom: 24, padding: "8px 12px", background: "rgba(0,0,0,0.04)", borderRadius: 8 }}>
              <Typography.Text strong>{selectedUser.fullName}</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                {selectedUser.email} • {selectedUser.phone || "Chưa có SĐT"}
              </Typography.Text>
            </div>
          ) : watchUserId ? (
            <div style={{ marginBottom: 24 }}>
              <Typography.Text type="danger">
                Không tìm thấy bạn đọc với ID = {watchUserId}
              </Typography.Text>
            </div>
          ) : null}
          <Form.Item
            name="loanId"
            label="Mã đơn mượn"
            rules={[{ required: true, message: "Vui lòng chọn đơn mượn" }]}
          >
            <Select
              placeholder={!watchUserId ? "Vui lòng nhập mã bạn đọc trước" : returnedLoans.length === 0 ? "Bạn đọc không có đơn mượn nào đã trả" : "Chọn đơn mượn đã trả"}
              loading={loadingLoans}
              disabled={!watchUserId || returnedLoans.length === 0}
            >
              {returnedLoans.map(loan => (
                <Select.Option key={loan.id || loan.loanId} value={loan.id || loan.loanId}>
                  Đơn #{loan.id || loan.loanId} - {loan.bookTitle || loan.book || "Sách"}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Số tiền phạt (VNĐ)"
            rules={[{ required: true, message: "Vui lòng nhập số tiền phạt" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={1000}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              placeholder="Ví dụ: 50000"
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="Lý do phạt"
            rules={[{ required: true, message: "Vui lòng chọn lý do phạt" }]}
          >
            <Select placeholder="Chọn lý do phạt">
              <Select.Option value="LATE_RETURN">Trả sách trễ hạn (LATE_RETURN)</Select.Option>
              <Select.Option value="DAMAGED_BOOK">Làm hỏng/rách sách (DAMAGED_BOOK)</Select.Option>
              <Select.Option value="LOST_BOOK">Làm mất sách (LOST_BOOK)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
