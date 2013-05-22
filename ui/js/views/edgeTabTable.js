//this view renders a table in each tab, one table per data-type
PC.EdgeTabTableView = Backbone.View.extend({
    template: _.template($("#edgeDetailsTemplate").html()),

    initialize: function(){
        this.$el.html(this.template());
    },

    events: {
        "click button.close": "close",
        "click button.#closeEdgeDetails": "close"
    },

    render: function(){

        var tabs = '<ul class="nav nav-tabs" id="edgeDetailsTabs">' +
            '<li class="active"><a id="eqfDocTab" href="#edgedocTableView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="eqfNMDTab" href="#edgenmdTableView" data-toggle="tab">NMD Connections</a></li>' +
            '<li><a id="eqfDomineTab" href="#edgedomineTableView" data-toggle="tab">Domine Connections</a></li>' +
            '<li><a id="eqfPWTab" href="#edgepwTableView" data-toggle="tab">Pairwise Connections</a></li>' +
            '</ul>' +
            '<div class="tab-content">' +
            '<div class="tab-pane active queryfiltertable" id="edgedocTableView"></div>' +
            '<div class="tab-pane queryfiltertable" id="edgenmdTableView">' +
            '</div>' +
            '<div class="tab-pane queryfiltertable" id="edgedomineTableView"></div>' +
            '<div class="tab-pane queryfiltertable" id="edgepwTableView"></div>' +
            '</div>';

        this.$el.find("#edgeDetailsModalBody").html(tabs);

        var docConfig = [{headerName:'PMID', headerWidth: '10%', propName:'pmid', urlLink:'http://www.ncbi.nlm.nih.gov/pubmed/'},
            {headerName:'Title', headerWidth: '50%', propName: 'article_title'},
            {headerName:'Pub. Year', headerWidth: '10%', propName: 'pub_date_year'}];

        var expConfig = [{propName:'abstract_text'}];

        this.docView = new PC.TableView({dataConfig: docConfig, expandedConfig: expConfig, checkbox: false, tableId: "edgedocTable",model: this.model.docs});
        this.$el.find("#edgedocTableView").html(this.docView.render().el);

        var nmdConfig = [{headerName:'Term1', headerWidth: '20%', propName:'term1'},
            {headerName: 'Term2', headerWidth: '20%', propName: 'term2'},
            {headerName:'Term Single Count', headerWidth: '10%', propName: 'termcount'},
            {headerName:'Term Combo Count', headerWidth: '10%', propName: 'combocount'},
            {headerName:'NMD', headerWidth: '20%', propName: 'nmd'}];

        this.nmdView = new PC.TableView({dataConfig: nmdConfig, checkbox: false, tableId: "edgenmdTable",model: this.model.nmdDetailsModel});
        this.$el.find("#edgenmdTableView").html(this.nmdView.render().el);

        var dataConfig = [{headerName:'Term1', headerWidth: '10%', propName:'term1'},
            {headerName:'Term2', headerWidth: '10%', propName: 'term2'},
            {headerName:'UniProt ID1', headerWidth: '10%', propName: 'uni1'},
            {headerName:'UniProt ID2', headerWidth: '10%', propName: 'uni2'},
            {headerName:'Domain 1', headerWidth: '10%', propName: 'pf1'},
            {headerName:'Domain 2', headerWidth: '10%', propName: 'pf2'},
            {headerName:'Type', headerWidth: '10%', propName: 'type'},
            {headerName:'Domain 1 Count', headerWidth: '10%', propName: 'pf1_count'},
            {headerName:'Domain 2 Count', headerWidth: '10%', propName: 'pf2_count'}];

        this.domineView = new PC.TableView({dataConfig: dataConfig, checkbox: false, tableId: "edgedomineTable",model: this.model.domineDetailsModel});
        this.$el.find("#edgedomineTableView").html(this.domineView.render().el);

        var pwConfig = [{headerName:'Feature 1', headerWidth: '40%', propName:'term1'},
            {headerName: 'Feature 2', headerWidth: '40%', propName: 'term2'},
            {headerName:'-log10(pvalue)', headerWidth: '10%', propName: 'pvalue'},
            {headerName:'Correlation', headerWidth: '10%', propName: 'correlation'}];

        this.pwView = new PC.TableView({dataConfig: pwConfig, checkbox: false, tableId: "edgepwTable",model: this.model.pwDetailsModel});
        this.$el.find("#edgepwTableView").html(this.pwView.render().el);

        return this;
    },


    beforeClose: function(){
        this.docView.close();
        this.nmdView.close();
        this.domineView.close();

        this.pwView.close();
    }
});
