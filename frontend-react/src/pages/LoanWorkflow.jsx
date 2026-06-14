import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  HomeOutlined,
  ShopOutlined
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { libraryGateway } from "../api/libraryGateway";
import PageHeader from "../components/PageHeader";
import { formatCurrency, formatDate, formatDateTime } from "../components/formatters";

const ACTIVE_STATUSES = ["NEW", "PACKING", "SHIPPING", "BORROWING", "RETURNING", "RECEIVED", "CHECKING"];

const DELIVERY_STATUS_LABELS = {
  ALL: "Tất cả",
  NEW: "Chờ xác nhận",
  PACKING: "Cần giao",
  SHIPPING: "Đang giao",
  BORROWING: "Đang mượn",
  RETURNING: "Chờ nhận trả",
  RECEIVED: "Đã nhận lại",
  CHECKING: "Đang kiểm tra",
  OVERDUE: "Quá hạn",
  RETURNED: "Hoàn tất",
  CANCELLED: "Đã hủy"
};

const DELIVERY_STATUS_COLORS = {
  NEW: "gold",
  PACKING: "cyan",
  SHIPPING: "blue",
  BORROWING: "green",
  RETURNING: "purple",
  RECEIVED: "geekblue",
  CHECKING: "orange",
  OVERDUE: "red",
  RETURNED: "default",
  CANCELLED: "red"
};

const DELIVERY_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "NEW", label: "Chờ xác nhận" },
  { key: "PACKING", label: "Cần giao" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "BORROWING", label: "Đang mượn" },
  { key: "RETURNING", label: "Chờ nhận trả" },
  { key: "OVERDUE", label: "Quá hạn" },
  { key: "RETURNED", label: "Hoàn tất" }
];

function isDeliveryLoan(loan) {
  return loan.receiveMethod === "DELIVERY" || loan.deliveryMethod === "HOME_DELIVERY";
}

function getDateOnly(value) {
  if (!value) {
    return null;
  }

  const rawValue = String(value);
  const parsed = new Date(rawValue.includes("T") ? rawValue : `${rawValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isOverdue(value) {
  const dueDate = getDateOnly(value);
  return dueDate ? dueDate < startOfToday() : false;
}

function isDueSoon(value) {
  const dueDate = getDateOnly(value);
  if (!dueDate || isOverdue(value)) {
    return false;
  }

  const tomorrow = startOfToday();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dueDate <= tomorrow;
}

function bookCountText(loan) {
  const count = Array.isArray(loan.books) && loan.books.length ? loan.books.length : 1;
  return `${count} cuốn`;
}

function copyCodeText(book) {
  return book?.copyBarcode || (book?.copyId ? `COPY-${book.copyId}` : "Chưa gán bản sao");
}

function readerCodeText(loan) {
  return loan?.readerCardCode || loan?.studentCode || (loan?.userId ? `LIB-USER-${loan.userId}` : "-");
}

function priorityReaderCode(loan) {
  const priority = Boolean(loan?.priorityProcessing);
  return (
    <Typography.Text
      type={priority ? undefined : "secondary"}
      style={{ fontSize: 12, color: priority ? "#d48806" : undefined, fontWeight: priority ? 700 : 400 }}
    >
      {readerCodeText(loan)}
    </Typography.Text>
  );
}

function overdueDaysText(dueDate) {
  const due = getDateOnly(dueDate);
  if (!due) {
    return "không rõ số ngày";
  }

  const diffDays = Math.max(1, Math.ceil((startOfToday() - due) / 86400000));
  return `${diffDays} ngày`;
}

function estimateReturnFine(order, conditions = []) {
  const books = Array.isArray(order?.books) && order.books.length ? order.books : [{}];
  const overdue = order?.deliveryStatus === "OVERDUE" || isOverdue(order?.dueDate);
  const lateFine = overdue ? books.length * 10000 : 0;
  const conditionFine = conditions.reduce((sum, condition) => {
    if (condition === "DAMAGED") {
      return sum + 50000;
    }
    if (condition === "LOST") {
      return sum + 100000;
    }
    return sum;
  }, 0);

  return lateFine + conditionFine;
}

function getDeliveryStatus(loan, overrides = {}) {
  const overridden = overrides[loan.id];
  if (overridden) {
    return overridden;
  }

  if (loan.status === "BORROWING" && isOverdue(loan.dueDate)) {
    return "OVERDUE";
  }

  return loan.status;
}

function matchesDeliveryKeyword(loan, keyword) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return true;
  }

  return [
    loan.id,
    loan.readerName,
    loan.phone,
    loan.address,
    loan.bookTitle,
    ...(Array.isArray(loan.books) ? loan.books.map((book) => book.title) : []),
    ...(Array.isArray(loan.books) ? loan.books.map((book) => book.copyBarcode || book.copyId) : [])
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
}

function tabMatchesStatus(tabKey, status) {
  if (tabKey === "ALL") {
    return true;
  }

  if (tabKey === "RETURNING") {
    return ["RETURNING", "RECEIVED", "CHECKING"].includes(status);
  }

  return status === tabKey;
}

function sortDeliveryOrders(orders, sortKey, sortOrder) {
  const statusRank = {
    OVERDUE: 0,
    NEW: 1,
    PACKING: 2,
    SHIPPING: 3,
    RETURNING: 4,
    RECEIVED: 5,
    CHECKING: 6,
    BORROWING: 7,
    RETURNED: 8,
    CANCELLED: 9
  };

  const direction = sortOrder === "ascend" ? 1 : -1;

  return [...orders].sort((left, right) => {
    if (left.deliveryStatus === "OVERDUE" && right.deliveryStatus !== "OVERDUE") {
      return -1;
    }
    if (right.deliveryStatus === "OVERDUE" && left.deliveryStatus !== "OVERDUE") {
      return 1;
    }

    if (sortKey === "dueDate" || sortKey === "createdAt") {
      return (new Date(left[sortKey] || 0) - new Date(right[sortKey] || 0)) * direction;
    }

    if (sortKey === "status") {
      return ((statusRank[left.deliveryStatus] ?? 99) - (statusRank[right.deliveryStatus] ?? 99)) * direction;
    }

    return String(left[sortKey] || "").localeCompare(String(right[sortKey] || ""), "vi") * direction;
  });
}

function StatusBadge({ status }) {
  return (
    <Tag color={DELIVERY_STATUS_COLORS[status] || "default"}>
      {DELIVERY_STATUS_LABELS[status] || status}
    </Tag>
  );
}

function DeliveryStats({ orders }) {
  const stats = useMemo(() => ({
    work: orders.filter((loan) => ACTIVE_STATUSES.includes(loan.deliveryStatus)).length,
    dueSoon: orders.filter((loan) => loan.deliveryStatus === "BORROWING" && isDueSoon(loan.dueDate)).length,
    overdue: orders.filter((loan) => loan.deliveryStatus === "OVERDUE").length
  }), [orders]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={8}>
        <Card className="metric-card">
          <Typography.Text type="secondary">Việc cần xử lý</Typography.Text>
          <strong>{stats.work}</strong>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="metric-card">
          <Typography.Text type="secondary"><ClockCircleOutlined /> Sắp đến hạn</Typography.Text>
          <strong>{stats.dueSoon}</strong>
        </Card>
      </Col>
      <Col xs={24} md={8}>
        <Card className="metric-card">
          <Typography.Text type="secondary"><ExclamationCircleOutlined /> Quá hạn</Typography.Text>
          <strong>{stats.overdue}</strong>
        </Card>
      </Col>
    </Row>
  );
}

function DeliveryFilters({ keyword, onKeywordChange }) {
  return (
    <Card className="glass-card delivery-filter-card">
      <Input.Search
        allowClear
        size="middle"
        placeholder="Tìm mã đơn, bạn đọc, SĐT, địa chỉ hoặc tên sách"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
      />
    </Card>
  );
}

function DeliveryStatusTabs({ activeStatus, counts, onChange }) {
  return (
    <Tabs
      activeKey={activeStatus}
      onChange={onChange}
      items={DELIVERY_TABS.map((tab) => ({
        key: tab.key,
        label: (
          <Space size={6}>
            <span>{tab.label}</span>
            <Tag>{counts[tab.key] || 0}</Tag>
          </Space>
        )
      }))}
    />
  );
}

function DeliveryTable({ orders, query, total, onQueryChange, onOpenDetails }) {
  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 82,
      sorter: true,
      render: (value, record) => (
        <Space size={6}>
          <Tag color={record.deliveryStatus === "OVERDUE" ? "red" : "blue"}>{value}</Tag>
        </Space>
      )
    },
    {
      title: "Bạn đọc",
      dataIndex: "readerName",
      width: 142,
      ellipsis: true,
      sorter: true,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value}</Typography.Text>
          {priorityReaderCode(record)}
        </Space>
      )
    },
    {
      title: "Số cuốn",
      width: 92,
      render: (_, record) => bookCountText(record)
    },
    {
      title: "Ngày mượn",
      dataIndex: "loanedAt",
      width: 106,
      sorter: true,
      render: formatDate
    },
    {
      title: "Hạn trả",
      dataIndex: "dueDate",
      width: 106,
      sorter: true,
      render: formatDate
    },
    {
      title: "Trạng thái",
      dataIndex: "deliveryStatus",
      width: 118,
      sorter: true,
      render: (status) => <StatusBadge status={status} />
    },
    {
      title: "Hành động",
      width: 88,
      align: "center",
      render: (_, record) => (
        <Button size="small" onClick={() => onOpenDetails(record)}>
          Chi tiết
        </Button>
      )
    }
  ];

  return (
    <div className="delivery-table-wrapper">
      <Table
        rowKey="id"
        className="delivery-orders-table"
        tableLayout="fixed"
        columns={columns}
        dataSource={orders}
        rowClassName={(record) => record.deliveryStatus === "OVERDUE" ? "delivery-order-overdue" : ""}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          showTotal: (count) => `${count} đơn`
        }}
        onChange={(pagination, _filters, sorter) => {
          onQueryChange({
            page: pagination.current || 1,
            limit: pagination.pageSize || 10,
            sort: sorter?.field || "status",
            sortOrder: sorter?.order || "ascend"
          });
        }}
      />
    </div>
  );
}

function DeliveryDetailDrawer({ order, fines = [], open, onClose, onAction, showActions = true }) {
  const books = Array.isArray(order?.books) ? order.books : [];
  const orderFines = order
    ? fines.filter((fine) => String(fine.loanId || "") === String(order.id || ""))
    : [];
  const unpaidFineAmount = orderFines
    .filter((fine) => fine.status === "UNPAID")
    .reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const totalFineAmount = orderFines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
  const fineAmount = unpaidFineAmount || totalFineAmount;
  const depositAmount = Number(order?.depositAmount || order?.deposit || 0);

  const actions = {
    NEW: [
      { label: "Duyệt đơn", status: "PACKING", type: "primary" },
      { label: "Từ chối", status: "CANCELLED", danger: true }
    ],
    PACKING: [{ label: "Xác nhận đang giao", status: "SHIPPING", type: "primary" }],
    SHIPPING: [{ label: "Xác nhận đã giao", status: "BORROWING", type: "primary" }],
    BORROWING: [{ label: "Ghi nhận yêu cầu trả", status: "RETURNING", type: "primary" }],
    RETURNING: [{ label: "Xác nhận đã nhận lại sách", status: "RECEIVED", type: "primary" }],
    RECEIVED: [{ label: "Chuyển sang kiểm tra", status: "CHECKING", type: "primary" }],
    CHECKING: [
      { label: "Hoàn tất", status: "RETURNED", type: "primary" },
      { label: "Tính phí phạt", status: "FINE", danger: true }
    ],
    OVERDUE: [
      { label: "Gửi nhắc trả", status: "REMIND", type: "primary" },
      { label: "Xác nhận đã nhận lại", status: "RECEIVED" }
    ]
  };

  const currentActions = order ? actions[order.deliveryStatus] || [] : [];

  return (
    <Drawer
      title={order ? `Chi tiết đơn #${order.id}` : "Chi tiết đơn"}
      open={open}
      onClose={onClose}
      width={560}
      extra={<Button onClick={onClose}>Đóng</Button>}
    >
      {order ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Trạng thái">
              <StatusBadge status={order.deliveryStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="Bạn đọc">{order.readerName}</Descriptions.Item>
            <Descriptions.Item label="Mã thư viện">{priorityReaderCode(order)}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{order.phone || "Chưa cập nhật"}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ giao">{order.address || "Chưa cập nhật"}</Descriptions.Item>
            <Descriptions.Item label="Số sách">{bookCountText(order)}</Descriptions.Item>
            <Descriptions.Item label="Ngày mượn">{formatDate(order.loanedAt)}</Descriptions.Item>
            <Descriptions.Item label="Hạn trả">{formatDate(order.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="Tiền cọc">{depositAmount ? formatCurrency(depositAmount) : "Không có"}</Descriptions.Item>
            <Descriptions.Item label="Phí phạt">{fineAmount ? formatCurrency(fineAmount) : "Chưa phát sinh"}</Descriptions.Item>
          </Descriptions>

          <Card size="small" title="Danh sách sách trong đơn">
            {orderFines.length ? (
              <List
                header={<Typography.Text strong>Phiếu phạt</Typography.Text>}
                dataSource={orderFines}
                renderItem={(fine) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Typography.Text strong>{formatCurrency(fine.amount)}</Typography.Text>
                      <Typography.Text type="secondary">
                        {fine.reason} / {fine.status === "UNPAID" ? "Chưa thanh toán" : "Đã thanh toán"}
                        {fine.copyBarcode ? ` / Mã bản sao: ${fine.copyBarcode}` : ""}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : null}
            {books.length ? (
              <List
                dataSource={books}
                renderItem={(book, index) => (
                  <List.Item>
                    <Space direction="vertical" size={0}>
                      <Typography.Text>{index + 1}. {book.title || "Sách không tên"}</Typography.Text>
                      <Typography.Text type="secondary">Mã bản sao: {copyCodeText(book)}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">{order.bookTitle}</Typography.Text>
            )}
          </Card>

          <Card size="small" title="Lịch sử trạng thái">
            {Array.isArray(order.tracking) && order.tracking.length ? (
              <List
                dataSource={order.tracking}
                renderItem={(item) => (
                  <List.Item>
                    <Space>
                      <Tag color={item.done ? "green" : "default"}>{item.label}</Tag>
                      <Typography.Text type="secondary">
                        {item.time && item.time !== "BE" ? formatDateTime(item.time) : "Theo luồng đơn"}
                      </Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Typography.Text type="secondary">Chưa có lịch sử trạng thái.</Typography.Text>
            )}
          </Card>

          {showActions && currentActions.length ? (
            <Space wrap>
              {currentActions.map((action) => (
                <Button
                  key={action.status}
                  type={action.type}
                  danger={action.danger}
                  onClick={() => onAction(order, action.status)}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          ) : null}
        </Space>
      ) : null}
    </Drawer>
  );
}

function ReturnConfirmModal({ order, open, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const books = Array.isArray(order?.books) && order.books.length ? order.books : [];
  const watchedConditions = Form.useWatch("bookConditions", form) || [];
  const overdue = order?.deliveryStatus === "OVERDUE" || isOverdue(order?.dueDate);
  const estimatedFine = estimateReturnFine(order, watchedConditions);

  useEffect(() => {
    if (open && order) {
      const count = books.length || 1;
      form.setFieldsValue({
        bookConditions: Array.from({ length: count }, () => "OK")
      });
    }
  }, [open, order?.id]);

  async function handleFinish(values) {
    setSubmitting(true);
    try {
      await onSubmit(order, values.bookConditions || []);
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      title={order ? `Xác nhận trả sách #${order.id}` : "Xác nhận trả sách"}
      okText="Xác nhận trả"
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={640}
    >
      {order ? (
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {overdue ? (
            <Alert
              type="error"
              showIcon
              message={`Đơn đã quá hạn ${overdueDaysText(order.dueDate)}`}
              description="Khi xác nhận trả, hệ thống sẽ tự tạo phiếu phạt LATE_RETURN cho từng cuốn quá hạn."
            />
          ) : (
            <Alert type="success" showIcon message="Đơn chưa quá hạn trả." />
          )}

          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Bạn đọc">{order.readerName}</Descriptions.Item>
            <Descriptions.Item label="Mã thư viện">{priorityReaderCode(order)}</Descriptions.Item>
            <Descriptions.Item label="Hạn trả">{formatDate(order.dueDate)}</Descriptions.Item>
            <Descriptions.Item label="Phạt dự kiến">
              {estimatedFine ? <Tag color="red">{formatCurrency(estimatedFine)}</Tag> : "Chưa phát sinh"}
            </Descriptions.Item>
          </Descriptions>

          <Form form={form} layout="vertical" onFinish={handleFinish}>
            {(books.length ? books : [{ title: order.bookTitle || "Sách" }]).map((book, index) => (
              <Form.Item
                key={`${book.id || book.title}-${index}`}
                name={["bookConditions", index]}
                label={`${index + 1}. ${book.title || "Sách không tên"} - Mã bản sao: ${copyCodeText(book)}`}
                rules={[{ required: true, message: "Chọn tình trạng sách." }]}
              >
                <Select
                  options={[
                    { value: "OK", label: "Bình thường" },
                    { value: "DAMAGED", label: "Hư hỏng (+50.000)" },
                    { value: "LOST", label: "Mất sách (+100.000)" }
                  ]}
                />
              </Form.Item>
            ))}
          </Form>
        </Space>
      ) : null}
    </Modal>
  );
}

function DeliveryPage() {
  const [messageApi, messageContextHolder] = message.useMessage();
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [statusOverrides, setStatusOverrides] = useState({});
  const [keyword, setKeyword] = useState("");
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [returnOrder, setReturnOrder] = useState(null);
  const [query, setQuery] = useState({
    page: 1,
    limit: 10,
    sort: "status",
    sortOrder: "ascend"
  });

  async function refresh() {
    const [nextLoans, nextFines] = await Promise.all([
      libraryGateway.listLoans(),
      libraryGateway.listFines()
    ]);
    setLoans(nextLoans);
    setFines(nextFines);
  }

  useEffect(() => {
    refresh();
  }, []);

  const deliveryOrders = useMemo(
    () => loans
      .filter(isDeliveryLoan)
      .map((loan) => ({
        ...loan,
        deliveryStatus: getDeliveryStatus(loan, statusOverrides)
      })),
    [loans, statusOverrides]
  );

  const counts = useMemo(() => {
    const result = { ALL: deliveryOrders.length };
    for (const tab of DELIVERY_TABS) {
      if (tab.key === "ALL") {
        continue;
      }
      result[tab.key] = deliveryOrders.filter((loan) => tabMatchesStatus(tab.key, loan.deliveryStatus)).length;
    }
    return result;
  }, [deliveryOrders]);

  const filteredOrders = useMemo(() => {
    const matched = deliveryOrders
      .filter((loan) => matchesDeliveryKeyword(loan, keyword))
      .filter((loan) => tabMatchesStatus(activeStatus, loan.deliveryStatus));
    return sortDeliveryOrders(matched, query.sort, query.sortOrder);
  }, [activeStatus, deliveryOrders, keyword, query.sort, query.sortOrder]);

  const pagedOrders = useMemo(() => {
    const start = (query.page - 1) * query.limit;
    return filteredOrders.slice(start, start + query.limit);
  }, [filteredOrders, query.limit, query.page]);

  const selectedOrder = useMemo(
    () => deliveryOrders.find((loan) => loan.id === selectedId) || null,
    [deliveryOrders, selectedId]
  );

  function updateQuery(nextQuery) {
    setQuery((current) => ({ ...current, ...nextQuery }));
  }

  function handleKeywordChange(nextKeyword) {
    setKeyword(nextKeyword);
    updateQuery({ page: 1 });
  }

  function handleStatusChange(nextStatus) {
    setActiveStatus(nextStatus);
    updateQuery({ page: 1 });
  }

  async function handleAction(order, nextStatus) {
    if (nextStatus === "REMIND") {
      try {
        await libraryGateway.sendReturnReminder(order.id);
        messageApi.success(`Đã gửi nhắc trả cho đơn ${order.id}.`);
      } catch (error) {
        messageApi.error(error?.message || "Không thể gửi nhắc trả.");
      }
      return;
    }

    if (nextStatus === "RETURNED" || (nextStatus === "RECEIVED" && ["RETURNING", "OVERDUE"].includes(order.deliveryStatus))) {
      setReturnOrder(order);
      return;
    }

    if (nextStatus === "FINE") {
      messageApi.info("Vui lòng tạo phiếu phạt ở mục Thu phạt.");
      return;
    }

    if (["RECEIVED", "CHECKING"].includes(nextStatus)) {
      setStatusOverrides((current) => ({ ...current, [order.id]: nextStatus }));
      messageApi.success(`Đã chuyển đơn ${order.id} sang ${DELIVERY_STATUS_LABELS[nextStatus]}.`);
      return;
    }

    try {
      await libraryGateway.moveLoan(order.id, nextStatus);
      setStatusOverrides((current) => ({ ...current, [order.id]: nextStatus }));
      await refresh();
      messageApi.success(`Đã chuyển đơn ${order.id} sang ${DELIVERY_STATUS_LABELS[nextStatus]}.`);
      if (nextStatus === "RETURNED" || nextStatus === "CANCELLED") {
        setSelectedId(null);
      }
    } catch (error) {
      messageApi.error(error?.message || "Không thể cập nhật trạng thái đơn.");
    }
  }

  async function handleConfirmReturn(order, bookConditions) {
    try {
      await libraryGateway.confirmReturn(order.id, bookConditions);
      messageApi.success("Đã xác nhận trả sách. Phiếu phạt quá hạn/hư/mất sẽ được tạo tự động nếu có.");
      setReturnOrder(null);
      setSelectedId(null);
      await refresh();
    } catch (error) {
      messageApi.error(error?.message || "Không thể xác nhận trả sách.");
      throw error;
    }
  }

  return (
    <div className="page-shell delivery-page">
      {messageContextHolder}
      <PageHeader
        eyebrow="Điều phối giao sách"
        title="Giao tận nhà"
        description="Quản lý theo đơn mượn, lọc nhanh bằng trạng thái và tra cứu."
        extra={
          <Space>
            <HomeOutlined />
            <Tag color="blue">{counts.ALL || 0} đơn</Tag>
          </Space>
        }
      />

      <DeliveryFilters keyword={keyword} onKeywordChange={handleKeywordChange} />

      <Card className="glass-card delivery-workspace">
        <DeliveryStatusTabs activeStatus={activeStatus} counts={counts} onChange={handleStatusChange} />
        <DeliveryTable
          orders={pagedOrders}
          query={query}
          total={filteredOrders.length}
          onQueryChange={updateQuery}
          onOpenDetails={(order) => setSelectedId(order.id)}
        />
      </Card>

      <DeliveryDetailDrawer
        order={selectedOrder}
        fines={fines}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
      />
      <ReturnConfirmModal
        order={returnOrder}
        open={Boolean(returnOrder)}
        onCancel={() => setReturnOrder(null)}
        onSubmit={handleConfirmReturn}
      />
    </div>
  );
}

function PickupPage() {
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnOrder, setReturnOrder] = useState(null);

  async function refresh() {
    const [nextLoans, nextFines] = await Promise.all([
      libraryGateway.listLoans(),
      libraryGateway.listFines()
    ]);
    setLoans(nextLoans);
    setFines(nextFines);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleStatusChange(loanId, status, title) {
    try {
      await libraryGateway.moveLoan(loanId, status);
      await refresh();
      message.success(`Đã chuyển đơn ${loanId} sang ${title}.`);
    } catch (error) {
      message.error(error?.message || "Không thể cập nhật trạng thái đơn.");
    }
  }

  async function handleConfirmReturn(order, bookConditions) {
    try {
      await libraryGateway.confirmReturn(order.id, bookConditions);
      message.success("Đã xác nhận trả sách. Phiếu phạt quá hạn/hư/mất sẽ được tạo tự động nếu có.");
      setReturnOrder(null);
      setSelectedOrder(null);
      await refresh();
    } catch (error) {
      message.error(error?.message || "Không thể xác nhận trả sách.");
      throw error;
    }
  }

  const pickupOrders = useMemo(
    () => loans
      .filter((loan) => !isDeliveryLoan(loan))
      .filter((loan) => matchesDeliveryKeyword(loan, keyword))
      .map((loan) => ({
        ...loan,
        deliveryStatus: loan.status === "BORROWING" && isOverdue(loan.dueDate) ? "OVERDUE" : loan.status
      })),
    [keyword, loans]
  );

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      width: 110,
      render: (value, record) => <Tag color={record.deliveryStatus === "OVERDUE" ? "red" : "blue"}>{value}</Tag>
    },
    {
      title: "Bạn đọc",
      dataIndex: "readerName",
      width: 190,
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{value}</Typography.Text>
          {priorityReaderCode(record)}
        </Space>
      )
    },
    { title: "Số sách", width: 100, render: (_, record) => bookCountText(record) },
    { title: "Ngày mượn", dataIndex: "loanedAt", width: 130, render: formatDate },
    { title: "Hạn trả", dataIndex: "dueDate", width: 130, render: formatDate },
    { title: "Trạng thái", dataIndex: "deliveryStatus", width: 150, render: (status) => <StatusBadge status={status} /> },
    {
      title: "Hành động",
      width: 220,
      render: (_, record) => (
        <Space>
          <Button onClick={() => setSelectedOrder(record)}>Chi tiết</Button>
          {record.status === "NEW" ? (
            <Button type="primary" onClick={() => handleStatusChange(record.id, "BORROWING", "Đang mượn")}>
              Xác nhận
            </Button>
          ) : record.status === "BORROWING" || record.deliveryStatus === "OVERDUE" ? (
            <Button type="primary" onClick={() => setReturnOrder(record)}>
              Xác nhận trả
            </Button>
          ) : null}
        </Space>
      )
    }
  ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Điều phối đơn mượn"
        title="Đến lấy tại quầy"
        description="Quản lý đơn mượn tại quầy"
        extra={<Tag color="blue">{pickupOrders.length} đơn</Tag>}
      />

      <DeliveryFilters keyword={keyword} onKeywordChange={setKeyword} />

      <Card className="glass-card">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={pickupOrders}
          scroll={{ x: 900 }}
          pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
        />
      </Card>

      <DeliveryDetailDrawer
        order={selectedOrder}
        fines={fines}
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onAction={(order, nextStatus) => handleStatusChange(order.id, nextStatus, DELIVERY_STATUS_LABELS[nextStatus])}
        showActions={false}
      />
      <ReturnConfirmModal
        order={returnOrder}
        open={Boolean(returnOrder)}
        onCancel={() => setReturnOrder(null)}
        onSubmit={handleConfirmReturn}
      />
    </div>
  );
}

export default function LoanWorkflow({ mode }) {
  return mode === "DELIVERY" ? <DeliveryPage /> : <PickupPage />;
}
