/// Adds only missing collections. Existing schemas and records are preserved.
migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  const own = "@request.auth.id != '' && owner = @request.auth.id"
  const definitions = [
    { name: 'tasks', id: 'v4ulttasks00001', fields: [
      { name: 'status', type: 'select', required: true, maxSelect: 1, values: ['todo', 'doing', 'done'] },
      { name: 'due_date', type: 'date' }
    ] },
    { name: 'notes', id: 'v4ultnotes00001', fields: [
      { name: 'content', type: 'text', max: 100000 },
      { name: 'tags', type: 'text', max: 2000 }
    ] }
  ]
  for (const definition of definitions) {
    let exists = false
    try { app.findCollectionByNameOrId(definition.name); exists = true } catch (e) {
      if (!String(e).includes('no rows')) throw e
    }
    if (exists) continue
    app.save(new Collection({
      type: 'base', name: definition.name, id: definition.id,
      listRule: own, viewRule: own, deleteRule: own,
      createRule: "@request.auth.id != '' && @request.body.owner = @request.auth.id",
      updateRule: own + ' && @request.body.owner:changed = false',
      fields: [
        { name: 'owner', type: 'relation', required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        { name: 'title', type: 'text', required: true, max: 250 },
        ...definition.fields,
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
      ]
    }))
  }
}, (app) => {
  // A rollback is intentionally blocked to protect saved personal data.
  throw new Error('This additive migration preserves personal data. Restore a backup or review collections manually instead of rolling it back.')
})
