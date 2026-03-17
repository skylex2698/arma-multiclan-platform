const startTestServer = async (app) => {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, () => resolve(instance));
    instance.on('error', reject);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('No se pudo obtener un puerto de test');
  }

  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    server,
    baseUrl,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
};

module.exports = {
  startTestServer,
};
