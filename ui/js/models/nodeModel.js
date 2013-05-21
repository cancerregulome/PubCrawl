PC.Node = Backbone.Model.extend({
    initialize: function(attributes){
        for(var key in attributes){
            this[key] = attributes[key];
        }
    }
});

PC.NodeCollection = Backbone.Collection.extend({
    model: PC.Node
});
