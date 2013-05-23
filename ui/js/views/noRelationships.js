PC.NoRelationshipsView = Backbone.View.extend({
    template: _.template($("#noRelationshipsTemplate").html()),

    initialize: function() {
        this.$el.html(this.template());

    }

});
