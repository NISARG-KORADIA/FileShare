const useIdGenerator = (length) => {
  var result = "";
  var characters = "abcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * 26));
  }
  return result;
}

export default useIdGenerator