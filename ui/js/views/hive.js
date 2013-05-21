/**
 * View encapsulates the rendering of the main network
 */

PC.HiveView = Backbone.View.extend({


    render: function(width,height){

        var width = width,
            height = height,
            innerRadius = 40,
            outerRadius = 450,
            x_off=$(window).width()-width,
            y_off=80,
            degree = Math.PI / 180,
            that=this;

        var angle = d3.scale.ordinal()
            .domain(["list1", "list1_clone","list2","list2_clone"])
            .range([degree * 67.5, degree * 112.5, degree * 247.5,degree * 292.5]);

        var radius = d3.scale.linear()
            .range([innerRadius, outerRadius]);

        var color = d3.scale.category10();


        var svg = d3.select(this.el).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + (width * .5) + "," + (height * .5) + ")");

        this.vis = svg;

        // Load the data and display the plot!
        var nodesByName = {},
        links = [];

        var nodes = this.model.nodes.models;
    // Construct an index by node name.
        nodes.sort(function(a,b){
            return d3.ascending(a.nmd,b.nmd);
        });

        var index=0;
        var first=true;
        var type2="list2";
        var type="list1";

        nodes.forEach(function(d) {
            d.connectors = [];
            if(first){
                 d.type=type;
                 first=false;
            }
            else{
                d.type=type2;
                first=true;
            }
            nodesByName[d.name] = d;
        });


        var linksTemp=this.model.edges.models;

        //create connectors for nodes
        linksTemp.forEach(function(link2){
            var link=link2;
        var sourceNode = nodesByName[link.source.name];

        if(!sourceNode.source){
            sourceNode.connectors.push(sourceNode.source = { node: sourceNode, degree: 0});
            sourceNode.source.type = sourceNode.type;
        }

        var targetNode = nodesByName[link.target.name];
        if(!targetNode.target){
             targetNode.connectors.push(targetNode.target = { node: targetNode, degree: 0});
             targetNode.target.type = targetNode.type;
        }

        link.source = sourceNode.source;
        link.target = targetNode.target;

        links.push(link);
        if(link.relType == "domine"){       //need to duplicate because domine is multi-directional but only shows up once in results

          if(!sourceNode.target){
              sourceNode.connectors.push(sourceNode.target = { node: sourceNode, degree: 0});
              sourceNode.target.type = sourceNode.type;
          }
          if(!targetNode.source){
              targetNode.connectors.push(targetNode.source = { node: targetNode, degree: 0});
              targetNode.source.type = targetNode.type;
          }

          link.source = targetNode.source;
          link.target = sourceNode.target;
          links.push(link);

      }

        nodesByName[link.source.name]=sourceNode;
        nodesByName[link.target.name] = targetNode;

  });


        //go thru nodes and ensure nodes with no connections have a connector object
    nodes = [];
        for(var key in nodesByName){
            var node = nodesByName[key];
            if(node.source && node.target){
                if(node.type=="list1"){
                    node.target.type="list1_clone";
                }
                else{
                    node.target.type="list2_clone";
                }
            }
            else if(!node.source && !node.target){
                node.connectors.push({node: node});
                node.type = "list1";
            }

           nodes.push(node);
        }


  // Nest nodes by type, for computing the rank.
  var nodesByType = d3.nest()
      .key(function(d) { return d.type; })
      .sortKeys(d3.ascending)
      .entries(nodes);

  // Duplicate the target-source axis as source-target.
  nodesByType.push({key: "list1_clone", values: nodesByType[0].values});
  nodesByType.push({key: "list2_clone", values: nodesByType[1].values});

  // Compute the rank for each type
  nodesByType.forEach(function(type) {
    type.values.sort(function(a,b){
        return d3.ascending(a.nmd,b.nmd);
    })
    var count=0;
    type.values.forEach(function(d, i) {
      d.index = count++;
    });

    type.count = count - 1;
  });

  // Set the radius domain.
  radius.domain(d3.extent(nodes, function(d) { return d.index; }));

  // Draw the axes.
  svg.selectAll(".axis")
      .data(nodesByType)
    .enter().append("line")
      .attr("class", "axis")
      .attr("transform", function(d) { return "rotate(" + degrees(angle(d.key)) + ")"; })
      .attr("x1", radius(-2))
      .attr("x2", function(d) { return radius(d.count + 2); });

  // Draw the links.
  svg.append("g")
      .attr("class", "links")
    .selectAll(".link")
      .data(links)
    .enter().append("path")
      .attr("class", "link")
      .attr("d", link()
      .angle(function(d) { return angle(d.type); })
      .radius(function(d) { return radius(d.node.index); }))
      .attr("class", function(d) { return "link " + d.relType; })
      .on("mouseover", linkMouseover)
      .on("mouseout", mouseout)
      .on("click", triggerEdgeDetailsView);

  // Draw the nodes. Note that each node can have up to two connectors,
  // representing the source (outgoing) and target (incoming) links.
svg.append("g")
      .attr("class", "nodes")
    .selectAll(".node")
      .data(nodes)
      .enter().append("g")
       .attr("class", "node")
      .style("fill", function(d){
          if(d.nodeType == "deNovo"){
              return "#005B00";
          }
          else if(d.tf==0)
            return "#D5DF3E";
          else
            return "#F8991D";
      })
     .selectAll("circle")
      .data(function(d) { return d.connectors; })
     .enter().append("circle")
      .attr("transform", function(d) { return "rotate(" + degrees(angle(d.type)) + ")"; })
      .attr("cx", function(d) { return radius(d.node.index); })
      .attr("r", 6)
      .on("mouseover", nodeMouseover)
      .on("mouseout", mouseout)
      .on("click", triggerNodeDetailsView);


var labels =svg.append("g")
        .attr("class", "labels")
        .selectAll("label")
        .data(nodes)
        .enter().append("g")
        .attr("class", "label")
    .selectAll("text")
    .data(function(d) { return d.connectors;});


        labels.enter().append("text")
         .attr("transform", function(d) { return "rotate(" + degrees(angle(d.type)) + "),translate(" + radius(d.node.index) + ",0),rotate(" + (360-(degrees(angle(d.type)))) + ")";  })
         .attr("dy", ".35em")
         .attr("text-anchor","left")
         .attr("class","hiveplot")
        .text(function(d) { return d.node.name;});


  // Highlight the link and connected nodes on mouseover.
  function linkMouseover(d) {
    svg.selectAll(".link").classed("active", function(p) { return p === d; });
    svg.selectAll(".node circle").classed("active", function(p) { return p === d.source || p === d.target; });
  //  info.text(d.source.name + " → " + d.target.name);
  }

  // Highlight the node and connected links on mouseover.
  function nodeMouseover(d) {
    svg.selectAll(".link").classed("active", function(p) { return p.source === d || p.target === d; });
    d3.select(this).classed("active", true);
//    info.text(d.name);
  }

  // Clear any highlighted nodes or links.
  function mouseout() {
    svg.selectAll(".active").classed("active", false);
 //   info.text(defaultInfo);
  }

  function triggerNodeDetailsView(item){
      $(that.el).trigger('nodeClicked',item.node.name);
  }

  function triggerEdgeDetailsView(item){
      $(that.el).trigger('edgeClicked',{source: item.source.node.name, target: item.target.node.name});
  }


// A shape generator for Hive links, based on a source and a target.
// The source and target are defined in polar coordinates (angle and radius).
// Ratio links can also be drawn by using a startRadius and endRadius.
// This class is modeled after d3.svg.chord.
function link() {
  var source = function(d) { return d.source; },
      target = function(d) { return d.target; },
      angle = function(d) { return d.angle; },
      startRadius = function(d) { return d.radius; },
      endRadius = startRadius,
      arcOffset = -Math.PI / 2;

  function link(d, i) {
    var s = node(source, this, d, i),
        t = node(target, this, d, i),
        x;
    if (t.a < s.a) x = t, t = s, s = x;
    if (t.a - s.a > Math.PI) s.a += 2 * Math.PI;
    var a1 = s.a + (t.a - s.a) / 3,
        a2 = t.a - (t.a - s.a) / 3;
    return s.r0 - s.r1 || t.r0 - t.r1
        ? "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "L" + Math.cos(s.a) * s.r1 + "," + Math.sin(s.a) * s.r1
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1
        + "L" + Math.cos(t.a) * t.r0 + "," + Math.sin(t.a) * t.r0
        + "C" + Math.cos(a2) * t.r0 + "," + Math.sin(a2) * t.r0
        + " " + Math.cos(a1) * s.r0 + "," + Math.sin(a1) * s.r0
        + " " + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        : "M" + Math.cos(s.a) * s.r0 + "," + Math.sin(s.a) * s.r0
        + "C" + Math.cos(a1) * s.r1 + "," + Math.sin(a1) * s.r1
        + " " + Math.cos(a2) * t.r1 + "," + Math.sin(a2) * t.r1
        + " " + Math.cos(t.a) * t.r1 + "," + Math.sin(t.a) * t.r1;
  }

  function node(method, thiz, d, i) {
    var node = method.call(thiz, d, i),
        a = +(typeof angle === "function" ? angle.call(thiz, node, i) : angle) + arcOffset,
        r0 = +(typeof startRadius === "function" ? startRadius.call(thiz, node, i) : startRadius),
        r1 = (startRadius === endRadius ? r0 : +(typeof endRadius === "function" ? endRadius.call(thiz, node, i) : endRadius));
    return {r0: r0, r1: r1, a: a};
  }

  link.source = function(_) {
    if (!arguments.length) return source;
    source = _;
    return link;
  };

  link.target = function(_) {
    if (!arguments.length) return target;
    target = _;
    return link;
  };

  link.angle = function(_) {
    if (!arguments.length) return angle;
    angle = _;
    return link;
  };

  link.radius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = endRadius = _;
    return link;
  };

  link.startRadius = function(_) {
    if (!arguments.length) return startRadius;
    startRadius = _;
    return link;
  };

  link.endRadius = function(_) {
    if (!arguments.length) return endRadius;
    endRadius = _;
    return link;
  };

  return link;
}

function degrees(radians) {
  return radians / Math.PI * 180 - 90;
}

        return this;
} ,

    //filterObj holds the filtering for nodes and edges in the following format:
    //{node:[{attr:"nmd",start:0.3,end:0.5}],edge:[{attr:"nmd",start:0.3,end:0.5}]}
    filter: function(filterObj){
            var that=this;
            if(filterObj.node != null){
                that.nodeFilter = filterObj.node;
            }
            if(filterObj.edge != null){
                that.edgeFilter = filterObj.edge;
            }

            if(that.nodeFilter != null){
                this.vis.selectAll(".node circle").classed("hidden",function(p) {
                    return that.filterObject(that.nodeFilter, p.node);
                });

                this.vis.selectAll(".label text").classed("hidden",function(p) {
                    return that.filterObject(that.nodeFilter, p.node);
                });
            }

            this.vis.selectAll("path.link").classed("hidden",function(p) {
                var filterNodeResult = false;
                var filterEdgeResult = false;
                if(that.nodeFilter != null){
                     filterNodeResult =  (that.filterObject(that.nodeFilter, p.source.node) || that.filterObject(that.nodeFilter, p.target.node));
                }

                if(that.edgeFilter != null){
                    filterEdgeResult = (that.filterObject(that.edgeFilter, p));
                }
                return filterEdgeResult || filterNodeResult;

            });

        },

    filterObject: function(filterObj,item){
        for(var key in filterObj){
            var attrFilter = filterObj[key];
            //only filter this item based on this attribute, if this item has this attribute
            if(item[attrFilter.attr] != null){
                var result = (parseFloat(item[attrFilter.attr]) >= attrFilter.start && parseFloat(item[attrFilter.attr]) <= attrFilter.end);
                if(!result)
                    return !result;
            }
        }
        //if we got here, then all of the filter criteria was met - so return false;
        return false;
    }
});