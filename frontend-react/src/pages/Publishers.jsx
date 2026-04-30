import { Tag } from "antd";
import EntityCrudPage from "../components/EntityCrudPage";
import { formatDate, formatNumber } from "../components/formatters";
import { libraryApi } from "../api/libraryApi";

export default function Publishers() {
  return (
    <EntityCrudPage
      eyebrow="Catalog"
      title="Quản lý nhà xuất bản"
      description="Quản lý danh sách nhà xuất bản và số đầu sách đang liên kết."
      entityLabel="nhà xuất bản"
      searchPlaceholder="Tìm theo tên nhà xuất bản"
      loadItems={() => libraryApi.publishers.list()}
      saveItem={(values, record) =>
        record
          ? libraryApi.publishers.update(record.id, values)
          : libraryApi.publishers.create(values)
      }
      deleteItem={(record) => libraryApi.publishers.remove(record.id)}
      columns={[
        {
          title: "Tên nhà xuất bản",
          dataIndex: "name"
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
          label: "Tên nhà xuất bản",
          placeholder: "Nhập tên nhà xuất bản",
          rules: [{ required: true, message: "Nhập tên nhà xuất bản" }]
        }
      ]}
    />
  );
}
