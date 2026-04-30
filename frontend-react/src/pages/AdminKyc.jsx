import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  IdcardOutlined,
  LinkOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Button, Card, Descriptions, Image, Modal, Segmented, Space, Table, Tag, Typography, message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatDateTime } from "../components/formatters";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Đã duyệt", value: "VERIFIED" },
  { label: "Chưa xác thực", value: "NEW" }
];

function kycTag(status) {
  if (status === "VERIFIED") {
    return <Tag color="green">Đã duyệt</Tag>;
  }

  if (status === "PENDING") {
    return <Tag color="gold">Chờ duyệt</Tag>;
  }

  return <Tag color="red">Chưa xác thực</Tag>;
}

function getRejectLabel(status) {
  return status === "VERIFIED" ? "Hủy xác thực" : "Từ chối";
}

export default function AdminKyc() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);

    try {
      const nextUsers = await libraryGateway.listKycUsers();
      setUsers(nextUsers);
    } catch (error) {
      message.error(error?.message || "Không thể tải danh sách hồ sơ KYC.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filteredUsers = useMemo(() => {
    if (statusFilter === "ALL") {
      return users;
    }

    return users.filter((user) => user.kycStatus === statusFilter);
  }, [statusFilter, users]);

  const metrics = useMemo(() => ({
    all: users.length,
    pending: users.filter((user) => user.kycStatus === "PENDING").length,
    verified: users.filter((user) => user.kycStatus === "VERIFIED").length,
    new: users.filter((user) => user.kycStatus === "NEW").length
  }), [users]);

  async function approve(user) {
    try {
      await libraryGateway.approveKyc(user.id);
      message.success(`Đã cấp thẻ thư viện cho ${user.fullName}.`);
      setSelected(null);
      await refresh();
    } catch (error) {
      message.error(error?.message || "Không thể duyệt hồ sơ.");
    }
  }

  async function reject(user) {
    try {
      await libraryGateway.rejectKyc(user.id);
      message.warning(`Đã cập nhật trạng thái hồ sơ của ${user.fullName}.`);
      setSelected(null);
      await refresh();
    } catch (error) {
      message.error(error?.message || "Không thể cập nhật hồ sơ.");
    }
  }

  const canApproveSelected = selected?.kycStatus === "PENDING";
  const canRejectSelected = selected?.kycStatus === "PENDING" || selected?.kycStatus === "VERIFIED";

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="e-KYC"
        title="Quản lý hồ sơ bạn đọc"
        description="Xem chi tiết, duyệt, từ chối hoặc hủy xác thực hồ sơ e-KYC của bạn đọc."
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            Làm mới
          </Button>
        }
      />

      <Card className="glass-card">
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space wrap>
            <Tag color="blue">{metrics.all} hồ sơ</Tag>
            <Tag color="gold">{metrics.pending} chờ duyệt</Tag>
            <Tag color="green">{metrics.verified} đã duyệt</Tag>
            <Tag color="red">{metrics.new} chưa xác thực</Tag>
          </Space>

          <Segmented value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} />

          <Table
            rowKey="id"
            loading={loading}
            dataSource={filteredUsers}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            locale={{ emptyText: "Không có hồ sơ phù hợp." }}
            columns={[
              {
                title: "Bạn đọc",
                render: (_, record) => (
                  <Space direction="vertical" size={2}>
                    <Typography.Text strong>{record.fullName}</Typography.Text>
                    <Typography.Text type="secondary">{record.studentCode}</Typography.Text>
                  </Space>
                )
              },
              { title: "Email xác thực", dataIndex: "email" },
              { title: "Số điện thoại", dataIndex: "phone" },
              { title: "Hồ sơ", render: (_, record) => record.kycDocument?.fileName || "-" },
              { title: "Trạng thái", dataIndex: "kycStatus", render: kycTag },
              {
                title: "Thao tác",
                width: 300,
                render: (_, record) => (
                  <Space wrap>
                    <Button icon={<EyeOutlined />} onClick={() => setSelected(record)}>
                      Xem chi tiết
                    </Button>
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      disabled={record.kycStatus !== "PENDING"}
                      onClick={() => approve(record)}
                    >
                      Duyệt
                    </Button>
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      disabled={record.kycStatus !== "PENDING" && record.kycStatus !== "VERIFIED"}
                      onClick={() => reject(record)}
                    >
                      {getRejectLabel(record.kycStatus)}
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        </Space>
      </Card>

      <Modal
        open={Boolean(selected)}
        title="Chi tiết phiếu thông tin bạn đọc"
        onCancel={() => setSelected(null)}
        width={760}
        footer={selected ? [
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            disabled={!canRejectSelected}
            onClick={() => reject(selected)}
          >
            {getRejectLabel(selected.kycStatus)}
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!canApproveSelected}
            onClick={() => approve(selected)}
          >
            Phê duyệt cấp thẻ
          </Button>
        ] : null}
      >
        {selected ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Họ tên">{selected.fullName}</Descriptions.Item>
              <Descriptions.Item label="Mã bạn đọc">{selected.studentCode}</Descriptions.Item>
              <Descriptions.Item label="Email tài khoản">{selected.accountEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="Email xác thực">{selected.email || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{selected.phone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{selected.address || "-"}</Descriptions.Item>
              <Descriptions.Item label="Số CCCD / Mã sinh viên">{selected.idCardNumber || "-"}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{kycTag(selected.kycStatus)}</Descriptions.Item>
              <Descriptions.Item label="Thẻ thư viện">{selected.cardCode || "Chưa cấp"}</Descriptions.Item>
              <Descriptions.Item label="Ngày gửi">{formatDateTime(selected.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{formatDateTime(selected.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <div className="mock-id-card">
              <IdcardOutlined />
              <div>
                <strong>{selected.kycDocument?.type || "Chưa có hồ sơ"}</strong>
                <p>{selected.kycDocument?.fileName || "Bạn đọc chưa tải tài liệu xác minh."}</p>
                {selected.kycDocument?.fileUrl ? (
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    href={selected.kycDocument.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ paddingInline: 0 }}
                  >
                    Mở ảnh CCCD
                  </Button>
                ) : null}
              </div>
            </div>

            {selected.kycDocument?.fileUrl ? (
              <Image
                src={selected.kycDocument.fileUrl}
                alt="Ảnh CCCD / thẻ sinh viên"
                style={{ maxHeight: 360, objectFit: "contain", borderRadius: 12 }}
              />
            ) : null}
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
