import { Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function ToCreateButton() {
  const router = useRouter();

  return (
    <Button
      className="home-button-primary"
      variant="contained"
      onClick={() => router.push("/create_competition")}
    >
      創建新的比賽
    </Button>
  );
}
