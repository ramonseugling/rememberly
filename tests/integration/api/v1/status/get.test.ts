describe('GET /api/v1/status', () => {
  it('deve retornar status 200 com informações do banco', async () => {
    const response = await fetch('http://localhost:3000/api/v1/status');

    expect(response.status).toBe(200);

    const body = await response.json();

    expect(body.updated_at).toBeDefined();
    expect(new Date(body.updated_at).toISOString()).toBe(body.updated_at);
    expect(body.dependencies.database.version).toBeDefined();
  });
});
