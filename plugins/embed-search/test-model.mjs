import { pipeline } from '@huggingface/transformers';

async function main() {
  console.log('Loading model...');
  const extract = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('Model loaded.');
  
  const text = 'How do I configure agents in opencode?';
  const result = await extract(text, { pooling: 'mean', normalize: true });
  console.log('Embedding computed.');
  console.log('Shape:', result.tolist().length, 'dimensions');
  console.log('First 5 values:', result.tolist().slice(0, 5));
}

main().catch(err => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
