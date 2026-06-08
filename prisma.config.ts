const databaseUrl = process.env.DATABASE_URL;

export default {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
};



