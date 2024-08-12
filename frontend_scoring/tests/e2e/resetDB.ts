export default async function resetDB() {
  const response = await fetch(`http://localhost/api/test/restore`, {
    method: "PUT",
  });
  console.log(await response);
}
