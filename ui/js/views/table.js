//this view renders a data tables table.
PC.TableView = Backbone.View.extend({

    initialize: function(config){
        //model contains the data for the table
        this.dataConfig = config.dataConfig; //contains the header data for the table['Name','Aliases','Term Single Count','Term Combo Count','NMD']
        this.checkbox=config.checkbox;   //true if the first column should be a checkbox selection
        this.tableId = config.tableId; //id of the table
        this.expandedConfig = config.expandedConfig //contains the data config for any data that should show up in row details


    },

    render: function(){

        var thisView = this;

        //now make data table for modal window
        var table='';


        if(this.checkbox){
            table='<table class="table table-striped table-bordered" width="700px"  id="' + this.tableId + '">'+
                '</table>';
        }
        else{
            table ='<table class="table nocheckbox_table table-striped table-bordered" width="700px"  id="' + this.tableId + '">'+
                '</table>';
        }

        this.$el.html(table);
        var aoColumns = [];
        if(this.checkbox){
            aoColumns.push( { "sSortDataType": "dom-checkbox", "sTitle": '<input id="check_all" type="checkbox"/>',
                "sWidth": "10px","sDefaultContent":'<input class="tableCheckbox" type="checkbox" />'});
        }
        if(this.expandedConfig != null && this.expandedConfig.length > 0){
            aoColumns.push( {"mDataProp": null,
                "sWidth":"10px",
                               "sClass": "control center",
                                "sDefaultContent": '<img src="./images/details_open.png">'});
        }
        for(var k=0; k < thisView.dataConfig.length; k++){
            var dataProp=thisView.dataConfig[k].propName;
            if(thisView.dataConfig[k].urlLink != null){
                   dataProp="<a href='" + thisView.dataConfig[k].urlLink + dataProp + "' target='_blank'>"+dataProp + "</a>";
            }
            aoColumns.push({"sTitle": thisView.dataConfig[k].headerName,"mDataProp": dataProp,
            "sWidth":thisView.dataConfig[k].headerWidth,"sDefaultContent": ""});
        }

        this.oTable=this.$el.find("#" + this.tableId).dataTable({
            "sDom": "<'row-fluid'<'span3'l><'span4'f>r>t<'row-fluid'<'span3'i><'span4'p>>",
            "aaData": this.model,
            "sPaginationType": "bootstrap",
            "bAutoWidth":false,
            "oLanguage": {
                "sLengthMenu": "_MENU_ records per page"
            },

            "aoColumns":aoColumns,
          //  sAjaxSource: "",
          //  sAjaxDataProp: "",
            //fnServerData: function(sSource,aoData,fnCallback){
           //     console.log(this.model);
           //     fnCallback(this.model.toJSON());
           // },

            "fnInitComplete"  : function () {
                var that=this;
                this.fnAdjustColumnSizing(true);
                if(thisView.checkbox){
                thisView.$el.find('#check_all').click( function() {
                    $('input', that.fnGetNodes()).attr('checked',this.checked);
                    thisView.$el.trigger("tableSelectionChange");
                } );
                this.$('.tableCheckbox').click(function(){
                    thisView.$el.trigger("tableSelectionChange");
                });
                }
                else{
                    this.$('tbody tr').click(function(item){

                    });
                }

            }
        });

        thisView.anOpen=[];
        if(thisView.expandedConfig != null && thisView.expandedConfig.length > 0){
            $("#" + this.tableId + " td.control").live('click', function(){
                var nTr = this.parentNode;
                var i = $.inArray(nTr,thisView.anOpen);

                var table = $('#' + thisView.tableId).dataTable();
                if(i == -1){  //this item was not in the open list, open it
                    $('img', this).attr('src',"./images/details_close.png" );

                    table.fnOpen(nTr, thisView.formatDetails(table, nTr), 'details');
                    thisView.anOpen.push(nTr);
                }
                else{
                    $('img',this).attr('src',"./images/details_open.png" );
                    table.fnClose(nTr);
                    thisView.anOpen.splice(i,1);
                }
            });
        }

        return this;
    },



    formatDetails: function(oTable, row){
         var data = oTable.fnGetData(row);
        var sOut = '<div class="innerDetails">'+
            '<table cellpadding="5" cellspacing="0" border="0" style="padding-left:50px;">';
        for(var k=0; k< this.expandedConfig.length; k++){
            sOut+='<tr><td>' + data[this.expandedConfig[k].propName] + '</td></tr>';
        }
        sOut+='</table></div>';
        return sOut;
    },

    beforeClose: function(){
        var table = $("#" + this.tableId).dataTable();
        table.fnDestroy(true);
    }//,

    //updateView: function(model){
    //    this.model=model;
    //    var table = $("#" + this.tableId).dataTable();
    //    table.fnClearTable();
    //    table.fnAddData(this.model);
    //    table.fnDraw(true);
    //    return this;
   // }

});

