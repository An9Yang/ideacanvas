require('dotenv').config();
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

async function testAzureStorage() {
  console.log('Testing Azure Storage connection...\n');
  
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
  
  console.log('Configuration:');
  console.log(`Account Name: ${accountName}`);
  console.log(`Container Name: ${containerName}`);
  console.log(`Key Length: ${accountKey ? accountKey.length : 0} characters\n`);
  
  if (!accountName || !accountKey) {
    console.error('❌ Missing Azure Storage credentials');
    return;
  }
  
  try {
    // Create blob service client
    const credential = new StorageSharedKeyCredential(accountName, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      credential
    );
    
    console.log('✅ Created BlobServiceClient successfully\n');
    
    // Get container client
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Check if container exists
    console.log('Checking container existence...');
    const exists = await containerClient.exists();
    
    if (!exists) {
      console.log(`Container '${containerName}' does not exist. Creating...`);
      await containerClient.create({
        access: 'container', // Public read access
      });
      console.log('✅ Container created successfully\n');
    } else {
      console.log(`✅ Container '${containerName}' exists\n`);
    }
    
    // Test write operation
    console.log('Testing write operation...');
    const testBlobName = 'test/connection-test.json';
    const testData = {
      message: 'Azure Storage connection test',
      timestamp: new Date().toISOString(),
      project: 'IdeaCanvas'
    };
    
    const blockBlobClient = containerClient.getBlockBlobClient(testBlobName);
    const content = JSON.stringify(testData, null, 2);
    
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json',
      },
    });
    
    console.log(`✅ Successfully wrote test file: ${testBlobName}\n`);
    
    // Test read operation
    console.log('Testing read operation...');
    const downloadResponse = await blockBlobClient.download(0);
    const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
    const downloadedData = JSON.parse(downloadedContent);
    
    console.log('Downloaded content:');
    console.log(downloadedData);
    console.log('\n✅ Successfully read test file\n');
    
    // List blobs
    console.log('Listing blobs in container...');
    let count = 0;
    for await (const blob of containerClient.listBlobsFlat()) {
      console.log(`  - ${blob.name} (${blob.properties.contentLength} bytes)`);
      count++;
      if (count >= 10) {
        console.log('  ... (showing first 10 blobs)');
        break;
      }
    }
    
    if (count === 0) {
      console.log('  (No blobs found)');
    }
    
    console.log('\n🎉 All tests passed! Azure Storage is configured correctly.');
    
  } catch (error) {
    console.error('\n❌ Error testing Azure Storage:');
    console.error(error.message);
    
    if (error.statusCode === 403) {
      console.error('\n⚠️  This appears to be an authentication error. Please check:');
      console.error('  1. The storage account name is correct');
      console.error('  2. The access key is correct and not expired');
      console.error('  3. The storage account firewall allows your IP');
    }
  }
}

async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString());
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}

// Run the test
testAzureStorage();