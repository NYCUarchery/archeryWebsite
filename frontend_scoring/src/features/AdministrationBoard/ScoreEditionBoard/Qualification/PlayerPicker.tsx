import { Card, Autocomplete, TextField } from "@mui/material";

import useGetGroupsWithPlayers from "../../../../QueryHooks/useGetGroupsWithPlayers";

import { useSelector } from "react-redux";

import { useEffect, useState } from "react";

export default function PlayerPicker() {
  const competitionID = useSelector((state: any) => state.game.competitionID);
  const { data: groups, isLoading } = useGetGroupsWithPlayers(competitionID);
  const [groupOption, setGroupOption] = useState({ label: "", id: 0 });
  const [playersOptions, setPlayersOptions] = useState([{ label: "", id: 0 }]);
  const [playerOption, setPlayerOption] = useState({ label: "", id: 0 });

  if (isLoading || !groups) return <Card>載入中</Card>;

  const groupOptions = groups.map((group, index) => {
    if (index === 0) return;
    return { label: group.group_name, id: group.id };
  });

  useEffect(() => {
    const players = groups.find(
      (group) => group.id === groupOption.id
    )?.players;
    const options =
      players?.map((player) => {
        return { label: player.name, id: player.id };
      }) ?? [];
    setPlayersOptions(options);
  }, [groupOption]);

  return (
    <Card sx={{ padding: 4 }}>
      <Autocomplete
        sx={{ marginBottom: 2 }}
        options={groupOptions}
        defaultValue={groupOptions[0] ?? { label: "", id: 0 }}
        getOptionLabel={(option) => option?.label ?? ""}
        value={groupOption}
        onChange={(_e, newValue) =>
          setGroupOption(newValue ?? { label: "", id: 0 })
        }
        renderInput={(params) => (
          <TextField {...params} variant="standard" placeholder="組別" />
        )}
        disableClearable
      />
      <Autocomplete
        options={playersOptions}
        defaultValue={playersOptions[0] ?? { label: "", id: 0 }}
        value={playerOption}
        onChange={(_e, newValue) =>
          setPlayerOption(newValue ?? { label: "", id: 0 })
        }
        renderInput={(params) => (
          <TextField {...params} variant="standard" placeholder="選手" />
        )}
        disableClearable
      />
    </Card>
  );
}
