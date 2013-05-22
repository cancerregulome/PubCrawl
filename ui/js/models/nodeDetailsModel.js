PC.NodeDetailsModel = Backbone.Model.extend({
    //url for this model is the solr connection to retrieve documents related to this node
    urlRoot: './solr/core0/select/?qt=distributed_select&sort=pub_date_year desc&wt=json&hl=true&hl.fl=article_title,abstract_text&rows=1000&hl.snippets=10000&hl.fragsize=50000&h.mergeContiguous=true',
    url: function(){
        return this.urlRoot + "&q=+text:(" + this.nodeName + ")&fq=pub_date_year:[1993 TO 2013]";
    },

    initialize: function(networkModel,nodeName){
        //setup the various model items by finding all edges with the nodeName and putting into the appropriate jsonarray
        this.nodeName = nodeName;
        this.nmdDetailsModel = [];
        this.domineDetailsModel = [];
        this.pwDetailsModel = [];

        for(var i=0; i< networkModel.nodes.length; i++){
            if(networkModel.nodes.models[i].name == nodeName){
                this.node = networkModel.nodes.models[i];
                break;
            }
        }
        for(var i=0; i< networkModel.edges.length; i++){
            var edge = networkModel.edges.models[i];
            if(edge.source.name == this.node.name){
                if(edge.relType == "gene_nmd" || edge.relType == "denovo_nmd"){

                    var edgeItem={name: edge.target.name, combocount: edge.combocount, termcount: edge.target.termcount,nmd:edge.nmd};
                    this.nmdDetailsModel.push(edgeItem);
                }
                else if(edge.relType == "domine"){
                    var edgeItem={term1: edge.source.name, term2: edge.target.name, pf1: edge.pf1, pf2: edge.pf2,
                        pf1_count: edge.pf1_count, pf2_count: edge.pf2_count, type: edge.type, uni1: edge.uni1, uni2: edge.uni2};
                    this.domineDetailsModel.push(edgeItem);
                }
                else if(edge.relType == "pairwise"){
                    var edgeItem={term1: edge.featureid1, term2:edge.featureid2,pvalue:edge.pvalue,correlation:edge.correlation};
                    this.pwDetailsModel.push(edgeItem);
                }
            }
            else if(edge.target.name == this.node.name){
                //don't need to do ngd here, since it is currently doubled, should be able to also remove domine once it is doubled correctly
                if(edge.relType == "domine"){
                    var edgeItem={term1: edge.target.name, term2: edge.source.name, pf1: edge.pf1, pf2: edge.pf2,
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
