 PC.AdvancedQueryView = Backbone.View.extend({
        template: _.template($("#AdvancedQueryTemplate").html()),

        initialize: function(data) {
            this.$el.html(this.template());
            var dataOptions={label:"brca_pw_manuscript",description:"Breast Cancer Manuscript"}
            this.$el.find("#dataSetSelect").empty();
            for(var i in data.dataSetList){
                this.$el.find("#dataSetSelect").append($("<option></option>").val(data.dataSetList[i].label).html(data.dataSetList[i].name));
            }

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
            "click button.#SubmitAdvancedQueryBtn": "triggerQuery",
            "show #qfdeNovoTableTab": "showTable"


        },

        updateItemsSelected: function(event){


                this.searchTerm=$("#advancedSearchText").val();
                this.dataSet=$("#dataSetSelect option:selected").val();
                this.useAlias=false;


        },

        triggerQuery: function(event){
            this.updateItemsSelected();
            $(this.el).trigger("triggerAdvancedSearch",this);

        },

        showTable: function(){
            if(this.tableView.oTable != null){
                this.tableView.oTable.fnAdjustColumnSizing();

            }

        },

        beforeClose: function(){
            this.tableView.close();
        }


    });
