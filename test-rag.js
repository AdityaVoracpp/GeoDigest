const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const USERNAME = `testuser_${Date.now()}`;
const PASSWORD = 'password123';

async function runTest() {
  try {
    console.log('--- Starting RAG Test ---');
    
    // 1. Register User
    console.log(`\nRegistering user: ${USERNAME}`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, { username: USERNAME, password: PASSWORD });
    console.log(`Register status: ${regRes.status}`);
    
    const token = regRes.data.token; // Registration returns token too
    console.log('Got JWT token.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Add Article 1 (Space)
    const article1 = {
      title: 'NASA Discovers New Exoplanet',
      url: 'http://example.com/space',
      summary: 'NASA has discovered a new Earth-like exoplanet in the habitable zone of a red dwarf star 40 light-years away. Scientists believe it might have liquid water.',
    };
    console.log('\nAdding Article 1 (Space)...');
    const add1 = await axios.post(`${BASE_URL}/users/favorites`, article1, { headers });
    console.log(`Article 1 added (status: ${add1.status})`);

    // 3. Add Article 2 (Ocean)
    const article2 = {
      title: 'Deep Sea Explorers Find New Octopus Species',
      url: 'http://example.com/ocean',
      summary: 'A team of marine biologists mapping the Mariana Trench have discovered a new ghost-like octopus species living at extreme depths.',
    };
    console.log('Adding Article 2 (Ocean)...');
    const add2 = await axios.post(`${BASE_URL}/users/favorites`, article2, { headers });
    console.log(`Article 2 added (status: ${add2.status})`);
    
    // Wait a few seconds for Atlas to index the newly inserted vectors
    console.log('\nWaiting 5 seconds for Atlas Vector Search to index the new documents...');
    await new Promise(r => setTimeout(r, 5000));

    // 4. Ask Question
    const question = 'Are there any planets with water?';
    console.log(`\nAsking RAG question: "${question}"`);
    
    const askRes = await axios.post(`${BASE_URL}/users/ask`, { question }, { headers });
    const data = askRes.data;
    
    console.log(`Ask status: ${askRes.status}`);
    console.log('Answer:', data.answer);
    console.log('Sources Used:', data.sourcesUsed);
    console.log('Articles Searched:', data.articlesSearched);

    if (data.answer && data.answer.toLowerCase().includes('exoplanet')) {
      console.log('\n✅ TEST PASSED: The AI correctly used the space article to answer the question!');
    } else {
      console.log('\n❌ TEST FAILED or INCONCLUSIVE: Did not find expected keywords in the answer.');
    }
  } catch (err) {
    console.error('\n❌ ERROR OCCURRED:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

runTest();
