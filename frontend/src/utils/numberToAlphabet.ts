const numberToAlphabet = (num: number) => {
  num--;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return alphabet[num];
};

export default numberToAlphabet;
