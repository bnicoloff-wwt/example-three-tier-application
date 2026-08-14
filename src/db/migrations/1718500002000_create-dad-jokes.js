exports.up = (pgm) => {
  pgm.createTable('dad_jokes', {
    id: { type: 'serial', primaryKey: true },
    setup: { type: 'text', notNull: true },
    punchline: { type: 'text', notNull: true },
    rating: { type: 'integer', notNull: true, default: 0 },
    rating_count: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('now()') },
  });

  // Add index for better query performance
  pgm.createIndex('dad_jokes', 'rating');
  pgm.createIndex('dad_jokes', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('dad_jokes');
};
