 PC.AdvancedQueryView = Backbone.View.extend({
        template: _.template($("#AdvancedQueryTemplate").html()),

        initialize: function() {
            this.$el.html(this.template());
            var dataOptions={label:"brca_pw_manuscript",description:"Breast Cancer Manuscript"}
            $("#DataSetSelect").options(this.model.dataSetList);

        },

        render: function() {


            var dataConfig = [{headerName:'Term', headerWidth: '100%', propName:'name'}];

            this.tableView = new PC.TableView({dataConfig: dataConfig, checkbox: false, tableId: "deNovoTable",model: this.model.tableData});
            this.$el.find("#deNovoTableView").html(this.tableView.render().el);


            return this;

        },



        events: {
            "click button.close": "close",
            "click button.#CancelAdvancedQuery": "close",
            "click [data-toggle='tab']": "updateItemsSelected",
            "tableSelectionChange": "updateItemsSelected",
            "click button.#SubmitAdvancedQueryBtn": "triggerQuery",
            "show #qfdeNovoTableTab": "showTable"


        },

        updateItemsSelected: function(event){

            if(event != undefined && (event.currentTarget.id == "qfdeNovoTableTab" || event.type=="tableSelectionChange")){
               this.searchTerm = this.getDataTableSelected();


            }
            else{
                this.searchTerm=$("#advancedSearchText").val();
                this.dataSet=$("dataSetSelect").val();
                this.useAlias=false;

            }

        },

        triggerQuery: function(event){

            $(this.el).trigger("triggerAdvancedSearch",this);

        },

        showTable: function(){
            if(this.tableView.oTable != null){
                this.tableView.oTable.fnAdjustColumnSizing();

            }

        },


        getDataTableSelected: function(){
            var that = this;

            return this.tableView.oTable.fnGetData(this.parentNode.parentNode).name;

        },

        beforeClose: function(){
            this.tableView.close();
        }


    });
