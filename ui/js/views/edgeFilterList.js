//this view has an EdgeCollection model
PC.EdgeFilterListView = Backbone.View.extend({
    tagName: 'ul',
    className: 'unstyled',

    initialize: function(){
        this.model.bind("reset", this.render, this);
    },

    events:{
        'filterChange' : "triggerNetworkFilter"
    },

    triggerNetworkFilter: function(){
        $(this.el).trigger('networkFilterChange',{edge:[{attr:"nmd",start:this.nmdFilter.histogramView.filterStart,end:this.nmdFilter.histogramView.filterEnd},
            {attr:"cc",start:this.ccFilter.histogramView.filterStart, end:this.ccFilter.histogramView.filterEnd},
            {attr:"pf1_count",start:this.pdFilter.histogramView.filterStart, end:this.pdFilter.histogramView.filterEnd},
            {attr:"pf2_count",start:this.pdFilter.histogramView.filterStart, end:this.pdFilter.histogramView.filterEnd}]});
    },

    render: function(width,height){
        var nmdHistOptions = {startLabel: "Start:", endLabel: "End:", startId: "startEdgeNMD", endId: "endEdgeNMD",
            xAxis_Label: "Normalized Medline Distance(NMD)", yAxis_Label: "# of Edges",
            width: width, height: Math.min(height/3,150), selectbarw: 2, textinputclass: "input-mini", labelSize: "10px", axisfontsize: "8px", axislabelfontsize: "10px"};
        var ccHistOptions = {startLabel: "Start:", endLabel: "End:", startId: "startEdgeCC", endId: "endEdgeCC",
            xAxis_Label: "Term Combo Count", yAxis_Label: "# of Edges",
            width: width, height: Math.min(height/3,150), selectbarw: 2, textinputclass: "input-mini", labelSize: "10px",axisfontsize: "8px", axislabelfontsize: "10px",
        initialstart: 2};

        var pdHistOptions = {startLabel: "Start:", endLabel: "End:", startId: "startEdgePD", endId: "endEdgePD",
            xAxis_Label: "Protein Domain Interaction Counts", yAxis_Label: "# of Edges",
            width: width, height: Math.min(height/3,150), selectbarw: 2, textinputclass: "input-mini", labelSize: "10px",axisfontsize: "8px", axislabelfontsize: "10px",
            initialstart: 2};
        this.nmdFilter = new PC.FilterItemView({model: this.model, filterAtt: {name: ["nmd"], displayName: "NMD"}, histOptions: nmdHistOptions});
        $(this.el).append(this.nmdFilter.render().el);
        this.ccFilter = new PC.FilterItemView({model: this.model, filterAtt: {name: ["cc"], displayName: "Combo Count"}, histOptions: ccHistOptions});
        $(this.el).append(this.ccFilter.render().el);
        this.pdFilter = new PC.FilterItemView({model: this.model,
            filterAtt: {name:["pf1_count","pf2_count"], displayName: "Protein Domain Interactions"}, histOptions: pdHistOptions});
        $(this.el).append(this.pdFilter.render().el);
        return this;
    }
});
