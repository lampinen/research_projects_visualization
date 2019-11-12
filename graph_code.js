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
            links.push({source: i, target: attribute_indices[this_attribute]})
        }
    }
    return {nodes: projects.concat(attributes),
            edges: links};
}


function display_graph(raw_data) {
    //Some code cannabalized from https://www.d3-graph-gallery.com/graph/network_basic.html
    const width = 1024;
    const height = 1024;
    const radius = height/32;
    const fontsize = "32pt";
    const text_dx = -radius/3;
    const text_dy = radius/2;

    const colors = {project: "#6600CC", 
                    attribute: "#00CC00"};

    const font_colors = {project: "FFFFFF", 
                         attribute: "#000000"};

    const positions = {project: 3 * width / 4, 
                       attribute: width / 4};

    var data = build_graph(raw_data);
    var num_nodes = data.length;

    var svg = d3
        .select("#svg-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // gradient for edges
    var svgDefs = svg.append("defs");
    var edgeGradient = svgDefs.append("linearGradient")
        .attr("id", "edgeGradient");

    edgeGradient.append("stop")
        .attr("class", "start")
        .attr("offset", "0%")
        .attr("stop-color", colors.attribute);

    edgeGradient.append("stop")
        .attr("class", "end")
        .attr("offset", "100%")
        .attr("stop-color", colors.project);

    // edge and node styles
    var link = svg.append("g")
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
            .attr("stroke-width", radius/8)
            .style("stroke", "url(#edgeGradient)")

    var node = svg.append("g")
        .selectAll(".node")
        .data(data.nodes)
        .enter()
        .append("g")


    var node_circles = node
      .append("circle")
          .attr("r", radius)
          .style("fill", d => colors[d.type])

    var node_text = node
        .append("text")
            .attr("font-size", fontsize)
            .text(d => d.id)
              .style("fill", d => font_colors[d.type])

    var simulation = d3.forceSimulation(data.nodes)                 
        .force("x", d3.forceX().x(d => positions[d.type]))
        .force("link", d3.forceLink()                               // This force provides links between nodes
              .id(function(d) { return d.id; })                     // This provide  the id of a node
              .links(data.edges)                                    // and this the list of links
              .strength(0.01)
        )
        .force("charge", d3.forceManyBody().strength(-300))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .on("end", ticked);
        
        
    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
      });

    }

}
