 PC.QueryFilterView = Backbone.View.extend({
        template: _.template($("#NodeQueryFilterTemplate").html()),

        initialize: function() {
            this.$el.html(this.template());
            this.selectedNodes=[];

        },

        render: function() {


            var gv = this;
            var data = this.model.plotData;
            if(data == null || data.length < 1){
                gv.$el.append("<h4>No datapoints found for the search term. Please try a new search.</h4>");
                return this;
            }

            var dataConfig = [{headerName:'Name', headerWidth: '75px', propName:'name'},
                {headerName: 'Aliases', headerWidth: '150px', propName: 'alias'},
                {headerName:'Term Single Count', headerWidth: '50px', propName: 'termcount'},
                {headerName:'Term Combo Count', headerWidth: '50px', propName: 'combocount'},
                {headerName:'NMD', headerWidth: '50px', propName: 'nmd'}];



            this.tableView = new PC.TableView({dataConfig: dataConfig, checkbox: true, tableId: "queryFilterTable",model: this.model.tableData});
            this.$el.find("#queryFilterTableView").html(this.tableView.render().el);


            var histOptions = {startLabel: "Start NMD:", endLabel: "End NMD:", startId: "startNMD", endId: "endNMD",
                    xAxis_Label: "Normalized Medline Distance(NMD)", yAxis_Label: "# of Terms",
                    width: 700, height: 200};
            this.histogramView = new PC.HistogramFilterView({config:histOptions, model: this.model.plotData});
            this.$el.find("#queryFilterHistogramView").html(this.histogramView.render().el);

            this.updateItemsSelected();
            return this;

        },



        events: {
            "click button.close": "close",
            "click button.#closeQueryFilter": "close",
            "filterChange": "updateItemsSelected",
            "click [data-toggle='tab']": "updateItemsSelected",
            "tableSelectionChange": "updateItemsSelected",
            "click button.#drawNetworkBtn": "triggerDrawNetwork",
            "show #qfTableTab": "showTable"


        },

        updateItemsSelected: function(event){
            var total=0;
            if(event != undefined && (event.currentTarget.id == "qfTableTab" || event.type=="tableSelectionChange")){
               total = this.getDataTableTotalSelected();

            }
            else{
                total= this.getHistogramTotalSelected();

            }
            $("#totalItems").text(total);
            if(total < 60 && total > 0){
                $("#drawNetworkBtn").attr("disabled",false);
            }
            else{
                $("#drawNetworkBtn").attr("disabled",true);
            }
        },

        triggerDrawNetwork: function(event){
            $(this.el).trigger("networkNodesSelected",this);

        },

        showTable: function(){
            if(this.tableView.oTable != null){
                this.tableView.oTable.fnAdjustColumnSizing();

            }

        },

        getHistogramTotalSelected: function(){
                var start=$("#startNMD").val();
                var end=$("#endNMD").val();
                var itemsSelected = $.grep(this.model.tableData, function (item,index){
                    if(item.nmd >=start && item.nmd <= end)
                        return true;
                    else
                        return false;
                });

                this.selectedNodes = itemsSelected;
                return itemsSelected.length;
            },

        getDataTableTotalSelected: function(){
            var that = this;
             var selected = {};

            this.tableView.oTable.$('input').each(
                 function(index){
                     if(this.checked){
                         selected[that.tableView.oTable.fnGetData(this.parentNode.parentNode).name]=0;
                     }
                 });

            var itemsSelected = $.grep(this.model.tableData, function (item,index){
                if(selected[item.name] != null)
                    return true;
                else
                    return false;
            });

            this.selectedNodes = itemsSelected;
            return itemsSelected.length;
        },

        beforeClose: function(){
            this.tableView.close();
            this.histogramView.close();
        }


    });
