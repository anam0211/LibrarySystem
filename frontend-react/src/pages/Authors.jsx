import { Tag } from "antd";
import EntityCrudPage from "../components/EntityCrudPage";
import { formatDate, formatNumber } from "../components/formatters";
import { libraryApi } from "../api/libraryApi";

export default function Authors() {
  return (
    <EntityCrudPage
      eyebrow="Catalog"
      title="Quản lý tác giả"
      description="Quản lý hồ sơ tác giả và số đầu sách đang liên kết."
      entityLabel="tác giả"
      searchPlaceholder="Tìm theo tên tác giả"
      loadItems={() => libraryApi.authors.list()}
      saveItem={(values, record) =>
        record ? libraryApi.authors.update(record.id, values) : libraryApi.authors.create(values)
      }
      deleteItem={(record) => libraryApi.authors.remove(record.id)}
      columns={[
        {
          title: "Tên tác giả",
          dataIndex: "name"
        },
        {
          title: "Bio",
          dataIndex: "bio",
          render: (value) => value || "-"
        },
        {
          title: "Đầu sách",
          dataIndex: "bookCount",
          render: (value) => <Tag color="green">{formatNumber(value)}</Tag>
        },
        {
          title: "Tạo lúc",
          dataIndex: "createdAt",
          render: formatDate
        }
      ]}
      fields={[
        {
          name: "name",
          label: "Tên tác giả",
          placeholder: "Nhập tên tác giả",
          rules: [{ required: true, message: "Nhập tên tác giả" }]
        },
        {
          name: "bio",
          label: "Tiểu sử",
          type: "textarea",
          placeholder: "Giới thiệu ngắn về tác giả"
        }
      ]}
    />
  );
}
