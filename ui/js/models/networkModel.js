PC.NetworkModel = Backbone.Model.extend({
        urlRoot: './hukilau-svc/graphs/pubcrawl/relationships/query',
        url: function(){
              return this.urlRoot + "?nodeSet=" + this.createNodeUrlString() + "&relationshipSet=[{name:'gene_nmd'},{name:'domine'},{name:'denovo_nmd'}]";
        },

        initialize: function(data){
            this.nodes=data.nodes;
            this.searchterm = data.searchTerm;
            this.dataSet = data.dataSet;
            this.dataSetModel = new PC.DataSetModel({dataSet:this.dataSet,nodes:this.nodes,searchTerm:this.searchterm});
        },
        createNodeUrlString: function(){
            var nodeSetString = "[";

            for(var i=0; i< this.nodes.length; i++){
                nodeSetString = nodeSetString + "{name:'" + encodeURIComponent(this.nodes[i].name) + "'},";
            }
            nodeSetString = nodeSetString.substring(0,nodeSetString.length-1) + "]";
            return nodeSetString;
        },

        retrieveData: function(callback){
            var that=this;
            var baseReturn=false;
            var datasetReturn=false;
            this.dataSetModel.fetch({success: function(model,response) {
                that.dataSetEdges=model.edges;
                datasetReturn=true;
                if(datasetReturn && baseReturn){
                    callback();
                }
            }});
            this.fetch({success: function(model,response) {
                baseReturn=true;
                if(datasetReturn && baseReturn){
                    callback();
                }
            }});
        },

        parse: function(response){
            //need to retrieve the edges
            this.baseEdges=new PC.EdgeCollection();
            this.nodes=new PC.NodeCollection();
            var nodeIdMappings={};
            var tempEdges=[];


            if(response.data != null && response.data.edges != null){
                for(var i=0; i < response.data.nodes.length; i++){
                    var node={linknum: 0, id: response.data.nodes[i].id, index: i, name: response.data.nodes[i].name, tf: response.data.nodes[i].tf, termcount: response.data.nodes[i].termcount, nodeType: response.data.nodes[i].nodeType};
                    if(node.name == this.searchterm){
                        node.nmd=0;
                        node.cc = response.data.nodes[i].termcount;
                        node.x=0;
                        node.y=0;

                    }
                         nodeIdMappings[response.data.nodes[i].id] = node;
                }
                    for(var index=0; index < response.data.edges.length; index++){
                        var edge = response.data.edges[index];
                        var nmd;
                        //if this edge is from our searchterm to a target, then get the nmd value and put it into the node object
                        if(nodeIdMappings[edge.source].name == this.searchterm && edge.nmd != null){
                            nodeIdMappings[edge.target].nmd = edge.nmd;
                            nodeIdMappings[edge.target].cc = edge.combocount;
                        }
                        else if( nodeIdMappings[edge.target].name == this.searchterm && edge.nmd != null){
                            nodeIdMappings[edge.source].nmd = edge.nmd;
                            nodeIdMappings[edge.source].cc = edge.combocount;
                        }

                        nodeIdMappings[edge.source].linknum++;
                        nodeIdMappings[edge.target].linknum++;

                        //do this for now, but should change underlying service...
                        edge.nmd =edge.nmd;
                        edge.cc=edge.combocount;
                        edge.source=nodeIdMappings[edge.source].name;
                        edge.target = nodeIdMappings[edge.target].name;
                        this.baseEdges.add(edge);
                    }

                for(var key in nodeIdMappings){
                     this.nodes.add(nodeIdMappings[key]);
                }

            }

            return;
        }

});