

import { AgentFactory } from '../src/agents/agent.factory';

async function testAgent() {
  console.log('🧪 Testing Mistral Agent...\n');

  try {
    const agent = AgentFactory.getAgent('code_review');
    
    const result = await agent.process({
      code: 'function add(a, b) { return a + b; }',
      language: 'javascript',
      userId: 'test-user'
    });

    console.log('✅ Success:', result.success);
    console.log('📝 Response:', result.result.substring(0, 300));
    console.log('📊 Model:', result.metadata.model);
    console.log('⏱️ Duration:', result.metadata.duration, 'ms');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAgent();