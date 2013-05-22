/**
 * View encapsulates the rendering of the main network
 */

PC.NetworkView = Backbone.View.extend({

   initialize: function(){

   },

    render: function(width,height){

        var width = width,
            height = height,
            that=this;


        var force = d3.layout.force()
            .nodes(this.model.nodes.models)
            .links(this.model.edges.models)
            .size([width, height])
            .linkDistance(
                function(d){
                    if(d.nmd != null){
                        return (d.nmd)*500;
                    }
                    return 500;
                })
            .charge(-400)
            .on("tick", tick);

        var svg = d3.select(this.el).append("svg:svg")
            .attr("width", width)
            .attr("height", height);


        this.vis=svg;

        var line = svg.append("svg:g").selectAll("line.link")
            .data(force.links())
        .enter().append("line")
            .attr("class", function(d) { return "link." + d.relType; })
            .attr("x1", function(d){ return d.source.x;})
            .attr("y1", function(d){ return d.source.y;})
            .attr("x2", function(d){ return d.target.x;})
            .attr("y2", function(d){ return d.target.y;})
            .on("mouseover", linkMouseover)
            .on("mouseout", mouseout)
            .on("click", triggerEdgeDetailsView);

         var circle = svg.append("svg:g").selectAll("circle")
            .data(force.nodes())
        .enter().append("svg:circle")
             .attr("class", "node")
             .attr("cx", function(d){ return d.x;})
             .attr("cy", function(d){ return d.y;})
             .style("fill", function(d){
                       if(d.nodeType == "deNovo"){
                           return "#005B00";
                       }
                       else if(d.tf==0)
                         return "#D5DF3E";
                       else
                         return "#F8991D";
                   })
             .on("mouseover", nodeMouseover)
             .on("mouseout", mouseout)
             .on("click", triggerNodeDetailsView)
            .attr("r", function(d){
                 if(d.linknum > 4){
                     return Math.log(d.linknum)*6;
                 }
                 return Math.log(4)*10;
             })
            .call(force.drag);

        var text = svg.append("svg:g").selectAll("g")
            .data(force.nodes())
        .enter().append("svg:g");

        // A copy of the text with a thick white stroke for legibility.
        text.append("svg:text")
            .attr("x", 10)
            .attr("y", ".31em")
            .attr("class", "shadow")
            .text(function(d) { return d.name; });

        text.append("svg:text")
            .attr("x", 10)
             .attr("y", ".31em")
            .text(function(d) { return d.name; });

        function tick() {


            line.attr("x1", function(d) { return d.source.x; })
                            .attr("y1", function(d){ return d.source.y; })
                            .attr("x2", function(d){ return d.target.x; })
                            .attr("y2", function(d) { return d.target.y; });

            circle.attr("cx", function(d) { return d.x = Math.max(14, Math.min(width - 14, d.x)); })
                   .attr("cy", function(d) { return d.y = Math.max(14, Math.min(height - 14, d.y)); });

            text.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }


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
      $(that.el).trigger('nodeClicked',item.name);
  }

  function triggerEdgeDetailsView(item){
      $(that.el).trigger('edgeClicked',{source: item.source.name, target: item.target.name});
  }

        force.start();
               for(var i=0; i<5000; ++i) force.tick();
               force.stop();
               for(var j=0; j< force.nodes().length; j++){
                   force.nodes()[j].fixed=true;
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
                this.vis.selectAll("circle.node").classed("hidden",function(p) {
                    return that.filterObject(that.nodeFilter, p);
                });

                this.vis.selectAll("text").classed("hidden",function(p) {
                    return that.filterObject(that.nodeFilter, p);
                });
            }

            this.vis.selectAll("line.link").classed("hidden",function(p) {
                var filterNodeResult = false;
                var filterEdgeResult = false;
                if(that.nodeFilter != null){
                     filterNodeResult =  (that.filterObject(that.nodeFilter, p.source) || that.filterObject(that.nodeFilter, p.target));
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