document.addEventListener("DOMContentLoaded", function(event) {
    console.log("in");
    jsPlumb.ready(function() {
        jsPlumb.setContainer("tree-container");
    });
})