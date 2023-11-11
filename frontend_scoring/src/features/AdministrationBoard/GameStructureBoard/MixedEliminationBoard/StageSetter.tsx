import { Box, Chip, TextField, Button } from "@mui/material";

export default function StagesNumSetter() {
  return (
    <Box sx={{ display: "flex" }}>
      <Chip label="Stages: " />
      <TextField
        id="stages_num_setter"
        label="Set Number of Stages "
        variant="outlined"
      />
      <Button>Set</Button>
    </Box>
  );
}
