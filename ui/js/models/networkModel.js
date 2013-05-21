PC.NetworkModel = Backbone.Model.extend({
        urlRoot: './hukilau-svc/graphs/pubcrawl/relationships/query',
        url: function(){
              return this.urlRoot + "?nodeSet=" + this.createNodeUrlString() + "&relationshipSet=[{name:'ngd'},{name:'domine'}]";
        },

        initialize: function(data){
            this.nodes=data.nodes;
            this.searchterm = data.searchterm;
        },
        createNodeUrlString: function(){
            var nodeSetString = "[";

            for(var i=0; i< this.nodes.length; i++){
                nodeSetString = nodeSetString + "{name:'" + this.nodes[i].name + "'},";
            }
            nodeSetString = nodeSetString.substring(0,nodeSetString.length-1) + "]";
            return nodeSetString;
        },

        parse: function(response){
            //need to retrieve the edges
            this.edges=new PC.EdgeCollection();
            this.nodes=new PC.NodeCollection();
            var nodeIdMappings={};
            var tempEdges=[];


            if(response.data != null && response.data.edges != null){
                for(var i=0; i < response.data.nodes.length; i++){
                    var node={linknum: 0, id: response.data.nodes[i].id, index: i, name: response.data.nodes[i].name, tf: response.data.nodes[i].tf, termcount: response.data.nodes[i].termcount, nodeType: response.data.nodes[i].nodeType};
                    if(node.name == this.searchterm){
                        node.nmd=0;
                        node.cc = response.data.nodes[i].termcount;

                    }
                         nodeIdMappings[response.data.nodes[i].id] = node;
                }
                    for(var index=0; index < response.data.edges.length; index++){
                        var edge = response.data.edges[index];
                        var nmd;
                        //if this edge is from our searchterm to a target, then get the nmd value and put it into the node object
                        if(nodeIdMappings[edge.source].name == this.searchterm && edge.ngd != null){
                            nodeIdMappings[edge.target].nmd = edge.ngd;
                            nodeIdMappings[edge.target].cc = edge.combocount;
                        }
                        else if( nodeIdMappings[edge.target].name == this.searchterm && edge.ngd != null){
                            nodeIdMappings[edge.source].nmd = edge.ngd;
                            nodeIdMappings[edge.source].cc = edge.combocount;
                        }

                        nodeIdMappings[edge.source].linknum++;
                        nodeIdMappings[edge.target].linknum++;

                        //do this for now, but should change underlying service...
                        edge.nmd =edge.ngd;
                        edge.cc=edge.combocount;
                        tempEdges.push(edge);
                    }

                for(var key in nodeIdMappings){
                     this.nodes.add(nodeIdMappings[key]);
                }

                //now have edges and nodes collections, but now need to map the node models onto the edge target and source
                nodeIDMappings={};
                var nodeMap={};
                for( var item in this.nodes.models){
                    nodeMap[this.nodes.models[item].id]=this.nodes.models[item];
                }
                for(var i=0; i< tempEdges.length; i++){
                    var item = tempEdges[i];
                    item.source = nodeMap[item.source];
                    item.target = nodeMap[item.target];
                    this.edges.add(item);
                }

            }

            return;
        }

});