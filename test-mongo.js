const mongoose = require('mongoose');
const { MONGODB_URI } = require('./src/config/env');
const User = require('./src/models/User');
const { Favorite } = require('./src/models/Favorite');
const { generateEmbedding, answerFromFavorites } = require('./src/services/aiService');

async function runTest() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!');

  const username = `test_${Date.now()}`;
  console.log(`Creating dummy user: ${username}`);
  const user = await User.create({ username, password: 'password' });

  console.log('Generating embedding for Article 1 (Space)...');
  const emb1 = await generateEmbedding('NASA Discovers New Exoplanet NASA has discovered a new Earth-like exoplanet in the habitable zone of a red dwarf star 40 light-years away. Scientists believe it might have liquid water.');
  
  console.log('Generating embedding for Article 2 (Ocean)...');
  const emb2 = await generateEmbedding('Deep Sea Explorers Find New Octopus Species A team of marine biologists mapping the Mariana Trench have discovered a new ghost-like octopus species living at extreme depths.');

  console.log('Saving favorites...');
  await Favorite.create([
    {
      userId: user._id,
      title: 'NASA Discovers New Exoplanet',
      url: 'http://example.com/space',
      summary: 'NASA has discovered a new Earth-like exoplanet with liquid water.',
      embedding: emb1
    },
    {
      userId: user._id,
      title: 'Deep Sea Explorers Find New Octopus Species',
      url: 'http://example.com/ocean',
      summary: 'Biologists found a new octopus in the Mariana Trench.',
      embedding: emb2
    }
  ]);

  console.log('\n--- Waiting 5 seconds for Atlas Vector Search to index... ---');
  await new Promise(r => setTimeout(r, 5000));

  const question = 'Are there any planets with water?';
  console.log(`\nQuestion: "${question}"`);
  
  const questionEmbedding = await generateEmbedding(question);
  
  console.log('Executing $vectorSearch...');
  let results;
  try {
    results = await Favorite.aggregate([
      {
        $vectorSearch: {
          index: 'favorite_embedding_index',
          path: 'embedding',
          queryVector: questionEmbedding,
          numCandidates: 10,
          limit: 5,
          filter: { userId: user._id }
        }
      },
      {
        $project: { title: 1, score: { $meta: 'vectorSearchScore' } }
      }
    ]);
  } catch (err) {
    console.error('Vector search failed! Is the index created?', err.message);
    process.exit(1);
  }

  console.log(`\nVector Search returned ${results.length} results:`);
  results.forEach(r => console.log(`- [Score: ${r.score?.toFixed(4)}] ${r.title}`));

  if (results.length > 0 && results[0].title.includes('Exoplanet')) {
    console.log('\n✅ TEST PASSED: Space article was retrieved first!');
    
    console.log('\nAsking AI to generate final answer...');
    const aiAnswer = await answerFromFavorites(question, results);
    console.log('\nAI Answer:\n', aiAnswer.answer);
  } else {
    console.log('\n❌ TEST FAILED: Space article was not returned or was not first.');
  }

  console.log('\nCleaning up...');
  await Favorite.deleteMany({ userId: user._id });
  await User.deleteOne({ _id: user._id });
  await mongoose.disconnect();
}

runTest().catch(console.error);
