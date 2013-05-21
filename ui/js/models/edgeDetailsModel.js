PC.EdgeDetailsModel = Backbone.Model.extend({
    //url for this model is the solr connection to retrieve documents related to this node
    urlRoot: './solr/core0/select/?qt=distributed_select&sort=pub_date_year desc&wt=json&hl=true&hl.fl=article_title,abstract_text&rows=1000&hl.snippets=10000&hl.fragsize=50000&h.mergeContiguous=true',
    url: function(){
        return this.urlRoot + "&q=+text:(" + this.source + ")&q=+text:(" + this.target + ")&fq=pub_date_year:[1991 TO 2012]";
    },

    initialize: function(networkModel,edge){
        //setup the various model items by finding all edges with the nodeName and putting into the appropriate jsonarray
        this.source = edge.source;
        this.target = edge.target;
        this.nmdDetailsModel = [];
        this.domineDetailsModel = [];

        for(var i=0; i< networkModel.edges.length; i++){
            var edge = networkModel.edges.models[i];
            if(edge.source.name == this.source && edge.target.name == this.target){
                if(edge.nmd != null){

                    var edgeItem={term1: edge.source.name, term2: edge.target.name,combocount: edge.combocount, termcount: edge.target.termcount,nmd:edge.nmd};
                    this.nmdDetailsModel.push(edgeItem);
                }
                if(edge.relType == "domine"){
                    var edgeItem={term1: edge.source.name, term2: edge.target.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
            }
        }

    },

    parse: function(response){
       this.docs=[];
        if(response.response.docs != null){
            for (var i=0; i < response.response.docs.length; i++){
                var doc = response.response.docs[i];
                if(response.highlighting[doc.pmid] != undefined){
                    if(response.highlighting[doc.pmid].abstract_text != undefined){
                          doc.abstract_text = response.highlighting[doc.pmid].abstract_text;
                    }
                    if(response.highlighting[doc.pmid].article_title != undefined){
                        doc.article_title = response.highlighting[doc.pmid].article_title;
                    }
                }

                this.docs.push(doc);
            }
        }

        return;

    }

});

