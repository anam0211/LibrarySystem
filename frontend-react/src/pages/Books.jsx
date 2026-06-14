import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SearchOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from "antd";
import { useEffect, useState } from "react";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryApi } from "../api/libraryApi";
import BookFormModal from "../components/BookFormModal";
import PageHeader from "../components/PageHeader";
import { asSelectOptions, formatDateTime, formatNumber } from "../components/formatters";

const DEFAULT_FILTERS = {
  keyword: "",
  authorId: undefined,
  categoryId: undefined,
  publisherId: undefined,
  status: "ALL",
  available: undefined,
  sortBy: "createdAt",
  sortDir: "desc",
  page: 0,
  size: 10
};

const EMPTY_PAGE = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: 10
};

function normalizeBookPayload(values) {
  return {
    isbn: values.isbn,
    title: values.title,
    subtitle: values.subtitle,
    publisherId: values.publisherId ? Number(values.publisherId) : null,
    publishYear: values.publishYear ? Number(values.publishYear) : null,
    languageCode: values.languageCode,
    pageCount: values.pageCount ? Number(values.pageCount) : null,
    description: values.description,
    keywords: values.keywords,
    status: values.status,
    authorIds: (values.authorIds || []).map(Number),
    categoryIds: (values.categoryIds || []).map(Number)
  };
}

function mapBookToForm(book) {
  return {
    ...book,
    authorIds: (book.authors || []).map((author) => author.id),
    categoryIds: (book.categories || []).map((category) => category.id)
  };
}

function renderBookStatusTag(status, stockAvailable) {
  if (status === "ARCHIVED") {
    return <Tag color="default">ARCHIVED</Tag>;
  }

  return <Tag color={Number(stockAvailable || 0) > 0 ? "green" : "gold"}>ACTIVE</Tag>;
}

const COPY_STATUS_OPTIONS = [
  { label: "AVAILABLE", value: "AVAILABLE" },
  { label: "RESERVED", value: "RESERVED", disabled: true },
  { label: "BORROWED", value: "BORROWED", disabled: true },
  { label: "DAMAGED", value: "DAMAGED" },
  { label: "LOST", value: "LOST" }
];

const COPY_CONDITION_OPTIONS = [
  { label: "GOOD", value: "GOOD" },
  { label: "DAMAGED", value: "DAMAGED" },
  { label: "LOST", value: "LOST" }
];

function renderCopyStatus(status) {
  const color = {
    AVAILABLE: "green",
    RESERVED: "blue",
    BORROWED: "gold",
    DAMAGED: "orange",
    LOST: "red"
  }[status] || "default";

  return <Tag color={color}>{status || "-"}</Tag>;
}

function BookCopiesPanel({ onStockChanged }) {
  const [form] = Form.useForm();
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [copies, setCopies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState(null);

  async function loadBookOptions() {
    try {
      const pageData = await libraryApi.books.list({
        page: 0,
        size: 200,
        status: "ALL",
        sortBy: "title",
        sortDir: "asc"
      });
      const items = Array.isArray(pageData?.items) ? pageData.items : [];
      setBooks(items);

      if (!selectedBookId && items[0]?.id) {
        setSelectedBookId(items[0].id);
        loadCopies(items[0].id);
      }
    } catch (error) {
      message.error(error.message);
    }
  }

  async function loadCopies(bookId = selectedBookId) {
    if (!bookId) {
      setCopies([]);
      return;
    }

    setLoading(true);
    try {
      const data = await libraryApi.bookCopies.byBook(bookId);
      setCopies(Array.isArray(data) ? data : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookOptions();
  }, []);

  function openCreateCopy() {
    setEditingCopy(null);
    form.setFieldsValue({
      barcode: "",
      status: "AVAILABLE",
      condition: "GOOD"
    });
    setModalOpen(true);
  }

  function openEditCopy(copy) {
    setEditingCopy(copy);
    form.setFieldsValue({
      barcode: copy.barcode,
      status: copy.status || "AVAILABLE",
      condition: copy.condition || "GOOD"
    });
    setModalOpen(true);
  }

  async function saveCopy(values) {
    if (!selectedBookId) {
      message.warning("Chọn sách trước khi thêm bản sao.");
      return;
    }

    setSaving(true);
    try {
      if (editingCopy?.id) {
        await libraryApi.bookCopies.update(editingCopy.id, values);
        message.success("Đã cập nhật bản sao.");
      } else {
        await libraryApi.bookCopies.create(selectedBookId, values);
        message.success("Đã thêm bản sao.");
      }

      setModalOpen(false);
      setEditingCopy(null);
      await loadCopies(selectedBookId);
      await loadBookOptions();
      onStockChanged?.();
    } catch (error) {
      message.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCopy(copy) {
    try {
      await libraryApi.bookCopies.remove(copy.id);
      message.success("Đã xóa bản sao.");
      await loadCopies(selectedBookId);
      await loadBookOptions();
      onStockChanged?.();
    } catch (error) {
      message.error(error.message);
    }
  }

  const selectedBook = books.find((book) => book.id === selectedBookId);
  const copyStatusManagedByLoan = ["RESERVED", "BORROWED"].includes(editingCopy?.status);

  function syncCopyConditionByStatus(status) {
    if (status === "DAMAGED" || status === "LOST") {
      form.setFieldsValue({ condition: status });
      return;
    }
    if (status === "AVAILABLE") {
      form.setFieldsValue({ condition: "GOOD" });
    }
  }

  function syncCopyStatusByCondition(condition) {
    if (condition === "DAMAGED" || condition === "LOST") {
      form.setFieldsValue({ status: condition });
      return;
    }
    if (condition === "GOOD") {
      form.setFieldsValue({ status: "AVAILABLE" });
    }
  }

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card className="glass-card">
        <Space wrap align="end" style={{ width: "100%", justifyContent: "space-between" }}>
          <Form layout="vertical" style={{ minWidth: 320 }}>
            <Form.Item label="Chọn sách" style={{ marginBottom: 0 }}>
              <Select
                showSearch
                value={selectedBookId}
                placeholder="Chọn đầu sách"
                optionFilterProp="label"
                style={{ minWidth: 360 }}
                options={books.map((book) => ({
                  label: `${book.title} (${book.stockAvailable}/${book.stockTotal})`,
                  value: book.id
                }))}
                onChange={(value) => {
                  setSelectedBookId(value);
                  loadCopies(value);
                }}
              />
            </Form.Item>
          </Form>
          <Button type="primary" icon={<PlusOutlined />} disabled={!selectedBookId} onClick={openCreateCopy}>
            Thêm bản sao
          </Button>
        </Space>
      </Card>

      <Card
        className="glass-card"
        title={selectedBook ? `Bản sao: ${selectedBook.title}` : "Bản sao"}
        extra={selectedBook ? <Tag color="blue">Tồn kho {formatNumber(selectedBook.stockAvailable)} / {formatNumber(selectedBook.stockTotal)}</Tag> : null}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={copies}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: "Barcode",
              dataIndex: "barcode",
              render: (value) => <Typography.Text strong>{value}</Typography.Text>
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: renderCopyStatus
            },
            {
              title: "Tình trạng",
              dataIndex: "condition",
              render: (value) => <Tag>{value || "-"}</Tag>
            },
            {
              title: "Ngày tạo",
              dataIndex: "createdAt",
              render: formatDateTime
            },
            {
              title: "Thao tác",
              width: 140,
              render: (_, record) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openEditCopy(record)} />
                  <Popconfirm
                    title="Xóa bản sao?"
                    description="Chỉ xóa được bản sao chưa có lịch sử mượn."
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => deleteCopy(record)}
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
        open={modalOpen}
        title={editingCopy ? "Sửa bản sao" : "Thêm bản sao"}
        okText={editingCopy ? "Cập nhật" : "Thêm"}
        cancelText="Hủy"
        confirmLoading={saving}
        onCancel={() => {
          setModalOpen(false);
          setEditingCopy(null);
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "AVAILABLE", condition: "GOOD" }}
          onFinish={saveCopy}
        >
          <Form.Item
            name="barcode"
            label="Barcode"
            rules={[{ required: true, message: "Nhập barcode bản sao." }]}
          >
            <Input placeholder="VD: BOOK-1006-001" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select
              disabled={copyStatusManagedByLoan}
              onChange={syncCopyConditionByStatus}
              options={copyStatusManagedByLoan
                ? [{ label: `${editingCopy.status} (theo đơn mượn)`, value: editingCopy.status }]
                : COPY_STATUS_OPTIONS}
            />
          </Form.Item>
          <Form.Item name="condition" label="Tình trạng" rules={[{ required: true }]}>
            <Select
              disabled={copyStatusManagedByLoan}
              onChange={syncCopyStatusByCondition}
              options={COPY_CONDITION_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default function Books() {
  const [filtersForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [booksPage, setBooksPage] = useState(EMPTY_PAGE);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [editingMedia, setEditingMedia] = useState([]);
  const [previewBook, setPreviewBook] = useState(null);
  const [previewMedia, setPreviewMedia] = useState([]);

  async function loadBooks(nextFilters = DEFAULT_FILTERS) {
    setLoading(true);

    try {
      const [authorList, categoryList, publisherList, pageData] = await Promise.all([
        libraryApi.authors.list(),
        libraryApi.categories.list(),
        libraryApi.publishers.list(),
        libraryApi.books.list({
          ...nextFilters,
          available:
            nextFilters.available === undefined ? undefined : nextFilters.available === "true",
          status: nextFilters.status || "ALL"
        })
      ]);

      setAuthors(Array.isArray(authorList) ? authorList : []);
      setCategories(Array.isArray(categoryList) ? categoryList : []);
      setPublishers(Array.isArray(publisherList) ? publisherList : []);
      setBooksPage(pageData || EMPTY_PAGE);
      setFilters(nextFilters);
      filtersForm.setFieldsValue(nextFilters);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks(DEFAULT_FILTERS);
  }, []);

  async function openCreateModal() {
    setEditingBook(null);
    setEditingMedia([]);
    setModalOpen(true);
  }

  async function openEditModal(record) {
    setEditingBook(mapBookToForm(record));
    setModalOpen(true);

    try {
      const mediaData = await libraryApi.media.byBook(record.id);
      setEditingMedia(Array.isArray(mediaData) ? mediaData : []);
    } catch {
      setEditingMedia([]);
    }
  }

  async function openPreviewDrawer(record) {
    setPreviewBook(record);

    try {
      const mediaData = await libraryApi.media.byBook(record.id);
      setPreviewMedia(Array.isArray(mediaData) ? mediaData : []);
    } catch {
      setPreviewMedia([]);
    }
  }

  async function handleSave(values) {
    setSaving(true);

    try {
      const requestPayload = normalizeBookPayload(values);
      const savedBook = editingBook?.id
        ? await libraryApi.books.update(editingBook.id, requestPayload)
        : await libraryApi.books.create(requestPayload);

      if (values.coverFile) {
        await libraryApi.media.upload(savedBook.id, values.coverFile, true);
      }

      for (const file of values.resourceFiles || []) {
        await libraryApi.media.upload(savedBook.id, file, false);
      }

      message.success(editingBook?.id ? "Cập nhật sách thành công." : "Tạo sách thành công.");
      setModalOpen(false);
      setEditingBook(null);
      setEditingMedia([]);
      await loadBooks(filters);

      if (previewBook?.id === savedBook.id) {
        openPreviewDrawer(savedBook);
      }
    } catch (error) {
      message.error(error.message);
      throw error;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      await libraryApi.books.remove(record.id);
      message.success("Đã xóa sách.");
      setPreviewBook((current) => (current?.id === record.id ? null : current));
      loadBooks(filters);
    } catch (error) {
      message.error(error.message);
    }
  }

  async function handleRemoveMedia(asset) {
    try {
      await libraryApi.media.remove(asset.id);
      message.success("Đã xóa media.");

      if (editingBook?.id) {
        const mediaData = await libraryApi.media.byBook(editingBook.id);
        setEditingMedia(Array.isArray(mediaData) ? mediaData : []);
      }

      if (previewBook?.id) {
        const mediaData = await libraryApi.media.byBook(previewBook.id);
        setPreviewMedia(Array.isArray(mediaData) ? mediaData : []);
      }

      loadBooks(filters);
    } catch (error) {
      message.error(error.message);
    }
  }

  const coverUrl = toAbsoluteMediaUrl(
    previewMedia.find((asset) => asset.primary)?.fileUrl || previewBook?.primaryImageUrl
  );

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Catalog"
        title="Quản lý sách"
        description="Quản lý thông tin sách, bộ lọc, tồn kho và media đính kèm."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Thêm sách
          </Button>
        }
      />

      <Tabs
        items={[
          {
            key: "books",
            label: "Danh sách sách",
            children: (
              <>
      <Card className="glass-card">
        <Form
          form={filtersForm}
          layout="vertical"
          onFinish={(values) => loadBooks({ ...DEFAULT_FILTERS, ...values, page: 0, size: filters.size })}
        >
          <Space wrap style={{ width: "100%" }} align="end">
            <Form.Item name="keyword" label="Từ khóa" style={{ minWidth: 260 }}>
              <Input prefix={<SearchOutlined />} placeholder="Tên sách hoặc ISBN" />
            </Form.Item>
            <Form.Item name="authorId" label="Tác giả" style={{ minWidth: 180 }}>
              <Select allowClear options={asSelectOptions(authors)} />
            </Form.Item>
            <Form.Item name="categoryId" label="Danh mục" style={{ minWidth: 180 }}>
              <Select allowClear options={asSelectOptions(categories)} />
            </Form.Item>
            <Form.Item name="publisherId" label="Nhà xuất bản" style={{ minWidth: 180 }}>
              <Select allowClear options={asSelectOptions(publishers)} />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" style={{ minWidth: 160 }}>
              <Select
                options={[
                  { label: "Tất cả", value: "ALL" },
                  { label: "ACTIVE", value: "ACTIVE" },
                  { label: "ARCHIVED", value: "ARCHIVED" }
                ]}
              />
            </Form.Item>
            <Form.Item name="available" label="Tình trạng" style={{ minWidth: 160 }}>
              <Select
                allowClear
                options={[
                  { label: "Còn sách", value: "true" },
                  { label: "Hết sách", value: "false" }
                ]}
              />
            </Form.Item>
            <Button htmlType="submit" type="primary">
              Lọc
            </Button>
            <Button
              onClick={() => {
                filtersForm.resetFields();
                loadBooks(DEFAULT_FILTERS);
              }}
            >
              Xóa lọc
            </Button>
          </Space>
        </Form>
      </Card>

      <Card className="glass-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={booksPage.items}
          pagination={false}
          columns={[
            {
              title: "Sách",
              sorter: true,
              dataIndex: "title",
              render: (_, record) => (
                <Space align="start">
                  {record.primaryImageUrl ? (
                    <img src={toAbsoluteMediaUrl(record.primaryImageUrl)} alt={record.title} className="book-cover" />
                  ) : (
                    <div className="book-fallback">No Cover</div>
                  )}
                  <Space direction="vertical" size={2}>
                    <Typography.Text strong>{record.title}</Typography.Text>
                    <Typography.Text type="secondary">
                      {(record.authors || []).map((author) => author.name).join(", ")}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {record.publisherName || "-"} • {record.publishYear || "-"}
                    </Typography.Text>
                  </Space>
                </Space>
              )
            },
            {
              title: "Danh mục",
              render: (_, record) => (record.categories || []).map((category) => category.name).join(", ")
            },
            {
              title: "Tồn kho",
              sorter: true,
              render: (_, record) => `${formatNumber(record.stockAvailable)} / ${formatNumber(record.stockTotal)}`
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              render: (value, record) => renderBookStatusTag(value, record.stockAvailable)
            },
            {
              title: "Thao tác",
              render: (_, record) => (
                <Space className="table-actions">
                  <Button icon={<EyeOutlined />} onClick={() => openPreviewDrawer(record)} />
                  <Button onClick={() => openEditModal(record)}>Sửa</Button>
                  <Popconfirm
                    title="Xóa sách?"
                    description="Hành động này sẽ xóa dữ liệu sách khỏi hệ thống."
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

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
          <Pagination
            current={booksPage.page + 1}
            total={booksPage.totalItems}
            pageSize={booksPage.size}
            showSizeChanger={false}
            onChange={(page) => loadBooks({ ...filters, page: page - 1 })}
          />
        </div>
      </Card>

      <BookFormModal
        open={modalOpen}
        loading={saving}
        authors={authors}
        categories={categories}
        publishers={publishers}
        initialValues={editingBook}
        existingMedia={editingMedia}
        onCancel={() => {
          setModalOpen(false);
          setEditingBook(null);
          setEditingMedia([]);
        }}
        onSubmit={handleSave}
        onRemoveMedia={handleRemoveMedia}
      />

      <Drawer
        open={Boolean(previewBook)}
        width={560}
        title={previewBook?.title}
        onClose={() => {
          setPreviewBook(null);
          setPreviewMedia([]);
        }}
      >
        {previewBook ? (
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            {coverUrl ? (
              <img src={coverUrl} alt={previewBook.title} className="book-cover-lg" />
            ) : (
              <div className="book-fallback-lg">Chưa có ảnh bìa</div>
            )}

            <Descriptions column={1} size="small">
              <Descriptions.Item label="ISBN">{previewBook.isbn || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tác giả">
                {(previewBook.authors || []).map((author) => author.name).join(", ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">
                {(previewBook.categories || []).map((category) => category.name).join(", ") || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Ngôn ngữ">{previewBook.languageCode || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tồn kho">
                {formatNumber(previewBook.stockAvailable)} / {formatNumber(previewBook.stockTotal)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{formatDateTime(previewBook.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="Mô tả">
              <Typography.Paragraph style={{ marginBottom: 0 }}>
                {previewBook.description || "Chưa có mô tả."}
              </Typography.Paragraph>
            </Card>

            <Card size="small" title="Media">
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {previewMedia.length ? (
                  previewMedia.map((asset) => (
                    <div key={asset.id} className="file-tile">
                      <div>
                        <Typography.Text strong>{asset.fileName}</Typography.Text>
                        <br />
                        <Typography.Text type="secondary">
                          {asset.assetType} • {formatDateTime(asset.createdAt)}
                        </Typography.Text>
                      </div>
                      <Space>
                        <a href={toAbsoluteMediaUrl(asset.fileUrl)} target="_blank" rel="noreferrer">
                          Mở
                        </a>
                        <Button danger type="text" onClick={() => handleRemoveMedia(asset)}>
                          Xóa
                        </Button>
                      </Space>
                    </div>
                  ))
                ) : (
                  <div className="route-empty">Chưa có media đính kèm.</div>
                )}
              </Space>
            </Card>
          </Space>
        ) : null}
      </Drawer>
              </>
            )
          },
          {
            key: "copies",
            label: "Bản sao",
            children: <BookCopiesPanel onStockChanged={() => loadBooks(filters)} />
          }
        ]}
      />
    </div>
  );
}
