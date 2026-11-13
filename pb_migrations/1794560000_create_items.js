/// PocketBase v0.23+ JavaScript migration. Apply beside your PocketBase executable.
migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  const own = "@request.auth.id != '' && owner = @request.auth.id"
  const collection = new Collection({
    type: 'base', name: 'items',
    listRule: own, viewRule: own, deleteRule: own,
    createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
    updateRule: own + ' && @request.body.owner:changed = false',
    fields: [
      { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { name: 'title', type: 'text', required: true, max: 250 },
      { name: 'kind', type: 'select', required: true, maxSelect: 1, values: ['information', 'event', 'checklist', 'link', 'other'] },
      { name: 'content', type: 'text', max: 100000 },
      { name: 'tags', type: 'text', max: 2000 },
      { name: 'starts_at', type: 'date' },
      { name: 'data', type: 'json', maxSize: 100000 },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
    ],
    indexes: ['CREATE INDEX idx_items_owner_kind ON items (owner, kind)', 'CREATE INDEX idx_items_starts_at ON items (starts_at)']
  })
  app.save(collection)
}, (app) => {
  app.delete(app.findCollectionByNameOrId('items'))
})
