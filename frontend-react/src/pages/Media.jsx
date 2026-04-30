import { DeleteOutlined, InboxOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Form,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message
} from "antd";
import { useEffect, useState } from "react";
import { toAbsoluteMediaUrl } from "../api/apiClient";
import { libraryApi } from "../api/libraryApi";
import PageHeader from "../components/PageHeader";
import { formatDateTime } from "../components/formatters";

const { Dragger } = Upload;

export default function Media() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [books, setBooks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(undefined);

  async function loadMedia() {
    setLoading(true);

    try {
      const [bookPage, mediaData] = await Promise.all([
        libraryApi.books.list({
          page: 0,
          size: 200,
          sortBy: "title",
          sortDir: "asc"
        }),
        libraryApi.media.list()
      ]);

      setBooks(Array.isArray(bookPage?.items) ? bookPage.items : []);
      setAssets(Array.isArray(mediaData) ? mediaData : []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedia();
  }, []);

  async function handleUpload(values) {
    if (!fileList[0]?.originFileObj) {
      message.warning("Chọn file trước khi upload.");
      return;
    }

    setUploading(true);

    try {
      await libraryApi.media.upload(
        values.bookId,
        fileList[0].originFileObj,
        Boolean(values.primary)
      );
      message.success("Upload media thành công.");
      setFileList([]);
      form.resetFields();
      loadMedia();
    } catch (error) {
      message.error(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset) {
    try {
      await libraryApi.media.remove(asset.id);
      message.success("Đã xóa media.");
      loadMedia();
    } catch (error) {
      message.error(error.message);
    }
  }

  const filteredAssets = selectedBookId
    ? assets.filter((asset) => Number(asset.bookId) === Number(selectedBookId))
    : assets;

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Catalog"
        title="Quản lý media"
        description="Quản lý ảnh bìa, PDF và file bổ sung đang gắn với từng đầu sách."
      />

      <Card className="glass-card">
        <Form form={form} layout="vertical" onFinish={handleUpload}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Form.Item
              name="bookId"
              label="Chọn sách"
              rules={[{ required: true, message: "Chọn sách để gắn media" }]}
            >
              <Select
                showSearch
                options={books.map((book) => ({
                  label: book.title,
                  value: book.id
                }))}
                placeholder="Tìm sách theo tên"
              />
            </Form.Item>

            <Form.Item name="primary" valuePropName="checked">
              <Checkbox>Đặt làm ảnh bìa chính</Checkbox>
            </Form.Item>

            <Dragger
              beforeUpload={() => false}
              maxCount={1}
              fileList={fileList}
              onChange={({ fileList: nextFileList }) => setFileList(nextFileList.slice(-1))}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Kéo thả file vào đây hoặc bấm để chọn file</p>
            </Dragger>

            <Button
              htmlType="submit"
              type="primary"
              icon={<UploadOutlined />}
              loading={uploading}
            >
              Upload file
            </Button>
          </Space>
        </Form>
      </Card>

      <Card className="glass-card">
        <Space wrap style={{ marginBottom: 16 }}>
          <Typography.Text strong>Lọc theo sách:</Typography.Text>
          <Select
            allowClear
            style={{ width: 320 }}
            value={selectedBookId}
            onChange={setSelectedBookId}
            placeholder="Tất cả sách"
            options={books.map((book) => ({
              label: book.title,
              value: book.id
            }))}
          />
        </Space>

        <Table
          rowKey="id"
          loading={loading}
          dataSource={filteredAssets}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          columns={[
            {
              title: "Preview",
              render: (_, record) =>
                ["PNG", "JPG", "JPEG", "WEBP"].includes(record.assetType) ? (
                  <img
                    src={toAbsoluteMediaUrl(record.fileUrl)}
                    alt={record.fileName}
                    className="book-cover"
                  />
                ) : (
                  <div className="book-fallback">{record.assetType}</div>
                )
            },
            {
              title: "Sách",
              dataIndex: "bookTitle"
            },
            {
              title: "File",
              render: (_, record) => (
                <a href={toAbsoluteMediaUrl(record.fileUrl)} target="_blank" rel="noreferrer">
                  {record.fileName}
                </a>
              )
            },
            {
              title: "Loại",
              dataIndex: "assetType",
              render: (value) => <Tag>{value}</Tag>
            },
            {
              title: "Bìa",
              dataIndex: "primary",
              render: (value) => (value ? <Tag color="green">Primary</Tag> : "-")
            },
            {
              title: "Tạo lúc",
              dataIndex: "createdAt",
              render: formatDateTime
            },
            {
              title: "Thao tác",
              render: (_, record) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
              )
            }
          ]}
        />
      </Card>
    </div>
  );
}
