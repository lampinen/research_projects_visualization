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
                    url: "",
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
    const width = 1300;
    const height = 1300;
    const length_scale = 700;
    const radius_y = length_scale/24;
    const radius_x = length_scale/5;
    const collide_radius = length_scale/8;
    const fontsize = "15pt";

    const colors = {project: "#6600CC", 
                    attribute: "#00DD22"};

    const font_colors = {project: "#FFFFFF", 
                         attribute: "#000000"};

    const positions = {project: width - length_scale / 3, 
                       attribute: length_scale / 3};

    const radii = {opaque: length_scale / 6, 
                   transparent: length_scale / 1.2};

    var data = build_graph(raw_data);
    var num_nodes = data.length;
    var currently_highlighted = -1;

    // node initial positions and settings
    function set_initial_positions() {
        data.nodes.forEach(function(d, i) {
            d.y = (height/num_nodes) * i;
            d.x = positions[d.type]; 
            d.opaque = true;
          });
    }

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
        .on("mousedown", node_click);

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


    set_initial_positions();
    var simulation = d3.forceSimulation(data.nodes)                 
        .force("x", d3.forceX().x(d => positions[d.type]).strength(0.3))
        .force("link", d3.forceLink()                               
              .id(function(d) { return d.id; })                    
              .links(data.edges)                                    
              .distance(0.6 * length_scale)
              .strength(0.02)
        )
        .force("charge", d3.forceManyBody().strength(-80).distanceMax(length_scale/8))   
        .force("collide", d3.forceCollide().strength(0.2).radius(collide_radius))
        .force("center", d3.forceCenter(width / 2, height / 2))     
        // the following force will be turned on when a node is highlighted, to
        // attract it and its neighbors to the center
        .force("radial", d3.forceRadial(d => d.opaque ? radii.opaque : radii.transparent, width / 2, height / 2).strength(0))
        .on("tick", ticked);
        
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

    // animation & interaction
    var double_click_timeout = 400;
    var recent_click = false;
    var is_double_click = false;
    function node_click(d) {
        if (recent_click === d) {
            is_double_click = true;
            double_click_handler(d);
        } else {
            recent_click = d;
            setTimeout(single_click_handler, double_click_timeout);
        }
    }

    function single_click_handler() {
        if(is_double_click) {
            is_double_click = false;
        } else {
            highlight_node(recent_click);
        }
        recent_click = false;
    }
    
    function double_click_handler(d) {
        if (d.url != "") {
            window.open(d.url);
        } else {
            is_double_click = false;
        }
    }

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
        simulation.force("radial").strength(0.66);
        simulation.alpha(1).restart();
        //ticked(); // update
    }

    function dehighlight() {
        data.nodes.forEach(function(d, i) {
            d.opaque = true;
          });
        currently_highlighted = false;
        simulation.force("radial").strength(0);
        simulation.alpha(1).restart();
        //ticked(); // update
    }


}
