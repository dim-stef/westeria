document.addEventListener("DOMContentLoaded", function(event) {
        jsPlumb.ready(function() {
            jsPlumb.connect({
                connector: [ "Flowchart" ], source:"{{ child.parents.first }}", target:"{{ child }}", anchor: ["Bottom", "Top"], endpoint:"Blank",
            });
    });
});