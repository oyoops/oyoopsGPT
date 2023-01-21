function updateSwitchValue(elem) {
    var switchValue = elem.value;
    if (elem.checked) {
      elem.value = "150";
    } else {
      elem.value = "65";
    }
    document.getElementById("switch").value = switchValue;
};