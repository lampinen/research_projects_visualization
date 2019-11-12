//Takes the projects array, adds IDs to it, and builds a corresponding array for the attributes
function build_graph(projects) {
    var attributes_seen = [];
    var attributes = [];
    var links = [];
    var num_projects = projects.length;
    var attribute_indices = {};
    var attribute_id = num_projects;
    for (var i=0; i < num_projects; i++) {
        projects[i].id = i;
        projects[i].type = "project";
        for (var j=0; j < projects[i].attributes.length; j++){
            var this_attribute = projects[i].attributes[j];
            if (!attributes_seen.includes(this_attribute)) {
                attributes_seen.push(this_attribute);
                attributes.push({
                    id: attribute_id,
                    name: this_attribute,
                    type: "attribute"
                });
                attribute_indices[this_attribute] = attribute_id;
                attribute_id++;
            }
            links.push([i, attribute_indices[this_attribute]])
        }
    }
    return {nodes: projects.concat(attributes),
            links: links};
}


function display_graph(graph) {
    var svg = d3
        .select("#svg-container")
        .append("svg")
        .attr("width", 1024)
        .attr("height", 1024);
}
