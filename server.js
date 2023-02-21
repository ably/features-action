const path = require('path');
const https = require('node:https');
const { build, ManifestObjects } = require('@ably/features-core/html-matrix-build');

const resolveSource = (fileName) => path.resolve(__dirname, fileName);

// TODO single manifest from .ably/capabilities.yaml
// TODO canonical from https://github.com/ably/features/raw/main/sdk.yaml :
// - that URL gives 302 to https://raw.githubusercontent.com/ably/features/main/sdk.yaml
// - next URL gives 200 with content-type: text/plain; charset=utf-8

// Entry Point
(async () => {
  try {
    await render();
  } catch (error) {
    console.error(error);
    process.exit(2);
  }
})();

async function render() {
  const featuresSource = await fetch('https://github.com/ably/features/raw/main/sdk.yaml');

  const sdkManifestObjects = new ManifestObjects(
    ['this'],
    new Map([['this', resolveSource('.ably/capabilities.yaml')]]),
  );

  console.log(`Feature List Version from ${sdkManifestObjects.objects.size} manifests: ${sdkManifestObjects.commonVersion}`);

  build(
    featuresSource,
    sdkManifestObjects,
    'output',
  );
}

/**
 * Simple Web-Fetch-alike function to HTTP GET a resource.
 * API based upon: https://developer.mozilla.org/en-US/docs/Web/API/fetch
 * We need this because Node.js 16 (the maximum version supported by GitHub Actions) doesn't have Fetch.
 */
async function fetch(url) {
  return new Promise((resolve, reject) => {
    const fetchOrFollowRedirect = (location, depth) => {
      if (depth > 3) {
        throw new Error('Exceeded arbitrary redirect follow limit.');
      }

      https.get(location, (response) => {
        const { statusCode } = response;
        const contentType = response.headers['content-type'];

        if (statusCode === 302) {
          fetchOrFollowRedirect(response.headers.location, depth + 1);
          return;
        }

        let error;
        if (statusCode !== 200) {
          error = new Error(`Request failed with status code ${statusCode}.`);
        } else if (!/^text\/plain/.test(contentType)) {
          error = new Error(`Unexpected content-type. Expected 'text/plain' but received '${contentType}'.`);
        }

        if (error) {
          response.resume(); // Consume response data to free up memory
          reject(error);
          return;
        }

        response.setEncoding('utf8');
        let bodyData = '';
        response.on('data', (chunk) => { bodyData += chunk; });
        response.on('end', () => {
          resolve(bodyData);
        });
      });
    };

    fetchOrFollowRedirect(url, 0);
  });
}
