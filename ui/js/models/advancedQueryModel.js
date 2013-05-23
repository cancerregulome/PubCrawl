PC.AdvancedQueryModel = Backbone.Model.extend({
    urlRoot: './hukilau-svc/graphs/pubcrawl/nodes',

    url: function(){
        if(this.denovo){
        return this.urlRoot + "?filter=[{prop:'nodeType',value:'deNovo'}]";
        }
        else{
            return './hukilau-svc/graphs';
        }
    },
    defaults:{
        tableData: []
    },

    setDenovo: function(denovo){
    this.denovo=denovo;
},

    parse: function(response){
        //need to retrieve the nodes from the query
        if(response.data != null && response.data.nodes != null){
            var pd=[];

            for(var i in response.data.nodes){
                pd.push(response.data.nodes[i]);
            }

            this.tableData = pd;
            return;
        }
        else{
            this.dataSetList=response.items;
        }
        return;
    }



});