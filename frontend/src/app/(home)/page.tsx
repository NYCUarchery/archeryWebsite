"use client";
import Grid from "@mui/material/Grid2";

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
import { useRouter } from "next/navigation";
import { useGetUserId } from "@/utils/QueryHooks/useGetUserID";

const Homepage = () => {
  const rows: any = [];
  const router = useRouter();
  const { isError: isUserError, isSuccess: isUserSuccess } = useGetUserId();

  if (isUserError) {
    router.push("/login");
  }

  return (
    <Card sx={{ p: 2, mt: 2, width: "600px" }}>
      <CardContent>
        <Box>
          <Grid container direction="column">
            <Grid>
              <Box justifyContent={"center"} display={"flex"}>
                <Typography variant="h6" component="div">
                  公告欄
                </Typography>
              </Box>
            </Grid>

            {isUserSuccess ? <Grid>看到這個就是成功登入了呦～</Grid> : <></>}
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
