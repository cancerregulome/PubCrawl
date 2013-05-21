//this view renders a table in each tab, one table per data-type
PC.NodeTabTableView = Backbone.View.extend({
    template: _.template($("#nodeDetailsTemplate").html()),

    initialize: function(){
        this.$el.html(this.template());
    },

    events: {
        "click button.close": "close",
        "click button.#closeNodeDetails": "close"
    },

    render: function(){


        var tabs = '<ul class="nav nav-tabs" id="nodeDetailsTabs">' +
            '<li class="active"><a id="qfDocTab" href="#docTableView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="qfNMDTab" href="#nmdTableView" data-toggle="tab">NMD Connections</a></li>' +
            '<li><a id="qfDomineTab" href="#domineTableView" data-toggle="tab">Domine Connections</a></li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active queryfiltertable" id="docTableView"></div>' +
            '<div class="tab-pane queryfiltertable" id="nmdTableView">' +
            '</div>' +
            '<div class="tab-pane queryfiltertable" id="domineTableView"></div>' +
            '</div>';

        this.$el.find("#nodeDetailsModalBody").html(tabs);

        var docConfig = [{headerName:'PMID', headerWidth: '10%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '10%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];

        this.docView = new PC.TableView({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "docTable",model: this.model.docs});
        this.$el.find("#docTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Name', headerWidth: '30%', propName:'name'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '10%', propName: 'nmd'}];

        this.nmdView = new PC.TableView({dataConfig: nmdConfig, checkbox: false, tableId: "nmdTable",model: this.model.nmdDetailsModel});
        this.$el.find("#nmdTableView").html(this.nmdView.render().el);

        var dataConfig = [{headerName:'Term1', headerWidth: '30%', propName:'term1'},
            {headerName:'Term2', headerWidth: '10%', propName: 'term2'},
            {headerName:'UniProt ID1', headerWidth: '10%', propName: 'uni1'},
            {headerName:'UniProt ID2', headerWidth: '10%', propName: 'uni2'},
            {headerName:'Domain 1', headerWidth: '10%', propName: 'pf1'},
            {headerName:'Domain 2', headerWidth: '10%', propName: 'pf2'},
            {headerName:'Type', headerWidth: '10%', propName: 'type'},
            {headerName:'Domain 1 Count', headerWidth: '10%', propName: 'pf1_count'},
            {headerName:'Domain 2 Count', headerWidth: '10%', propName: 'pf2_count'}];

        this.domineView = new PC.TableView({dataConfig: dataConfig, checkbox: false, tableId: "domineTable",model: this.model.domineDetailsModel});
        this.$el.find("#domineTableView").html(this.domineView.render().el);

        return this;
    },

    beforeClose: function(){
        this.docView.close();
        this.nmdView.close();
        this.domineView.close();
    }
});
