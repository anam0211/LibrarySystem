import { CheckCircleOutlined, SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatCurrency } from "../components/formatters";

export default function AdminFines() {
  const [keyword, setKeyword] = useState("");
  const [fines, setFines] = useState([]);

  async function refresh() {
    setFines(await libraryGateway.listFines());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function collect(fine) {
    await libraryGateway.collectFine(fine.id);
    message.success(`Đã ghi nhận thu ${formatCurrency(fine.amount)}.`);
    refresh();
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

      <Card className="glass-card" title="Danh sách phiếu phạt">
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
    </div>
  );
}
