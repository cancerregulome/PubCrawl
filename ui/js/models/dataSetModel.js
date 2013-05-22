PC.DataSetModel = Backbone.Model.extend({
    urlRoot: './hukilau-svc/graphs/',
    url: function(){
        return this.urlRoot + this.dataSet + "/relationships/query/?nodeSet=" + this.createNodeUrlString() +
            "&relationshipSet=[{name:'pairwise'}]";
    },

    initialize: function(data){
        this.nodes=data.nodes;
        this.dataSet = data.dataSet;
        this.searchterm=data.searchTerm;
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
        var nodeIdMappings={};

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

                if(edge.source != edge.target){
                    edge.pvalue=0-edge.pvalue;
                    edge.source=nodeIdMappings[edge.source].name;
                    edge.target = nodeIdMappings[edge.target].name;
                    this.edges.add(edge);
                }

            }
        }

        return;
    }

});
