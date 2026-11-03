const GRAPHQL_ENDPOINT = '/graphql';

export async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('bookin_access_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    const errorMsg = result.errors.map((e) => e.message).join(', ');
    throw new Error(errorMsg);
  }

  return result.data;
}
