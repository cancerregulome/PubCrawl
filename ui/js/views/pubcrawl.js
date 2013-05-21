PC.PubcrawlView =  Backbone.View.extend({

     initialize: function() {
        this.template = _.template($("#PubcrawlAppTemplate").html());

    },

    render: function(eventName) {
		$(this.el).html(this.template());
		return this;
    },

    events: {
		"click #queryBtn"    : "triggerQuery",
        "networkNodesSelected" : "triggerNetworkLoad",
        "networkFilterChange" : "filterNetwork",
        "nodeClicked"  : "showNodeDetails",
        "edgeClicked" : "showEdgeDetails"
    },

	triggerQuery: function(event) {
        if(event != null){
            event.preventDefault();
        }

        var navigateUrl="nodes/query/" + $("#querySearchTerm").val();

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
            this.networkData = new PC.NetworkModel({nodes: this.selectedNodes, searchterm: this.searchTerm});
            this.$("#dataHeaderSearchText").val(this.searchTerm);
            this.$("#dataHeaderAliasText").val("no");
            this.$("#dataHeaderModeText").val("search");
            this.$("#dataHeaderDatasetText").val("NA");

            var that=this;
            this.networkData.fetch({success: function(model,response) {
                that.networkModel = model;
                   that.showNetworkView('#networkContainer', new PC.NetworkView({model: model}));

                var dataConfig = [{headerName:'Name', headerWidth: '75px', propName:'name'},
                    {headerName: 'Aliases', headerWidth: '150px', propName: 'alias'},
                    {headerName:'Term Single Count', headerWidth: '50px', propName: 'termcount'},
                    {headerName:'Term Combo Count', headerWidth: '50px', propName: 'combocount'},
                    {headerName:'NMD', headerWidth: '50px', propName: 'nmd'}];

                    that.showNodeDataTableView('#nDataTableContainer', new PC.TableView({dataConfig: dataConfig, checkbox: false, tableId: "nGraphDataTable",model: that.nodeQuery.tableData}));

                    that.showNodeFilterListView('#nodeFilter', new PC.NodeFilterListView({model: model.nodes}));
                    that.showEdgeFilterListView('#edgeFilter', new PC.EdgeFilterListView({model: model.edges}));
            }});



        },

    queryNode: function(name){
            this.searchTerm = name;
            this.nodeQuery = new PC.NodeQueryModel({searchTerm: this.searchTerm});
            var that = this;

       		this.nodeQuery.fetch({success: function(model,response) {
                   that.queryFilterView = new PC.QueryFilterView({model: model});
                   that.$el.append(that.showModal('#modalDiv', that.queryFilterView).el.parentNode);
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
    }

});
