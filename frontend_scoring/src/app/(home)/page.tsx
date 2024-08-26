import Grid from "@mui/material/Grid";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const Homepage = () => {
  const rows: any = [];

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <CardContent>
        <Box>
          <Grid container justifyContent="center">
            <Grid item>
              <Typography variant="h6" component="div">
                公告欄
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Box sx={{ mt: 2 }}>
          <TableContainer component={Paper}>
            <Table aria-label="table">
              <TableBody>
                {rows?.map((v: any, i: any) => (
                  <TableRow
                    hover={true}
                    key={i}
                    sx={{
                      "&:last-child td, &:last-child th": { border: 0 },
                      "&.MuiTableRow-hover:hover": { cursor: "pointer" },
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {v.title}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Homepage;
