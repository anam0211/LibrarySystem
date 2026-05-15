import { Tag } from "antd";
import EntityCrudPage from "../components/EntityCrudPage";
import { formatCurrency, formatNumber } from "../components/formatters";
import { apiClient } from "../api/apiClient";

export default function AdminMemberships() {
  return (
    <EntityCrudPage
      eyebrow="Admin"
      title="Quản lý gói hội viên"
      description="Thêm, sửa, xóa các gói thành viên và cấu hình quyền lợi tương ứng."
      entityLabel="gói hội viên"
      searchPlaceholder="Tìm theo tên hoặc mã gói"
      loadItems={async () => {
        const res = await apiClient.get('/memberships');
        const payload = res.data || res;
        return Array.isArray(payload) ? payload : (payload?.result || []);
      }}
      saveItem={async (values, record) => {
        if (record) {
          const res = await apiClient.put(`/memberships/${record.id}`, values);
          return res.data || res;
        } else {
          const res = await apiClient.post('/memberships', values);
          return res.data || res;
        }
      }}
      deleteItem={async (record) => {
        await apiClient.delete(`/memberships/${record.id}`);
      }}
      columns={[
        { title: "Mã gói", dataIndex: "code", render: (val) => <Tag color="blue">{val}</Tag> },
        { title: "Tên gói", dataIndex: "name", render: (val) => <strong>{val}</strong> },
        { title: "Giá/tháng", dataIndex: "pricePerMonth", render: (val) => <span style={{ color: "#1677ff", fontWeight: 500 }}>{formatCurrency(val)}</span> },
        { title: "Sách tối đa", dataIndex: "maxBorrowLimit", render: (val) => `${formatNumber(val)} cuốn` },
        { title: "Phí giao", dataIndex: "deliveryFee", render: (val) => val === 0 ? <Tag color="gold">Miễn phí</Tag> : formatCurrency(val) },
        { title: "Ưu tiên", dataIndex: "priorityProcessing", render: (val) => val ? <Tag color="green">Có</Tag> : <Tag>Không</Tag> }
      ]}
      fields={[
        { 
          name: "code", label: "Mã gói (Code)", 
          placeholder: "VD: PREMIUM, STUDENT", 
          rules: [{ required: true, message: "Vui lòng nhập mã gói" }] 
        },
        { 
          name: "name", label: "Tên hiển thị", 
          placeholder: "VD: Gói Sinh Viên", 
          rules: [{ required: true, message: "Vui lòng nhập tên gói" }] 
        },
        { 
          name: "pricePerMonth", label: "Giá mỗi tháng (VNĐ)", 
          placeholder: "VD: 49000", 
          rules: [{ required: true, message: "Vui lòng nhập giá tiền" }] 
        },
        { 
          name: "maxBorrowLimit", label: "Số sách mượn tối đa", 
          placeholder: "VD: 6", 
          rules: [{ required: true, message: "Vui lòng nhập số sách tối đa" }] 
        },
        { 
          name: "deliveryFee", label: "Phí giao hàng (VNĐ)", 
          placeholder: "Nhập 0 nếu miễn phí", 
          rules: [{ required: true, message: "Vui lòng nhập phí giao hàng" }] 
        },
        {
          name: "priorityProcessing",
          label: "Ưu tiên xử lý đơn",
          type: "select",
          options: [
            { label: "Có (Ưu tiên)", value: true },
            { label: "Không", value: false }
          ],
          rules: [{ required: true, message: "Vui lòng chọn trạng thái ưu tiên" }]
        },
        { 
          name: "benefitsDescription", label: "Mô tả quyền lợi", 
          type: "textarea", 
          placeholder: "VD: Miễn phí giao hàng, mượn tối đa 6 cuốn..." 
        }
      ]}
      transformValues={(values) => ({
        ...values,
        pricePerMonth: Number(values.pricePerMonth || 0),
        maxBorrowLimit: Number(values.maxBorrowLimit || 0),
        deliveryFee: Number(values.deliveryFee || 0),
      })}
    />
  );
}