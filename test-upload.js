// Simple test script to debug the upload endpoint
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUpload() {
  try {
    // Create a simple text file for testing
    const testContent = 'This is a test file for upload';
    fs.writeFileSync('test-file.txt', testContent);
    
    const formData = new FormData();
    formData.append('files', fs.createReadStream('test-file.txt'));
    
    console.log('Making request to /api/upload...');
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.log('Failed to parse as JSON:', e.message);
    }
    
    // Clean up
    fs.unlinkSync('test-file.txt');
  } catch (error) {
    console.error('Test error:', error);
  }
}

testUpload();
