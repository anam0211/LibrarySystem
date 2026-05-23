import { InboxOutlined } from "@ant-design/icons";
import {
  Button,
  Divider,
  Form,
  Input,
  InputNumber,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
  Upload
} from "antd";
import { useEffect, useState } from "react";
import { asSelectOptions, formatDateTime } from "./formatters";

const { Dragger } = Upload;

const DEFAULT_VALUES = {
  isbn: "",
  title: "",
  subtitle: "",
  publisherId: undefined,
  publishYear: new Date().getFullYear(),
  languageCode: "vi",
  pageCount: 0,
  description: "",
  keywords: "",
  status: "ACTIVE",
  authorIds: [],
  categoryIds: []
};

export default function BookFormModal({
  open,
  loading,
  authors,
  categories,
  publishers,
  initialValues,
  existingMedia = [],
  onCancel,
  onSubmit,
  onRemoveMedia
}) {
  const [form] = Form.useForm();
  const [coverFiles, setCoverFiles] = useState([]);
  const [resourceFiles, setResourceFiles] = useState([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue({
      ...DEFAULT_VALUES,
      ...initialValues,
      publisherId: initialValues?.publisherId || undefined,
      authorIds: (initialValues?.authorIds || []).map(Number),
      categoryIds: (initialValues?.categoryIds || []).map(Number)
    });
    setCoverFiles([]);
    setResourceFiles([]);
  }, [form, initialValues, open]);

  async function handleSubmit() {
    try {
      const values = await form.validateFields();

      await onSubmit({
        ...values,
        coverFile: coverFiles[0]?.originFileObj || null,
        resourceFiles: resourceFiles.map((item) => item.originFileObj).filter(Boolean)
      });
    } catch (error) {
      if (error?.errorFields) {
        return;
      }

      if (String(error?.message || "").toLowerCase().includes("isbn")) {
        form.setFields([
          {
            name: "isbn",
            errors: [error.message]
          }
        ]);
        requestAnimationFrame(() => {
          form.scrollToField("isbn", {
            behavior: "smooth",
            block: "center"
          });
        });
      }
    }
  }

  return (
    <Modal
      open={open}
      width={920}
      title={initialValues?.id ? "Cập nhật sách" : "Tạo sách mới"}
      okText={initialValues?.id ? "Lưu sách" : "Tạo sách"}
      cancelText="Hủy"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical">
        <div className="section-grid">
          <Form.Item name="isbn" label="ISBN" rules={[{ required: true, message: "Nhập ISBN" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="title" label="Tên sách" rules={[{ required: true, message: "Nhập tên sách" }]}>
            <Input />
          </Form.Item>
        </div>

        <Form.Item name="subtitle" label="Phụ đề">
          <Input />
        </Form.Item>

        <div className="section-grid">
          <Form.Item
            name="authorIds"
            label="Tác giả"
            rules={[{ required: true, message: "Chọn ít nhất một tác giả" }]}
          >
            <Select mode="multiple" options={asSelectOptions(authors)} placeholder="Chọn tác giả" />
          </Form.Item>
          <Form.Item
            name="categoryIds"
            label="Danh mục"
            rules={[{ required: true, message: "Chọn ít nhất một danh mục" }]}
          >
            <Select mode="multiple" options={asSelectOptions(categories)} placeholder="Chọn danh mục" />
          </Form.Item>
        </div>

        <div className="section-grid">
          <Form.Item
            name="publisherId"
            label="Nhà xuất bản"
            rules={[{ required: true, message: "Chọn nhà xuất bản" }]}
          >
            <Select options={asSelectOptions(publishers)} placeholder="Chọn nhà xuất bản" />
          </Form.Item>
          <Form.Item name="publishYear" label="Năm xuất bản">
            <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div className="section-grid">
          <Form.Item name="languageCode" label="Ngôn ngữ">
            <Input />
          </Form.Item>
          <Form.Item name="pageCount" label="Số trang">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </div>

        <div className="section-grid">
          <Form.Item name="status" label="Trạng thái">
            <Select
              options={[
                { label: "ACTIVE", value: "ACTIVE" },
                { label: "ARCHIVED", value: "ARCHIVED" }
              ]}
            />
          </Form.Item>
          <Form.Item name="keywords" label="Từ khóa">
            <Input placeholder="spring, java, clean code" />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Divider>Upload media</Divider>

        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <div>
            <Typography.Text strong>Ảnh bìa</Typography.Text>
            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              fileList={coverFiles}
              onChange={({ fileList }) => setCoverFiles(fileList.slice(-1))}
              style={{ marginTop: 10 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Kéo thả hoặc chọn một ảnh bìa</p>
            </Dragger>
          </div>

          <div>
            <Typography.Text strong>Tài liệu và ảnh bổ sung</Typography.Text>
            <Dragger
              beforeUpload={() => false}
              multiple
              fileList={resourceFiles}
              onChange={({ fileList }) => setResourceFiles(fileList)}
              style={{ marginTop: 10 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Hỗ trợ ảnh, PDF, EPUB và các file bổ sung</p>
            </Dragger>
          </div>
        </Space>

        {existingMedia.length ? (
          <>
            <Divider>Media hiện có</Divider>
            <List
              className="compact-list"
              dataSource={existingMedia}
              renderItem={(asset) => (
                <List.Item
                  actions={
                    onRemoveMedia
                      ? [
                          <Button danger type="link" onClick={() => onRemoveMedia(asset)}>
                            Xóa
                          </Button>
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    title={
                      <Space wrap>
                        <span>{asset.fileName}</span>
                        {asset.primary ? <Tag color="green">Bìa</Tag> : null}
                        <Tag>{asset.assetType}</Tag>
                      </Space>
                    }
                    description={`Tải lên ${formatDateTime(asset.createdAt)}`}
                  />
                </List.Item>
              )}
            />
          </>
        ) : null}
      </Form>
    </Modal>
  );
}
