const fs = require('fs');
const axios = require('axios');
const path = require('path');

const repoName = process.env.REPO_FULL_NAME;
const segmentApiToken = process.env.SEGMENT_TOKEN;
const segmentBaseUrl = `https://api.segmentapis.com`;

const files = process.argv.slice(2);

async function findFunctionId(functionName, resourceType) {
  try {
    const workspaceResult = await axios.get(`${segmentBaseUrl}/`, {
      headers: { 'Authorization': `Bearer ${segmentApiToken}` }
    });
    const workspaceName = workspaceResult.data.data.workspace.name;

    const response = await axios.get(`${segmentBaseUrl}/functions?pagination[count]=200&resourceType=${resourceType}`, {
      headers: { 'Authorization': `Bearer ${segmentApiToken}` }
    });
    const functionObj = response.data.data.functions.find(f => f.displayName === `${functionName} (${workspaceName})`);

    return functionObj ? functionObj.id : null;

  } catch (error) {
    console.error(`Error fetching functions: ${error.message} - ${segmentApiToken}`);

    return null;
  }
}

async function createOrUpdateFunction(filePath, functionName, functionType, content) {
  var functionId = await findFunctionId(functionName, functionType);
  const isUpdate = functionId != null;
  const url = `${segmentBaseUrl}/functions${isUpdate ? `/${functionId}` : ''}`;
  const method = isUpdate ? 'patch' : 'post';

  try {
    const response = await axios({
      method: method,
      url: url,
      headers: {
        'Authorization': `Bearer ${segmentApiToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        displayName: functionName,
        code: content,
        resourceType: functionType
      }
    });

    functionId = functionId ? functionId : response.data.data.function.id;
    console.log(`Function ${isUpdate ? 'updated' : 'created'}: ${functionName}`);
  } catch (error) {
    console.error(`Error ${isUpdate ? 'updating' : 'creating'} function: ${error.message}`);
  }

  try {
    const response = await axios({
      method: 'POST',
      url: `${segmentBaseUrl}/functions/${functionId}/deploy`,
      headers: {
        'Authorization': `Bearer ${segmentApiToken}`
      }
    });
  } catch (error) {
    console.log(`Error deploying function: ${functionId} with name ${functionName}`);
  }
}

async function syncFunction(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const functionNameMatch = content.match(/\/\/ FUNCTION_NAME: (.+)/);
  if (!functionNameMatch) {
    console.log(`Function name comment not found in ${filePath}`);
    return;
  }

  const functionName = functionNameMatch[1];
  const directory = path.basename(path.dirname(filePath));
  const functionTypeMap = {
    'source': 'SOURCE',
    'destination': 'DESTINATION',
    'insert': 'INSERT_DESTINATION',
  };
  const functionType = functionTypeMap[directory];
  
  if (!functionType) {
    console.log(`Invalid function type for path: ${filePath}`);
    return;
  }

  const fileUrl = `https://github.com/${repoName}/blob/main/${filePath}`;
  const comment = `// * NOTICE: This file is managed automatically through GitHub.\n` +
    `// * Do not update it here! It will be overwritten on next push!\n` +
    `// * See: ${fileUrl}\n`
  
  const modifiedContent = `${comment}\n${content}`
  await createOrUpdateFunction(filePath, functionName, functionType, modifiedContent);
}

files.forEach(syncFunction);