const core = require('@actions/core');
const https = require('node:https');
const { build, ManifestObjects } = require('@ably/features-core/html-matrix-build');
const { tailwindBuild } = require('./tailwind-wrapper');

const outputPath = 'output';

// Entry Point
(async () => {
  try {
    await render();
    inform();
  } catch (error) {
    console.error(error);
    process.exit(2);
  }
})();

async function render() {
  const featuresSource = await fetch('https://github.com/ably/features/raw/main/sdk.yaml');

  const sdkManifestObjects = new ManifestObjects(
    ['this'],
    new Map([['this', '.ably/capabilities.yaml']]),
  );

  console.log(`Feature List Version from ${sdkManifestObjects.objects.size} manifests: ${sdkManifestObjects.commonVersion}`);

  build(
    featuresSource,
    sdkManifestObjects,
    outputPath,
  );

  await tailwindBuild();
}

function inform() {
  const emit = (key, value) => {
    core.info(`${key}: ${value}`);
    core.setOutput(key, value);
  };

  emit('matrix-path', outputPath);
  emit('matrix-artifact-name', 'features');
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
