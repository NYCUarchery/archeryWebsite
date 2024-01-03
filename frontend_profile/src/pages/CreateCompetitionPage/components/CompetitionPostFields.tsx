import React, { useState } from "react";
import { TextField, Button, Box } from "@mui/material";
import { DatePicker } from "@mui/lab";
import { PostCompetitionBody } from "../types/PostCompetitionBody";
import { Signal } from "@preact/signals-react";

type Props = {
  postBody: Signal<PostCompetitionBody>;
};

export default function CompetitionPostFields({ postBody }: Props) {
  const handleFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    console.log(postBody.value);
    postBody.value = { ...postBody.value, [name]: value };
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Use the postBody.value object to create the desired object of type PostCompetitionBody
    console.log(postBody.value);
  };

  return (
    <Box>
      <TextField
        name="title"
        label="Title"
        value={postBody.value.title}
        onChange={handleFieldChange}
      />
      <TextField
        name="sub_title"
        label="Sub Title"
        value={postBody.value.sub_title}
        onChange={handleFieldChange}
      />
      <TextField
        name="host_id"
        label="Host ID"
        type="number"
        value={postBody.value.host_id}
        onChange={handleFieldChange}
      />
      <TextField
        name="rounds_num"
        label="Rounds Number"
        type="number"
        value={postBody.value.rounds_num}
        onChange={handleFieldChange}
      />
      <TextField
        name="lanes_num"
        label="Lanes Number"
        type="number"
        value={postBody.value.lanes_num}
        onChange={handleFieldChange}
      />
      <TextField
        name="script"
        label="Script"
        value={postBody.value.script}
        onChange={handleFieldChange}
      />

      <DatePicker
        name="date"
        label="Date"
        value={postBody.value.date}
        onChange={handleFieldChange}
      />
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </Box>
  );
}
