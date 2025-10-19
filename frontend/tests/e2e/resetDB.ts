export default async function resetDB() {
  const response = await fetch(`http://127.0.0.1/api/test/restore`, {
    method: "PUT",
  });
  console.log(await response);
}
