function listValues(listObject) {
  var res = []
  for(key in listObject.val()) {
    res.unshift(listObject.val()[key]);
  }
  return res;
}

function genKey(string1, string2) {
  if(string1 < string2){
    return string1 + "_" + string2;
  } else {
    return string2 + "_" + string1;
  }
}

function fbClean(string) {
  return string.replace(/\./g,' ').replace(/\#/g,' ').replace(/\$/g,' ').replace(/\[/g,' ').replace(/\]/g,' ');
}
