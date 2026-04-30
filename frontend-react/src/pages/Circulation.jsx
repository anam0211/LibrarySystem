import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  RollbackOutlined,
  SafetyOutlined,
  SwapOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  InputNumber,
  List,
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
import { libraryApi } from "../api/libraryApi";
import PageHeader from "../components/PageHeader";
import { formatDate } from "../components/formatters";

function getBookPageItems(pageData) {
  if (Array.isArray(pageData)) {
    return pageData;
  }

  return Array.isArray(pageData?.items) ? pageData.items : [];
}

function getLoanBookIds(record) {
  return Array.isArray(record?.bookIds) ? record.bookIds : [];
}

function getLoanItems(record) {
  if (Array.isArray(record?.items) && record.items.length) {
    return record.items.map((item, index) => ({
      id: item.bookId || item.id || `${record.loanId}-${index}`,
      title: item.bookTitle || item.title || item.book?.title || "Sách",
      status: item.itemStatus || item.status
    }));
  }

  const bookIds = getLoanBookIds(record);
  if (bookIds.length) {
    return bookIds.map((bookId, index) => ({
      id: bookId,
      title: Array.isArray(record.bookTitles) ? record.bookTitles[index] : index === 0 ? record.book : `Sách #${bookId}`,
      status: record.status === "CLOSED" ? "RETURNED" : "BORROWED"
    }));
  }

  if (record?.book) {
    return [
      {
        id: record.bookId || record.loanId,
        title: typeof record.book === "string" ? record.book : record.book.title || "Sách",
        status: record.status === "CLOSED" ? "RETURNED" : "BORROWED"
      }
    ];
  }

  return [];
}

function renderLoanStatus(record) {
  if (record.status === "CLOSED") {
    return <Tag color="blue">Đã trả</Tag>;
  }

  if (record.status === "OPEN" && !record.processId) {
    return <Tag color="gold">Chờ xác nhận</Tag>;
  }

  return <Tag color="green">Đang mượn</Tag>;
}

function renderItemStatus(status) {
  if (status === "RETURNED") {
    return <Tag color="blue">Đã trả</Tag>;
  }

  if (status === "BORROWED") {
    return <Tag color="green">Đang mượn</Tag>;
  }

  return <Tag>{status || "-"}</Tag>;
}

export default function Circulation() {
  const [checkoutForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState("");
  const [activeTab, setActiveTab] = useState("checkout");
  const [currentUser, setCurrentUser] = useState(null);
  const [readers, setReaders] = useState([]);
  const [books, setBooks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);

  async function loadCirculationData() {
    setLoading(true);

    try {
      const [user, recentTransactions, userList, bookPage] = await Promise.all([
        libraryApi.users.me(),
        libraryApi.circulation.recent(),
        libraryApi.users.list().catch(() => []),
        libraryApi.books.list({
          page: 0,
          size: 200,
          sortBy: "title",
          sortDir: "asc"
        }).catch(() => ({ items: [] }))
      ]);

      const normalizedUsers = Array.isArray(userList) ? userList : [];
      const readerUsers = normalizedUsers.filter((item) => item.role === "READER");

      setCurrentUser(user);
      setReaders(readerUsers.length ? readerUsers : normalizedUsers);
      setBooks(getBookPageItems(bookPage));
      setTransactions(Array.isArray(recentTransactions) ? recentTransactions : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCirculationData();
  }, []);

  const readerOptions = useMemo(
    () =>
      readers.map((reader) => ({
        label: `${reader.fullName || reader.email || "Độc giả"} (#${reader.id})`,
        value: reader.id
      })),
    [readers]
  );

  const bookOptions = useMemo(
    () =>
      books.map((book) => ({
        label: `${book.title || "Sách"} (#${book.id})`,
        value: book.id
      })),
    [books]
  );

  const availableBookOptions = useMemo(
    () =>
      books.map((book) => {
        const available = Number(book.stockAvailable || 0);

        return {
          label: `${book.title || "Sách"} (#${book.id}) - còn ${available}`,
          value: book.id,
          disabled: available <= 0
        };
      }),
    [books]
  );

  const pendingReservations = transactions.filter(
    (item) => item.status === "OPEN" && !item.processId
  );

  const activeLoans = transactions.filter(
    (item) => item.status === "OPEN" && item.processId
  );

  async function handleCheckout(values) {
    if (!currentUser?.id) {
      message.error("Không tìm thấy tài khoản thủ thư hiện tại.");
      return;
    }

    setProcessing("checkout");

    try {
      await libraryApi.circulation.checkout(
        {
          borrowerId: Number(values.borrowerId),
          dueDays: Number(values.dueDays),
          items: [{ bookId: Number(values.bookId), qty: 1 }]
        },
        currentUser.id
      );
      checkoutForm.resetFields();
      checkoutForm.setFieldValue("dueDays", 14);
      message.success("Tạo phiếu mượn trực tiếp thành công.");
      loadCirculationData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setProcessing("");
    }
  }

  async function handleReturn(values) {
    setProcessing("return");

    try {
      await libraryApi.circulation.returnBook(Number(values.loanId), Number(values.bookId));
      returnForm.resetFields();
      message.success("Đã trả sách thành công.");
      loadCirculationData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setProcessing("");
    }
  }

  async function handleConfirm(record) {
    setProcessing(`confirm-${record.loanId}`);

    try {
      await libraryApi.circulation.confirmReservation(record.loanId);
      message.success("Đã xác nhận đơn đặt sách.");
      loadCirculationData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setProcessing("");
    }
  }

  async function handleCancel(record) {
    setProcessing(`cancel-${record.loanId}`);

    try {
      await libraryApi.circulation.cancelReservation(record.loanId, "Thủ thư hủy từ màn lưu thông");
      message.success("Đã hủy đơn đặt sách.");
      loadCirculationData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setProcessing("");
    }
  }

  function fillReturnForm(record) {
    const firstBookId = getLoanBookIds(record)[0] || getLoanItems(record)[0]?.id;

    setActiveTab("return");
    returnForm.setFieldsValue({
      loanId: record.loanId,
      bookId: firstBookId
    });
  }

  const loanOptions = activeLoans.map((loan) => ({
    label: `#${loan.loanId} - ${loan.reader || "Độc giả"}`,
    value: loan.loanId
  }));

  const formTabs = [
    {
      key: "checkout",
      label: "Mượn trực tiếp",
      children: (
        <Form form={checkoutForm} layout="vertical" onFinish={handleCheckout} initialValues={{ dueDays: 14 }}>
          <Form.Item
            name="borrowerId"
            label="Bạn đọc"
            rules={[{ required: true, message: "Chọn bạn đọc" }]}
          >
            {readerOptions.length ? (
              <Select
                showSearch
                placeholder="Chọn bạn đọc"
                optionFilterProp="label"
                options={readerOptions}
              />
            ) : (
              <InputNumber style={{ width: "100%" }} min={1} placeholder="Nhập mã bạn đọc" />
            )}
          </Form.Item>
          <Form.Item
            name="bookId"
            label="Sách"
            rules={[{ required: true, message: "Chọn sách" }]}
          >
            {availableBookOptions.length ? (
              <Select
                showSearch
                placeholder="Chọn sách còn trong kho"
                optionFilterProp="label"
                options={availableBookOptions}
              />
            ) : (
              <InputNumber style={{ width: "100%" }} min={1} placeholder="Nhập mã sách" />
            )}
          </Form.Item>
          <Form.Item
            name="dueDays"
            label="Số ngày mượn"
            rules={[{ required: true, message: "Nhập số ngày mượn" }]}
          >
            <InputNumber style={{ width: "100%" }} min={1} max={60} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={processing === "checkout"} icon={<SwapOutlined />} block>
            Tạo phiếu mượn
          </Button>
        </Form>
      )
    },
    {
      key: "return",
      label: "Trả sách",
      children: (
        <Form form={returnForm} layout="vertical" onFinish={handleReturn}>
          <Form.Item
            name="loanId"
            label="Phiếu đang mượn"
            rules={[{ required: true, message: "Chọn hoặc nhập mã phiếu" }]}
          >
            {loanOptions.length ? (
              <Select
                showSearch
                placeholder="Chọn phiếu mượn"
                optionFilterProp="label"
                options={loanOptions}
              />
            ) : (
              <InputNumber style={{ width: "100%" }} min={1} placeholder="Nhập mã phiếu" />
            )}
          </Form.Item>
          <Form.Item
            name="bookId"
            label="Sách trả"
            rules={[{ required: true, message: "Chọn hoặc nhập mã sách" }]}
          >
            {bookOptions.length ? (
              <Select
                showSearch
                placeholder="Chọn sách cần trả"
                optionFilterProp="label"
                options={bookOptions}
              />
            ) : (
              <InputNumber style={{ width: "100%" }} min={1} placeholder="Nhập mã sách" />
            )}
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={processing === "return"} icon={<RollbackOutlined />} block>
            Xác nhận trả sách
          </Button>
        </Form>
      )
    }
  ];

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Lưu thông"
        title="Mượn trả sách"
        description="Màn nghiệp vụ cho thủ thư: tạo phiếu mượn trực tiếp, xử lý đơn đặt trước và xem chi tiết từng phiếu."
      />

      <Row gutter={[20, 20]} align="start">
        <Col xs={24} xl={8}>
          <Card className="glass-card" title="Nghiệp vụ tại quầy">
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={formTabs} />
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Card
            className="glass-card"
            title="Đơn đặt trước"
            extra={<Tag color="gold">{pendingReservations.length} đơn chờ</Tag>}
          >
            <Table
              rowKey="loanId"
              loading={loading}
              dataSource={pendingReservations}
              pagination={false}
              locale={{ emptyText: "Không có đơn đặt trước nào đang chờ." }}
              columns={[
                {
                  title: "Phiếu",
                  render: (_, record) => (
                    <Space direction="vertical" size={2}>
                      <Typography.Text strong>#{record.loanId}</Typography.Text>
                      <Typography.Text type="secondary">{record.reader || "-"}</Typography.Text>
                    </Space>
                  )
                },
                {
                  title: "Sách",
                  dataIndex: "book"
                },
                {
                  title: "Ngày hẹn",
                  dataIndex: "dueDate",
                  render: formatDate
                },
                {
                  title: "Thao tác",
                  width: 300,
                  render: (_, record) => (
                    <Space wrap>
                      <Button icon={<EyeOutlined />} onClick={() => setSelectedLoan(record)}>
                        Chi tiết
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        loading={processing === `confirm-${record.loanId}`}
                        onClick={() => handleConfirm(record)}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        danger
                        icon={<CloseCircleOutlined />}
                        loading={processing === `cancel-${record.loanId}`}
                        onClick={() => handleCancel(record)}
                      >
                        Hủy
                      </Button>
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card className="glass-card" title="Phiếu mượn gần đây">
        <Table
          rowKey="loanId"
          loading={loading}
          dataSource={transactions}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "Phiếu",
              render: (_, record) => (
                <Space direction="vertical" size={2}>
                  <Typography.Text strong>#{record.loanId}</Typography.Text>
                  <Typography.Text type="secondary">{record.reader || "-"}</Typography.Text>
                </Space>
              )
            },
            {
              title: "Sách",
              dataIndex: "book"
            },
            {
              title: "Trạng thái",
              render: (_, record) => renderLoanStatus(record)
            },
            {
              title: "Thủ thư",
              render: (_, record) => record.processId ? <Tag icon={<SafetyOutlined />}>#{record.processId}</Tag> : "-"
            },
            {
              title: "Hạn trả",
              dataIndex: "dueDate",
              render: formatDate
            },
            {
              title: "Thao tác",
              width: 190,
              render: (_, record) => (
                <Space wrap>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedLoan(record)}>
                    Xem
                  </Button>
                  {record.status === "OPEN" && record.processId ? (
                    <Button size="small" onClick={() => fillReturnForm(record)}>
                      Trả sách
                    </Button>
                  ) : null}
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Drawer
        open={Boolean(selectedLoan)}
        width={620}
        title={selectedLoan ? `Chi tiết phiếu #${selectedLoan.loanId}` : ""}
        onClose={() => setSelectedLoan(null)}
      >
        {selectedLoan ? (
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã phiếu">#{selectedLoan.loanId}</Descriptions.Item>
              <Descriptions.Item label="Bạn đọc">{selectedLoan.reader || "-"}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">{renderLoanStatus(selectedLoan)}</Descriptions.Item>
              <Descriptions.Item label="Hạn trả / ngày hẹn">{formatDate(selectedLoan.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Thủ thư xử lý">
                {selectedLoan.processId ? `#${selectedLoan.processId}` : "Chưa xác nhận"}
              </Descriptions.Item>
              <Descriptions.Item label="Hình thức">
                {selectedLoan.deliveryAddress ? "Giao hàng" : selectedLoan.processId ? "Mượn trực tiếp" : "Đặt trước"}
              </Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Tài liệu trong phiếu">
              <List
                dataSource={getLoanItems(selectedLoan)}
                locale={{ emptyText: "Không có tài liệu." }}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.title || `Sách #${item.id}`}
                      description={item.id ? `Mã sách: ${item.id}` : null}
                    />
                    {renderItemStatus(item.status)}
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        ) : null}
      </Drawer>
    </div>
  );
}
