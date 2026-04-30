import { Tag } from "antd";
import EntityCrudPage from "../components/EntityCrudPage";
import { formatDate, formatNumber } from "../components/formatters";
import { libraryApi } from "../api/libraryApi";

export default function Categories() {
  return (
    <EntityCrudPage
      eyebrow="Catalog"
      title="Quản lý danh mục"
      description="Quản lý nhóm phân loại, danh mục cha con và số đầu sách liên quan."
      entityLabel="danh mục"
      searchPlaceholder="Tìm theo tên danh mục"
      loadItems={() => libraryApi.categories.list()}
      saveItem={(values, record) =>
        record
          ? libraryApi.categories.update(record.id, values)
          : libraryApi.categories.create(values)
      }
      deleteItem={(record) => libraryApi.categories.remove(record.id)}
      columns={[
        {
          title: "Danh mục",
          dataIndex: "name"
        },
        {
          title: "Danh mục cha",
          dataIndex: "parentName",
          render: (value) => value || "-"
        },
        {
          title: "Danh mục con",
          dataIndex: "childCount",
          render: (value) => <Tag>{formatNumber(value)}</Tag>
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
      fields={(items, editingRecord) => [
        {
          name: "name",
          label: "Tên danh mục",
          placeholder: "Nhập tên danh mục",
          rules: [{ required: true, message: "Nhập tên danh mục" }]
        },
        {
          name: "parentId",
          label: "Danh mục cha",
          type: "select",
          allowClear: true,
          options: items
            .filter((item) => item.id !== editingRecord?.id)
            .map((item) => ({
              label: item.name,
              value: item.id
            })),
          placeholder: "Không bắt buộc"
        }
      ]}
      transformValues={(values) => ({
        ...values,
        parentId: values.parentId || null
      })}
    />
  );
}
