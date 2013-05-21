 PC.DeNovoPromptView = Backbone.View.extend({
        template: _.template($("#deNovoPromptTemplate").html()),

        initialize: function() {
            this.$el.html(this.template());

        },

        events: {
         "click button.#deNovoPromptYesBtn"    : "triggerDeNovo"
        },


        triggerDeNovo: function(event){
            $(this.el).trigger("deNovoSearch",this);

        }

    });
