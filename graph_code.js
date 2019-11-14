//Takes the projects array, adds IDs to it, and builds a corresponding array for the attributes
function build_graph(projects) {
    var attributes_seen = [];
    var attributes = [];
    var links = [];
    var num_projects = projects.length;
    var attribute_indices = {};
    var node_id = 0;
    for (var i=0; i < num_projects; i++) {
        projects[i].id = node_id;
        var this_project_id = node_id;
        node_id++;
        projects[i].type = "project";
        for (var j=0; j < projects[i].attributes.length; j++){
            var this_attribute = projects[i].attributes[j];
            if (!attributes_seen.includes(this_attribute)) {
                attributes_seen.push(this_attribute);
                attributes.push({
                    id: node_id,
                    name: this_attribute,
                    type: "attribute"
                });
                attribute_indices[this_attribute] = node_id;
                node_id++;
            }
            links.push({source: this_project_id, target: attribute_indices[this_attribute]})
        }
    }
    return {nodes: projects.concat(attributes),
            edges: links};
}


function display_graph(raw_data) {
    //Some code cannabalized from https://www.d3-graph-gallery.com/graph/network_basic.html
    const width = 2048;
    const height = 2048;
    const radius_y = height/32;
    const radius_x = width/8;
    const fontsize = "32pt";

    const colors = {project: "#6600CC", 
                    attribute: "#00DD22"};

    const font_colors = {project: "FFFFFF", 
                         attribute: "#000000"};

    const positions = {project: 5 * width / 6, 
                       attribute: width / 6};

    var data = build_graph(raw_data);
    var num_nodes = data.length;

    // node initial positions and settings
    data.nodes.forEach(function(d, i) {
        d.y = (height/num_nodes) * i;
        d.x = positions[d.type]; 
        d.opaque = true;
      });

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
            .attr("stroke-width", radius_y/8)
            .style("stroke", "url(#edgeGradient)");

    var node = svg.append("g")
        .selectAll(".node")
        .data(data.nodes)
        .enter()
        .append("g")
        .on("mousedown", highlight_node);

    var node_ellipses = node
//      .append("circle")
//          .attr("r", radius)
      .append("ellipse")
          .attr("rx", radius_x)
          .attr("ry", radius_y)
          .style("fill", d => colors[d.type]);

    var node_text = node
        .append("text")
            .attr("font-size", fontsize)
            .text(d => d.name)
              .style("fill", d => font_colors[d.type]);

    var node_covers = node
      .append("ellipse")
          .attr("rx", radius_x)
          .attr("ry", radius_y)
          .style("fill", "#FFFFFF")
          .attr("opacity", 0);

    var simulation = d3.forceSimulation(data.nodes)                 
        .force("x", d3.forceX().x(d => positions[d.type]).strength(0.3))
        .force("link", d3.forceLink()                               // This force provides links between nodes
              .id(function(d) { return d.id; })                     // This provide  the id of a node
              .links(data.edges)                                    // and this the list of links
              .distance(0.5 * width)
              .strength(0.01)
        )
        .force("charge", d3.forceManyBody().strength(-2000).distanceMax(height/15))         // This adds repulsion between nodes. Play with the -400 for the repulsion strength
        .force("center", d3.forceCenter(width / 2, height / 2))     // This force attracts nodes to the center of the svg area
        .on("end", ticked);
        
        
    // This function is run at each iteration of the force algorithm, updating the nodes position.
    function ticked() {
      link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .attr("opacity", function(d) {
                  if (d.source.opaque & d.target.opaque) {
                      return 1.;
                  } 
                  return 0.2;
              });

      node.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
      });
//          .attr("opacity", function(d) {
//                  if (d.opaque) {
//                      return 1.;
//                  } 
//                  return 0.2;
//              });

      node_covers.attr("opacity", function(d) {
          if (d.opaque) {
            return 0;
          }
          return 0.8;
      });
    }

    var currently_highlighted = -1;
    // animation & interaction
    function highlight_node(d) {
        if (currently_highlighted === d.id) {
            dehighlight();
            return;
        }
        var this_node = d;
        var this_node_id = this_node.id;

        var adjacent = []; 
        for (var i=0; i < data.edges.length; i++) {
            if (data.edges[i].source == this_node) {
                adjacent.push(data.edges[i].target.id);
            }
            else if (data.edges[i].target == this_node) {
                adjacent.push(data.edges[i].source.id);
            }
        }
        for (var i=0; i < data.nodes.length; i++) {
            if (adjacent.includes(data.nodes[i].id)) {
                data.nodes[i].opaque = true;
            } else {
                data.nodes[i].opaque = false;
            }
        }
        this_node.opaque = true;
        currently_highlighted = d.id;
        ticked(); // update
    }

    function dehighlight() {
        data.nodes.forEach(function(d, i) {
            d.opaque = true;
          });
        currently_highlighted = false;
        ticked(); // update
    }


}
