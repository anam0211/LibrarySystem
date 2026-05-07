import { ShoppingCartOutlined } from "@ant-design/icons";
import { Button, Result, message } from "antd";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { libraryGateway } from "../api/libraryGateway";
import PublicShell from "../components/PublicChrome";

export default function Booking({ session, onLogout }) {
  const { bookId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function addBook() {
      await libraryGateway.addToCart(session.id, Number(bookId));
      message.success("Đã thêm sách vào giỏ mượn.");
      window.dispatchEvent(new Event("cartUpdated"));
    }

    if (session?.id && bookId) {
      addBook();
    }
  }, [session?.id, bookId]);

  return (
    <PublicShell session={session} onLogout={onLogout}>
      <Result
        icon={<ShoppingCartOutlined />}
        title="Sách đã được đưa vào giỏ mượn"
        subTitle="Tiếp tục tới checkout để chọn nhận tại quầy hoặc giao sách tận nhà."
        extra={[
          <Button type="primary" key="cart" onClick={() => navigate("/cart")}>
            Mở giỏ mượn
          </Button>,
          <Button key="home" onClick={() => navigate("/")}>
            Tiếp tục chọn sách
          </Button>
        ]}
      />
    </PublicShell>
  );
}
