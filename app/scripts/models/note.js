/*global define*/
define([
    'underscore',
    'backbone',
    'indexedDB',
    'migrations/note',
    'models/notebook',
    'collections/notebooks',
    'collections/tags',
    'backbone.assosiations'
    // 'localStorage',
], function (_, Backbone, IndexedDB, NotesDB, Notebook, Notebooks, Tags) {
    'use strict';

    /**
     * Notes model
     */
    // var Model = Backbone.Model.extend({
    var Model = Backbone.AssociatedModel.extend({

        idAttribute: 'id',

        // localStorage: new Backbone.LocalStorage('vimarkable.notes'),
        database  : NotesDB,
        storeName : 'notes',

        defaults: {
            'id'            :  undefined,
            'title'         :  '',
            'content'       :  '',
            'taskAll'       :  0,
            'taskCompleted' :  0,
            'created'       :  null,
            'updated'       :  null,
            'notebookId'    :  0,
            'tags'          :  [],
            'isFavorite'    :  0,
            'trash'         :  0
        },

        relations: [
            {
                type           : Backbone.One,
                key            : 'notebookId',
                collectionType : Notebooks,
                relatedModel   : Notebook
            }
        ],

        validate: function (attrs) {
            var errors = [];
            if (attrs.title === '') {
                errors.push('title');
            }

            if (errors.length > 0) {
                return errors;
            }
        },

        initialize: function () {
            this.on('update.note', this.setUpdate);
            this.on('changed:notebookId', this.updateNotebookCount);

            if (this.isNew()) {
                this.set('created', Date.now());
                this.setUpdate();
            }
        },

        /**
         * Tags
         */
        getTags: function () {
            var tagsCollection = new Tags(),
                tags = [];

            tagsCollection.fetch();

            if (this.get('tags').length === 0) {
                return tags;
            }

            _.each(this.get('tags'), function (id) {
                if (id !== undefined && id !== '') {
                    tags.push(tagsCollection.get(id));
                }
            });

            return tags;
        },

        updateNotebookCount: function (args) {
            var notebook = this.get('notebookId');

            if (args.last !== 0) {
                args.last.trigger('removed:note');
            }

            if (notebook !== 0) {
                notebook.trigger('add:note');
            }
        },

        /**
         * Note's last modified time
         */
        setUpdate: function () {
            this.set('updated', Date.now());
        },

        toTrash: function () {
            // Destroy if note is already in trash
            if (this.get('trash') === 1) {
                this.destroy();
            } else {
                this.save({'trash' : 1});
            }
        },

        next: function () {
            if (this.collection) {
                return this.collection.at(this.collection.indexOf(this) + 1);
            }
        },

        prev: function () {
            if (this.collection) {
                return this.collection.at(this.collection.indexOf(this) - 1);
            }
        }

    });

    return Model;
});
