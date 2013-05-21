PC.FilterItemView = Backbone.View.extend({

    tagName: "li",

    initialize: function(filterOptions){
        this.plotData = [];
        for(var i in filterOptions.filterAtt.name){
            var filterName = filterOptions.filterAtt.name[i];
            this.plotData.push($.map(filterOptions.model.models, function(item,index){
                return item[filterName];
            }));
        }
        this.plotData = d3.merge(this.plotData);
        this.histOptions = filterOptions.histOptions;
    },

    render: function(){
        this.histogramView = new PC.HistogramFilterView({config: this.histOptions, model: this.plotData});
        $(this.el).html(this.histogramView.render().el);
        return this;
    }

});
