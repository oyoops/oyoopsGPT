function updateSwitchValue(elem) {
    console.log("Called")
    var switchValue = elem.value;
    if (elem.checked) {
      elem.value = "150";
    } else {
      elem.value = "65";
    }
    console.log("Called -- " + elem.value)
    document.getElementById("switch").value = switchValue;
};