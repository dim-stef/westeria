jsPlumb.ready(function() {
    jsPlumb.connect({
        connector: [ "Flowchart" ], source:"global", target:"games", anchor: ["Bottom", "Top"], endpoint:"Blank",
    });
});