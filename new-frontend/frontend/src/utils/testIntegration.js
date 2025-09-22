// Test script for backend integration
import apiService from '../services/api';

export const testBackendIntegration = async () => {
  console.log('Testing backend integration...');
  
  try {
    // Test 1: Get streams
    console.log('1. Testing getStreams...');
    const streams = await apiService.getStreams();
    console.log('✅ getStreams successful:', streams.length, 'streams found');
    
    // Test 2: Get stream names
    console.log('2. Testing getStreamNames...');
    const streamNames = await apiService.getStreamNames();
    console.log('✅ getStreamNames successful:', streamNames);
    
    // Test 3: Filter streams (if we have stream names)
    if (streamNames.length > 0) {
      console.log('3. Testing filterStreams...');
      const filteredStreams = await apiService.filterStreams([streamNames[0]]);
      console.log('✅ filterStreams successful:', filteredStreams.length, 'filtered entries');
    }
    
    console.log('🎉 All backend integration tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Backend integration test failed:', error);
    return false;
  }
};

// Auto-run test when imported
if (typeof window !== 'undefined') {
  testBackendIntegration();
}
