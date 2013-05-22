PC.AdvancedQueryModel = Backbone.Model.extend({
    urlRoot: './hukilau-svc/graphs/pubcrawl/nodes',
    url: function(){
        if(this.deNovo){
            return this.urlRoot + "?filter=[{prop:'nodeType',value:'deNovo'}]";
        }
        else
            return './hukilau-svc/graphs/';
    },
    defaults:{
        tableData: []
    },


    setQueryType: function(deNovo){
       this.deNovo=deNovo;
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
        else{ //this is the dataSetList

            this.dataSetList=[{"label":"brca_pw_manuscript","description":"Breast Cancer Manuscript"}];
        }
        return;
    }



});