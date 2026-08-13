exports.up = (pgm) => {
  // Create categories table
  pgm.createTable('categories', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true, unique: true },
    color: { type: 'varchar(7)', notNull: true, default: '#3b82f6' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Add category_id foreign key to tasks table
  pgm.addColumn('tasks', {
    category_id: {
      type: 'integer',
      references: '"categories"(id)',
      onDelete: 'set null',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tasks', 'category_id');
  pgm.dropTable('categories');
};
