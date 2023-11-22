import { Button, ButtonGroup } from "@mui/material";
import { useMutation } from "react-query";
import axios from "axios";

export default function EndSwitch() {
  return (
    <ButtonGroup fullWidth>
      <Button>&lt;</Button>
      <Button>&gt;</Button>
    </ButtonGroup>
  );
}
