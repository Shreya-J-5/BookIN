const ENDPOINTS = [
  '/graphql',
  'http://127.0.0.1:8000/graphql',
  'http://localhost:8000/graphql',
];

export async function graphqlRequest(query, variables = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  const authToken = token || localStorage.getItem('bookin_access_token');
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const payload = JSON.stringify({ query, variables });
  let lastError = null;

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: payload,
      });

      const text = await response.text();
      if (!text || text.trim() === '') {
        // Empty response from broken proxy; try direct fallback
        continue;
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (jsonErr) {
        // Non-JSON response (e.g., 502/504 HTML error page from proxy)
        continue;
      }

      if (result.errors && result.errors.length > 0) {
        const errorMsg = result.errors.map((e) => e.message).join(', ');
        throw new Error(errorMsg);
      }

      return result.data;
    } catch (err) {
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('Failed to') &&
        !err.message.includes('NetworkError')
      ) {
        // Legitimate application/GraphQL business error (e.g. "Invalid email or password.")
        throw err;
      }
      lastError = err;
    }
  }

  throw new Error(
    'Unable to connect to the BookIN backend API. Please make sure the backend server is running on http://127.0.0.1:8000.'
  );
}

