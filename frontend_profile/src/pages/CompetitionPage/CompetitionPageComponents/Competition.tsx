import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import JoinButton from "./JoinButton";
import { TimeView } from "../CompetitionPage";

// This component displays a single competition
export const Competition = ({
  competition,
  onJoin,
}: {
  competition: any;
  onJoin: any;
}) => (
  <Box sx={{ mb: 2 }}>
    <Divider />
    <Typography variant="body2" component="div" sx={{ fontSize: 30 }}>
      {competition.name}
    </Typography>
    <Typography variant="body2" component="div">
      {TimeView(competition.date)}
    </Typography>
    <Typography variant="body2" component="div">
      {competition.overview}
    </Typography>
    <Button
      variant="text"
      onClick={() => {
        if (competition.scoreboardURL)
          if (competition.scoreboardURL.slice(0, 4) == "http") {
            window.location.href = competition.scoreboardURL;
          } else {
            window.location.href = competition.scoreboardURL;
          }
      }}
    >
      <Typography variant="body2">
        查看記分板: {competition.scoreboardURL}
      </Typography>
    </Button>

    <Typography variant="body2" component="div">
      比賽狀況: {competition.state}
    </Typography>

    <JoinButton onJoin={onJoin} />
  </Box>
);
