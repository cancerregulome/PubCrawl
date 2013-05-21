PC.Edge = Backbone.Model.extend({
    initialize: function(attributes){
        for(var key in attributes){
            this[key] = attributes[key];
        }
    }
});

PC.EdgeCollection = Backbone.Collection.extend({
    model:PC.Edge
});
