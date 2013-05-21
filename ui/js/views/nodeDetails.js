PC.NodeDetailsView = Backbone.View.extend({
    template: _.template($("#nodeDetailsTemplate").html()),

    initialize: function() {
        this.$el.html(this.template());
    },


    render: function() {

        var gv = this;


        var tabs='<ul class="nav nav-tabs" id="modalNodeDetailsTabs">' +
            '<li class="active"><a id="medlineTab" href="#medlineTabView" data-toggle="tab">Medline Documents</a></li>' +
            '<li><a id="domainTab" href="#domainTableView" data-toggle="tab">Data Table</a></li>' +
        '</ul>' +
        '<div id="nodeDetailsTabContent" class="tab-content"></div>';

        this.$el.find("#nodeDetailsModalBody").html(tabs);

        this.$el.find("#nodeDetailsTabContent").html(new PC.TabTableListView({model: this.model}).render().el);


        return this;

    }

});
