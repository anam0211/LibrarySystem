import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message
} from "antd";
import { useEffect, useState } from "react";
import PageHeader from "./PageHeader";

function renderFormField(field) {
  if (field.type === "textarea") {
    return <Input.TextArea rows={4} placeholder={field.placeholder} />;
  }

  if (field.type === "number") {
    return <InputNumber style={{ width: "100%" }} min={field.min} max={field.max} />;
  }

  if (field.type === "select") {
    return (
      <Select
        mode={field.mode}
        options={field.options || []}
        placeholder={field.placeholder}
        allowClear={field.allowClear}
      />
    );
  }

  return <Input placeholder={field.placeholder} />;
}

export default function EntityCrudPage({
  eyebrow,
  title,
  description,
  entityLabel,
  columns,
  fields,
  loadItems,
  saveItem,
  deleteItem,
  searchPlaceholder,
  searchKeys = ["name"],
  mapInitialValues = (record) => record || {},
  transformValues = (values) => values,
  summary,
  rowKey = "id"
}) {
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);

  async function fetchItems() {
    setLoading(true);

    try {
      const nextItems = await loadItems();
      setItems(Array.isArray(nextItems) ? nextItems : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  const resolvedFields = typeof fields === "function" ? fields(items, editingRecord) : fields;
  const filteredItems = items.filter((item) =>
    searchKeys.some((key) => String(item?.[key] || "").toLowerCase().includes(keyword.toLowerCase()))
  );

  async function handleSubmit() {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await saveItem(transformValues(values, editingRecord), editingRecord);
      message.success(`${editingRecord ? "Cập nhật" : "Tạo mới"} ${entityLabel} thành công.`);
      setModalOpen(false);
      setEditingRecord(null);
      form.resetFields();
      fetchItems();
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      message.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    try {
      await deleteItem(record);
      message.success(`Đã xóa ${entityLabel}.`);
      fetchItems();
    } catch (error) {
      message.error(error.message);
    }
  }

  function openCreateModal() {
    setEditingRecord(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEditModal(record) {
    setEditingRecord(record);
    form.setFieldsValue(mapInitialValues(record));
    setModalOpen(true);
  }

  const actionColumn = {
    title: "Thao tác",
    key: "actions",
    width: 150,
    render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => openEditModal(record)} />
        <Popconfirm
          title={`Xóa ${entityLabel}`}
          description={`Bạn có chắc muốn xóa ${entityLabel} này?`}
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => handleDelete(record)}
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    )
  };

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            Thêm {entityLabel}
          </Button>
        }
      />

      {summary ? <div className="metric-grid">{summary(items)}</div> : null}

      <Card className="glass-card">
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder={searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />

          <Table
            rowKey={rowKey}
            loading={loading}
            dataSource={filteredItems}
            columns={[...columns, actionColumn]}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        </Space>
      </Card>

      <Modal
        open={modalOpen}
        title={editingRecord ? `Chỉnh sửa ${entityLabel}` : `Tạo ${entityLabel}`}
        okText={editingRecord ? "Lưu thay đổi" : "Tạo mới"}
        cancelText="Hủy"
        onCancel={() => {
          setModalOpen(false);
          setEditingRecord(null);
          form.resetFields();
        }}
        onOk={handleSubmit}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical">
          {resolvedFields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={field.rules}
              valuePropName={field.valuePropName}
            >
              {renderFormField(field)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
