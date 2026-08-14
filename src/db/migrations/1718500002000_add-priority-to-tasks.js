exports.up = (pgm) => {
  pgm.addColumn('tasks', {
    priority: {
      type: 'varchar(10)',
      notNull: true,
      default: 'medium',
      check: "priority IN ('low', 'medium', 'high')",
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('tasks', 'priority');
};
