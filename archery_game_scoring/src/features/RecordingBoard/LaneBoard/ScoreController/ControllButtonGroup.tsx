import { ButtonGroup, Button } from "@mui/material";

export default function ControllButtonGroup() {
  return (
    <ButtonGroup className="controll_button_group" fullWidth>
      <Button className="confirm_button">確認</Button>
      <Button className="send_button">送出</Button>
      <Button className="cancel_button">&lt;=</Button>
    </ButtonGroup>
  );
}
