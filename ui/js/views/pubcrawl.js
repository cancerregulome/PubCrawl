PC.PubcrawlView =  Backbone.View.extend({

     initialize: function() {
        this.template = _.template($("#PubcrawlAppTemplate").html());
         this.dataSet = {label:"brca_pw_manuscript",description:"Breast Cancer Manuscript"};
        this.useAlias=false;
    },

    render: function(eventName) {
		$(this.el).html(this.template());
		return this;
    },

    events: {
		"click #queryBtn"    : "triggerQuery",
        "triggerAdvancedSearch" : "submitDeNovoAdvanced",
        "networkNodesSelected" : "triggerNetworkLoad",
        "networkFilterChange" : "filterNetwork",
        "nodeClicked"  : "showNodeDetails",
        "edgeClicked" : "showEdgeDetails",
        "deNovoSearch" : "submitDeNovo",
        "click #exportNodeBtn" : "exportNodeData",
        "click #advancedSearchLink": "showAdvancedQuery"
    },



    submitDeNovo: function(event) {
        if(this.loadingView == undefined){
            this.loadingView = new PC.LoadingView();
        }
        var that=this;
        this.useAlias=false;
        var deNovoModel = new PC.DeNovoModel({searchTerm: this.searchTerm,useAlias:false});
        app.navigate("",{trigger:false});
        this.$el.append(that.showModal('#loadingDiv', this.loadingView).el.parentNode);
        deNovoModel.save({
        }).done(function() {

                that.refreshLoading();
            });
    },

    submitDeNovoAdvanced: function(event,data) {

        this.useAlias=data.useAlias;
        this.searchTerm=data.searchTerm;
        this.dataSet=data.dataSet;
        this.queryNode(this.searchTerm);
    },

    refreshLoading: function() {

        var progress = setInterval(function(){
            var $progress = $('.progress');
            var $bar = $('.bar');
            if($bar.width() >= $progress.width()){
                $('#loadingDiv').modal('hide');
                clearInterval(progress);
                app.navigate("nodes/query/"+ $("#querySearchTerm").val(),{trigger:true});
               }
            else{
                $bar.width($bar.width()+40);
                $bar.text(Math.round(($bar.width()/$progress.width())*100) + "%");

            }

        },3500);


    },

	triggerQuery: function(event) {
        if(event != null){
            event.preventDefault();
        }

        var navigateUrl="nodes/query/" + $("#querySearchTerm").val();
        this.searchTerm=$("#querySearchTerm").val();
        this.useAlias=false;

        if(Backbone.history.fragment == navigateUrl){
                this.queryFilterView = new PC.QueryFilterView({model: this.nodeQuery});
            this.$el.append(this.showModal('#modalDiv', this.queryFilterView).el.parentNode);
        }
        else{
            app.navigate("nodes/query/"+ $("#querySearchTerm").val(),{trigger:true});
        }
		return false;
	},

    triggerNetworkLoad: function(event,item){
        if(event != null){
            event.preventDefault();
        }
        this.selectedNodes = item.selectedNodes;
        this.selectedNodes.push(item.model.searchData);
        $('#networkTabs a[href="#networkContainer"]').tab('show');

        var navigateUrl="network/" + this.searchTerm;

        if(Backbone.history.fragment == navigateUrl){
            this.loadNetwork(this.searchTerm);
        }
        else{
            app.navigate("network/" + this.searchTerm,{trigger:true});
        }
        return false;
    },

    loadNetwork: function(name){
            if(this.selectedNodes != undefined){
                this.searchTerm = name;
            }
            else{
                //need to query nodes and select top # in this area
                this.searchTerm=name;
                this.queryNodeAndSelect(50);
                return;
            }
            this.networkData = new PC.NetworkModel({nodes: this.selectedNodes, searchTerm: this.searchTerm, dataSet: this.dataSet.label});
            this.$("#dataHeaderSearchText").val(this.searchTerm);
            this.$("#dataHeaderAliasText").val(this.useAlias);
            this.$("#dataHeaderDataSetText").val(this.dataSet.description);
            this.$("#dataHeaderDatasetText").val("NA");

            var that=this;
            this.networkData.retrieveData(function() {
                var model={nodes:that.networkData.nodes,baseEdges:that.networkData.baseEdges,dataSetEdges:that.networkData.dataSetEdges};

                // need to map the edges source and target appropriately with the node object so the networkView works
                //and make one edge collection
                var nodeMap={};
                var combinedEdges=new PC.EdgeCollection();
                for( var item in model.nodes.models){
                    nodeMap[model.nodes.models[item].name]=model.nodes.models[item];
                }
                for(var index in model.baseEdges.models){
                    var item = model.baseEdges.models[index];
                    item.source = nodeMap[item.source];
                    item.target = nodeMap[item.target];
                    combinedEdges.add(item);
                }
                for(var index in model.dataSetEdges.models){
                    var item = model.dataSetEdges.models[index];
                    item.source = nodeMap[item.source];
                    item.target = nodeMap[item.target];
                    combinedEdges.add(item);
                }
                that.networkModel = {nodes:model.nodes,edges:combinedEdges};
                that.showNetworkView('#networkContainer', new PC.NetworkView({model:that.networkModel}));

                var dataConfig = [{headerName:'Name', headerWidth: '75px', propName:'name'},
                    {headerName: 'Aliases', headerWidth: '150px', propName: 'alias'},
                    {headerName:'Term Single Count', headerWidth: '50px', propName: 'termcount'},
                    {headerName:'Term Combo Count', headerWidth: '50px', propName: 'combocount'},
                    {headerName:'NMD', headerWidth: '50px', propName: 'nmd'}];

                that.showNodeDataTableView('#nDataTableContainer', new PC.TableView({dataConfig: dataConfig, checkbox: false, tableId: "nGraphDataTable",model: that.nodeQuery.tableData}));

                that.showNodeFilterListView('#nodeFilter', new PC.NodeFilterListView({model: model.nodes}));
                that.showEdgeFilterListView('#edgeFilter', new PC.EdgeFilterListView({model: {baseEdges:model.baseEdges,dataSetEdges:model.dataSetEdges}}));



            });




        },

    queryNode: function(name){
            this.searchTerm = name;
            this.nodeQuery = new PC.NodeQueryModel({searchTerm: this.searchTerm});
            var that = this;

       		this.nodeQuery.fetch({success: function(model,response) {
                   if(model.plotData.length > 0){
                   that.queryFilterView = new PC.QueryFilterView({model: model});
                   that.$el.append(that.showModal('#modalDiv', that.queryFilterView).el.parentNode);
                   }
                   else if(model.searchData != undefined){    //no items were related to this search term.
                       that.noRelationshipsView = new PC.NoRelationshipsView({});
                        that.$el.append(that.showModal('#modalDiv',that.noRelationshipsView).el.parentNode)
                   }
                   else{ //no item found in db, so prompt denovo search
                       that.deNovoPromptView = new PC.DeNovoPromptView({});
                       that.$el.append(that.showModal('#modalDiv', that.deNovoPromptView).el.parentNode);
                   }
            }});
    },

    showNodeDetails: function(event,item){
        var thisDetails=this;

        this.nodeDetails = new PC.NodeDetailsModel(this.networkData,item);
        this.nodeDetails.fetch({success: function(model,response){
            thisDetails.nodeDetailsView = new PC.NodeTabTableView({model: model});
            thisDetails.$el.append(thisDetails.showModal('#modalDiv', thisDetails.nodeDetailsView ).el.parentNode);
        }});

    },

    showEdgeDetails: function(event, item){
        var thisDetails = this;
        this.edgeDetails = new PC.EdgeDetailsModel(this.networkData,item);

        this.edgeDetails.fetch({success: function(model, response){
            thisDetails.edgeDetailsView = new PC.EdgeTabTableView({model:model});
            thisDetails.$el.append(thisDetails.showModal('#modalDiv', thisDetails.edgeDetailsView).el.parentNode);
        }})
    },

    showAdvancedQuery: function(event, item){
        var thisDetails = this;
        this.advancedQueryDetails = new PC.AdvancedQueryModel();
       // this.dataSetList=[{label:"brca_pw_manuscript",description:"Breast Cancer Manuscript"},
           // {label:"test",description:"test descript"}];
        this.advancedQueryDetails.setDenovo(true);
        this.advancedQueryDetails.fetch({success: function(model,response){
            thisDetails.advancedQueryDetails.setDenovo(false);
            var thatDetails=thisDetails;
            thisDetails.advancedQueryDetails.fetch({success: function(model, response){
                thatDetails.advancedQueryView = new PC.AdvancedQueryView({model:model,dataSetList:model.dataSetList});
                thatDetails.$el.append(thatDetails.showModal('#modalDiv', thatDetails.advancedQueryView).el.parentNode);
            }})

        }})

    },

    queryNodeAndSelect: function(selectionLength){
        this.nodeQuery = new PC.NodeQueryModel({searchTerm: this.searchTerm});
        that = this;
        this.nodeQuery.fetch({
            success: function(model, response){
                model.tableData.sort(function(a,b){
                    return d3.ascending(a.nmd,b.nmd);
                });
                var i=0;
                that.selectedNodes = model.tableData.filter(function(){
                        if(i < selectionLength){
                            i++;
                            return true;
                        }
                    else
                        return false;
                });
                that.selectedNodes.push(model.searchData);
                that.loadNetwork(that.searchTerm);
            }
        });
    },

    filterNetwork: function(event,filterObj){
      this.networkView.filter(filterObj);
    },


    showModal: function(selector, view) {
        $(selector).html(view.render().el);
        $(selector).modal({backdrop: 'static'});
        $(selector).modal('show');
        return view;
    },

    showNetworkView: function(selector, view) {
        if (this.networkView)
            this.networkView.close();
        $(selector).html(view.render($(selector).width(),$(window).height()-200).el);
        this.networkView = view;
        return view;
    },


    showHiveView: function(selector, view){
        if(this.hiveView)
            this.hiveView.close();
        $(selector).html(view.render($(selector).width(),$(window).height()-200).el);
        this.hiveView = view;
        return view;
    },

    showNodeFilterListView: function(selector, view){
        if(this.nodeFilterListView)    //do this when a new search is done?
            this.nodeFilterListView.close();
        $(selector).html(view.render($(selector).parent().width(),$(window).height() - 150).el);
        this.nodeFilterListView = view;
        this.nodeFilterListView.triggerNetworkFilter();
        return view;
    },

    showEdgeFilterListView: function(selector, view){
        if(this.edgeFilterListView)         //do this when a new search is done?
            this.edgeFilterListView.close();
        $(selector).html(view.render($(selector).parent().width(),$(window).height() - 100).el);
        this.edgeFilterListView = view;
        this.edgeFilterListView.triggerNetworkFilter();
        return view;
    },

    showNodeDataTableView: function(selector, view){
        $(selector).html(view.render($(selector).parent().width(),$(window).height() - 200).el);
        this.nodeDataTableView = view;
        return view;
    },

    exportNodeData: function(){
        document.getElementById('frame').src='http://' + window.location.host + encodeURI('/pubcrawl/hukilau-svc/graphs/pubcrawl/nodes/export/'+this.searchTerm+'?alias='+ this.useAlias + '&type=csv');
    }

});

