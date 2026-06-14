import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  IdcardOutlined,
  LinkOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Button, Card, Descriptions, Image, Modal, Segmented, Space, Table, Tag, Typography, message, notification } from "antd";
import { useEffect, useMemo, useState } from "react";
import { isProtectedKycMediaUrl, loadProtectedMediaObjectUrl, toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatDateTime } from "../components/formatters";

const STATUS_FILTERS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ duyệt", value: "PENDING" },
  { label: "Từ chối", value: "UNVERIFIED" },
  { label: "Đã xác thực", value: "VERIFIED" }
];

function kycTag(status) {
  if (status === "VERIFIED") {
    return <Tag color="green">Đã xác thực</Tag>;
  }

  if (status === "PENDING") {
    return <Tag color="gold">Chờ duyệt</Tag>;
  }

  return <Tag color="red">Từ chối</Tag>;
}

function getRejectLabel(status) {
  return status === "VERIFIED" ? "Hủy xác thực" : "Từ chối";
}

function getKycDocumentUrl(user) {
  return user?.idCardImageUrl || user?.kycDocument?.url || "";
}

export default function AdminKyc() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [kycDocumentPreviewUrl, setKycDocumentPreviewUrl] = useState("");
  const [kycDocumentLoading, setKycDocumentLoading] = useState(false);
  const [notifyApi, notifyContextHolder] = notification.useNotification();

  async function refresh() {
    setLoading(true);

    try {
      const allUsers = await libraryGateway.listKycUsers();
      const reviewedUsers = allUsers.filter((user) => {
        const hasKycDocument = Boolean(getKycDocumentUrl(user));
        return hasKycDocument || user?.kycStatus === "PENDING" || user?.kycStatus === "VERIFIED";
      });
      setUsers(reviewedUsers);
    } catch (error) {
      message.error(error?.message || "Không thể tải danh sách hồ sơ KYC.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const documentUrl = getKycDocumentUrl(selected);
    if (!documentUrl) {
      setKycDocumentPreviewUrl("");
      setKycDocumentLoading(false);
      return undefined;
    }

    if (!isProtectedKycMediaUrl(documentUrl)) {
      setKycDocumentPreviewUrl(toAbsoluteMediaUrl(documentUrl));
      setKycDocumentLoading(false);
      return undefined;
    }

    let active = true;
    let objectUrl = "";
    setKycDocumentPreviewUrl("");
    setKycDocumentLoading(true);

    loadProtectedMediaObjectUrl(documentUrl)
      .then((nextUrl) => {
        objectUrl = nextUrl;
        if (active) {
          setKycDocumentPreviewUrl(nextUrl);
        } else {
          URL.revokeObjectURL(nextUrl);
        }
      })
      .catch(() => {
        if (active) {
          message.error("Không thể tải ảnh KYC.");
        }
      })
      .finally(() => {
        if (active) {
          setKycDocumentLoading(false);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selected]);

  const filteredUsers = useMemo(() => {
    if (statusFilter === "ALL") {
      return users;
    }

    return users.filter((user) => user.kycStatus === statusFilter);
  }, [statusFilter, users]);

  const metrics = useMemo(() => ({
    all: users.length,
    pending: users.filter((user) => user.kycStatus === "PENDING").length,
    unverified: users.filter((user) => user.kycStatus === "UNVERIFIED").length,
    verified: users.filter((user) => user.kycStatus === "VERIFIED").length
  }), [users]);

  async function approve(user) {
    if (!user.fullName || !user.email || !user.phone) {
      notifyApi.error({
        message: "Không thể xác thực",
        description: "Thiếu thông tin. Cần đủ họ tên, email và số điện thoại để duyệt KYC.",
        placement: "bottomRight"
      });
      return;
    }

    try {
      const targetId = user.id || user.userId;
      await libraryGateway.approveKyc(targetId);
      notifyApi.success({
        message: "Xác thực thành công",
        description: `Đã cấp thẻ thư viện cho ${user.fullName}.`,
        placement: "bottomRight"
      });
      setSelected(null);
      await refresh();
    } catch (error) {
      notifyApi.error({
        message: "Lỗi xác thực",
        description: error?.message || "Không thể duyệt hồ sơ.",
        placement: "bottomRight"
      });
    }
  }

  async function reject(user) {
    try {
      const targetId = user.id || user.userId;
      await libraryGateway.rejectKyc(targetId);
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
      {notifyContextHolder}
      <PageHeader
        eyebrow="e-KYC"
        title="Duyệt hồ sơ KYC"
        description="Theo dõi hồ sơ chờ duyệt, hồ sơ bị từ chối và danh sách bạn đọc đã xác thực."
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
            <Tag color="red">{metrics.unverified} từ chối</Tag>
            <Tag color="green">{metrics.verified} đã xác thực</Tag>
          </Space>

          <Segmented value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} />

          <Table
            rowKey={(record) => record.id || record.userId}
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
              { title: "Hồ sơ", render: (_, record) => getKycDocumentUrl(record) ? "Đã tải ảnh" : "-" },
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
                <strong>{getKycDocumentUrl(selected) ? "Ảnh CCCD / Thẻ sinh viên" : "Chưa có hồ sơ"}</strong>
                <p>{getKycDocumentUrl(selected) ? "Tài liệu xác minh đã được tải lên." : "Bạn đọc chưa tải tài liệu xác minh."}</p>
                {getKycDocumentUrl(selected) ? (
                  <Button
                    type="link"
                    icon={<LinkOutlined />}
                    href={kycDocumentPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    disabled={!kycDocumentPreviewUrl || kycDocumentLoading}
                    style={{ paddingInline: 0 }}
                  >
                    Mở ảnh tĩnh
                  </Button>
                ) : null}
              </div>
            </div>

            {getKycDocumentUrl(selected) ? (
              <Image
                src={kycDocumentPreviewUrl}
                alt="Ảnh CCCD / thẻ sinh viên"
                placeholder={kycDocumentLoading ? "Đang tải ảnh KYC..." : null}
                style={{ maxHeight: 360, objectFit: "contain", borderRadius: 12 }}
              />
            ) : null}
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
